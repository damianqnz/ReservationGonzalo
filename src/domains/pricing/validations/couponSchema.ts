import { z } from 'zod'
import { CouponType } from '@prisma/client'

// ─── Coupon CRUD ──────────────────────────────────────────────────────────────

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9_-]+$/i, 'Apenas letras, números, hífens e underscores'),
  type: z.nativeEnum(CouponType),
  discountValue: z.number().positive('Deve ser um valor positivo'),
  description: z.string().max(200).optional(),
  maxUses: z.number().int().positive().optional(),
  minNights: z.number().int().positive().optional(),
  minOrderAmount: z.number().positive().optional(),
  expiresAt: z.coerce.date().optional(),
})

// ─── Coupon apply / validate ──────────────────────────────────────────────────

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  bookingId: z.string().cuid(),
})

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  bookingId: z.string().cuid(),
})
