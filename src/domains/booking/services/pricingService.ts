import { db } from '@/shared/lib/db'
import { PricingRuleType } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeasonalPriceInput {
  startDate: Date
  endDate: Date
  pricePerNight: number
}

interface PricingRuleInput {
  type: PricingRuleType
  value: number
  isPercentage: boolean
}

export interface PriceBreakdown {
  nights: number
  /** Sum of nightly base prices (seasonal or default), without weekend markup */
  baseSubtotal: number
  weekendNights: number
  /** Total extra amount added for weekend nights */
  weekendMarkup: number
  /** baseSubtotal + weekendMarkup */
  subtotal: number
  longStayDiscount: number
  /** subtotal - longStayDiscount  (accommodation cost only — does NOT include cleaningFee / securityDeposit) */
  totalPrice: number
  /** Average effective nightly price = totalPrice / nights */
  pricePerNight: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUTC(d: Date): Date {
  const n = new Date(d)
  n.setUTCHours(0, 0, 0, 0)
  return n
}

function findSeasonal(
  date: Date,
  seasonalPrices: SeasonalPriceInput[]
): SeasonalPriceInput | undefined {
  return seasonalPrices.find((s) => {
    const start = normalizeUTC(s.startDate)
    const end = normalizeUTC(s.endDate)
    return date >= start && date <= end
  })
}

// ─── calculateNightlyPrice ────────────────────────────────────────────────────

/**
 * Calculates the price for a single night.
 * Priority: seasonal price → weekend markup → minimum price.
 * Does NOT apply long-stay discount (that is totals-level, not per-night).
 */
export function calculateNightlyPrice(
  basePrice: number,
  date: Date,
  seasonalPrices: SeasonalPriceInput[],
  pricingRules: PricingRuleInput[]
): number {
  const normalized = normalizeUTC(date)

  // 1. Seasonal override
  const seasonal = findSeasonal(normalized, seasonalPrices)
  const nightBase = seasonal ? seasonal.pricePerNight : basePrice

  let nightPrice = nightBase

  // 2. Weekend markup (Friday = 5, Saturday = 6 in UTC)
  const dow = normalized.getUTCDay()
  const isWeekend = dow === 5 || dow === 6
  if (isWeekend) {
    const rule = pricingRules.find((r) => r.type === PricingRuleType.WEEKEND_MARKUP)
    if (rule) {
      const markup = rule.isPercentage ? nightBase * (rule.value / 100) : rule.value
      nightPrice += markup
    }
  }

  // 3. Floor: minimum price
  const minRule = pricingRules.find((r) => r.type === PricingRuleType.MINIMUM_PRICE)
  if (minRule) {
    nightPrice = Math.max(nightPrice, minRule.value)
  }

  return nightPrice
}

// ─── calculateTotalPrice ──────────────────────────────────────────────────────

/**
 * Fetches pricing data from the DB and calculates the full price breakdown
 * for a stay. Returns accommodation cost only — cleaning fee and security
 * deposit must be added by the caller (reservationService).
 */
export async function calculateTotalPrice(
  propertyId: string,
  roomId: string | null,
  checkIn: Date,
  checkOut: Date
): Promise<PriceBreakdown> {
  const ci = normalizeUTC(checkIn)
  const co = normalizeUTC(checkOut)
  const nights = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24))

  if (nights <= 0) throw new Error('Check-out must be after check-in')

  // ── Fetch pricing data ────────────────────────────────────────────────────
  const property = await db.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: {
      pricePerNight: true,
      seasonalPrices: {
        where: { roomId: null },
        select: { startDate: true, endDate: true, pricePerNight: true },
      },
      pricingRules: {
        where: { roomId: null },
        select: { type: true, value: true, isPercentage: true },
      },
    },
  })

  let basePrice = property.pricePerNight
  let seasonalPrices: SeasonalPriceInput[] = property.seasonalPrices
  let pricingRules: PricingRuleInput[] = property.pricingRules

  if (roomId) {
    const room = await db.room.findUniqueOrThrow({
      where: { id: roomId },
      select: {
        pricePerNight: true,
        seasonalPrices: {
          select: { startDate: true, endDate: true, pricePerNight: true },
        },
        pricingRules: {
          select: { type: true, value: true, isPercentage: true },
        },
      },
    })

    basePrice = room.pricePerNight

    // Room rules take precedence over property rules of the same type
    const roomRuleTypes = new Set(room.pricingRules.map((r) => r.type))
    pricingRules = [
      ...room.pricingRules,
      ...property.pricingRules.filter((r) => !roomRuleTypes.has(r.type)),
    ]

    // Room seasonal prices + property seasonal prices (room wins when both match a date)
    seasonalPrices = [...room.seasonalPrices, ...property.seasonalPrices]
  }

  // ── Per-night calculation ─────────────────────────────────────────────────
  const weekendRule = pricingRules.find((r) => r.type === PricingRuleType.WEEKEND_MARKUP)
  const minRule = pricingRules.find((r) => r.type === PricingRuleType.MINIMUM_PRICE)

  let baseSubtotal = 0
  let weekendMarkup = 0
  let weekendNights = 0

  const cursor = new Date(ci)

  for (let i = 0; i < nights; i++) {
    const seasonal = findSeasonal(cursor, seasonalPrices)
    const nightBase = seasonal ? seasonal.pricePerNight : basePrice

    const dow = cursor.getUTCDay()
    const isWeekend = dow === 5 || dow === 6

    let nightPrice = nightBase

    if (isWeekend && weekendRule) {
      const markup = weekendRule.isPercentage
        ? nightBase * (weekendRule.value / 100)
        : weekendRule.value
      weekendMarkup += markup
      weekendNights++
      nightPrice += markup
    } else if (isWeekend) {
      weekendNights++
    }

    if (minRule) {
      nightPrice = Math.max(nightPrice, minRule.value)
    }

    baseSubtotal += nightBase
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const subtotal = baseSubtotal + weekendMarkup

  // ── Long-stay discount ────────────────────────────────────────────────────
  let longStayDiscount = 0
  const longStayRule = pricingRules.find((r) => r.type === PricingRuleType.LONG_STAY_DISCOUNT)

  if (nights >= 7 && longStayRule) {
    longStayDiscount = longStayRule.isPercentage
      ? subtotal * (longStayRule.value / 100)
      : longStayRule.value * nights
  }

  const totalPrice = Math.max(0, subtotal - longStayDiscount)

  // Apply minimum price floor to total after discount
  if (minRule) {
    const minTotal = minRule.value * nights
    if (totalPrice < minTotal) {
      longStayDiscount = Math.max(0, subtotal - minTotal)
    }
  }

  const finalTotal = Math.max(0, subtotal - longStayDiscount)

  return {
    nights,
    baseSubtotal,
    weekendNights,
    weekendMarkup,
    subtotal,
    longStayDiscount,
    totalPrice: finalTotal,
    pricePerNight: finalTotal / nights,
  }
}
