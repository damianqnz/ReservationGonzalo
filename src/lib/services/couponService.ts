import { CouponType, BookingStatus } from '@prisma/client'
import { db } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidateCouponResult =
  | { valid: true; couponId: string; discount: number; finalPrice: number; description: string }
  | { valid: false; error: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculates the discount amount based on coupon type and total price.
 * MULTIPLE_USE: discountValue < 100 → percentage; >= 100 → fixed EUR amount.
 */
function calculateDiscount(type: CouponType, discountValue: number, totalPrice: number): number {
  switch (type) {
    case CouponType.PERCENTAGE:
    case CouponType.FIRST_BOOKING:
      return Math.round(totalPrice * (discountValue / 100) * 100) / 100

    case CouponType.FIXED_AMOUNT:
      return Math.min(discountValue, totalPrice)

    case CouponType.MULTIPLE_USE:
      return discountValue < 100
        ? Math.round(totalPrice * (discountValue / 100) * 100) / 100
        : Math.min(discountValue, totalPrice)
  }
}

function buildDescription(type: CouponType, discountValue: number, custom?: string | null): string {
  if (custom) return custom
  if (type === CouponType.FIXED_AMOUNT) return `Desconto de €${discountValue.toFixed(0)}`
  if (type === CouponType.FIRST_BOOKING) return `${discountValue}% primeira reserva`
  if (type === CouponType.MULTIPLE_USE) {
    return discountValue < 100
      ? `Desconto de ${discountValue}%`
      : `Desconto de €${discountValue.toFixed(0)}`
  }
  return `Desconto de ${discountValue}%`
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Validates a coupon code for a given booking and guest email.
 * Checks: active, not expired, not exceeded maxUses, minNights, minOrderAmount,
 * and for FIRST_BOOKING type verifies the guest has no prior confirmed reservations.
 */
export async function validateCoupon(
  code: string,
  bookingId: string,
  guestEmail: string,
): Promise<ValidateCouponResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      totalPrice: true,
      nights: true,
      status: true,
      couponUsage: { select: { id: true } },
    },
  })

  if (!booking) return { valid: false, error: 'Reserva não encontrada.' }
  if (booking.status !== BookingStatus.PENDING)
    return { valid: false, error: 'Reserva não está pendente.' }
  if (booking.couponUsage)
    return { valid: false, error: 'Esta reserva já tem um cupão aplicado.' }

  const coupon = await db.coupon.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
  })

  if (!coupon) return { valid: false, error: 'Código inválido ou expirado.' }
  if (!coupon.isActive) return { valid: false, error: 'Este cupão está inativo.' }
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    return { valid: false, error: 'Este cupão expirou.' }
  if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses)
    return { valid: false, error: 'Este cupão já atingiu o limite de utilizações.' }
  if (coupon.minNights !== null && booking.nights < coupon.minNights)
    return {
      valid: false,
      error: `Este cupão requer uma estadia mínima de ${coupon.minNights} noites.`,
    }
  if (coupon.minOrderAmount !== null && booking.totalPrice < coupon.minOrderAmount)
    return {
      valid: false,
      error: `Este cupão requer um valor mínimo de €${coupon.minOrderAmount.toFixed(0)}.`,
    }

  // FIRST_BOOKING: guest must have no prior confirmed/completed bookings
  if (coupon.type === CouponType.FIRST_BOOKING) {
    const prior = await db.booking.findFirst({
      where: {
        guestEmail: { equals: guestEmail, mode: 'insensitive' },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
      select: { id: true },
    })
    if (prior) return { valid: false, error: 'Este cupão é apenas para a primeira reserva.' }
  }

  const discount = calculateDiscount(coupon.type, coupon.discountValue, booking.totalPrice)
  const finalPrice = Math.max(0, booking.totalPrice - discount)

  return {
    valid: true,
    couponId: coupon.id,
    discount,
    finalPrice,
    description: buildDescription(coupon.type, coupon.discountValue, coupon.description),
  }
}

/**
 * Atomically applies a coupon to a booking:
 * creates CouponUsage, increments currentUses, and sets discountAmount on Booking.
 */
export async function applyCoupon(
  code: string,
  bookingId: string,
  guestEmail: string,
  discount: number,
) {
  const coupon = await db.coupon.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
    select: { id: true },
  })
  if (!coupon) throw new Error('Cupão não encontrado.')

  return db.$transaction(async (tx) => {
    const usage = await tx.couponUsage.create({
      data: { couponId: coupon.id, bookingId, guestEmail, discount },
    })

    await tx.coupon.update({
      where: { id: coupon.id },
      data: { currentUses: { increment: 1 } },
    })

    await tx.booking.update({
      where: { id: bookingId },
      data: { discountAmount: discount },
    })

    return usage
  })
}

/**
 * Creates a new coupon. Throws if code already exists (case-insensitive).
 */
export async function createCoupon(data: {
  code: string
  type: CouponType
  discountValue: number
  description?: string
  maxUses?: number
  minNights?: number
  minOrderAmount?: number
  expiresAt?: Date
}) {
  const existing = await db.coupon.findFirst({
    where: { code: { equals: data.code, mode: 'insensitive' } },
    select: { id: true },
  })
  if (existing) throw new Error('Código de cupão já existe.')

  return db.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      discountValue: data.discountValue,
      description: data.description,
      maxUses: data.maxUses ?? null,
      minNights: data.minNights ?? null,
      minOrderAmount: data.minOrderAmount ?? null,
      expiresAt: data.expiresAt ?? null,
    },
  })
}

/**
 * Returns all coupons with their usage count and total discount generated.
 */
export async function getCoupons() {
  return db.coupon.findMany({
    include: {
      usages: { select: { discount: true } },
      _count: { select: { usages: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Toggles the isActive flag of a coupon.
 */
export async function toggleCoupon(id: string) {
  const coupon = await db.coupon.findUnique({ where: { id }, select: { isActive: true } })
  if (!coupon) throw new Error('Cupão não encontrado.')
  return db.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } })
}

/**
 * Deletes a coupon. Throws if it has any usages.
 */
export async function deleteCoupon(id: string) {
  const count = await db.couponUsage.count({ where: { couponId: id } })
  if (count > 0) throw new Error('Não é possível eliminar um cupão com utilizações registadas.')
  return db.coupon.delete({ where: { id } })
}
