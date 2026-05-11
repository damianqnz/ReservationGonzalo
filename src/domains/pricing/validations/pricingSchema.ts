import { z } from 'zod'
import { PricingRuleType } from '@prisma/client'

// ─── Price calculation ────────────────────────────────────────────────────────

export const calculatePriceQuerySchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().optional(),
  checkIn: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid check-in date'),
  checkOut: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid check-out date'),
})

// ─── Pricing entries (seasonal prices + pricing rules) ────────────────────────

export const createSeasonalPriceSchema = z.object({
  kind: z.literal('seasonal'),
  name: z.string().min(1).max(100),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid start date'),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid end date'),
  pricePerNight: z.number().positive(),
  minNights: z.number().int().min(1).optional(),
  roomId: z.string().optional(),
})

export const createPricingRuleSchema = z.object({
  kind: z.literal('rule'),
  type: z.nativeEnum(PricingRuleType),
  value: z.number().min(0),
  isPercentage: z.boolean(),
  roomId: z.string().optional(),
})

export const createPricingEntrySchema = z.discriminatedUnion('kind', [
  createSeasonalPriceSchema,
  createPricingRuleSchema,
])

// ─── Pricing entry update ─────────────────────────────────────────────────────

export const updateSeasonalPriceSchema = z.object({
  kind: z.literal('seasonal'),
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  pricePerNight: z.number().positive().optional(),
  minNights: z.number().int().min(1).nullable().optional(),
})

export const updatePricingRuleSchema = z.object({
  kind: z.literal('rule'),
  value: z.number().min(0).optional(),
  isPercentage: z.boolean().optional(),
})

export const updatePricingEntrySchema = z.discriminatedUnion('kind', [
  updateSeasonalPriceSchema,
  updatePricingRuleSchema,
])
