import { PricingRuleType } from '@prisma/client'

// ─── pricingService types ─────────────────────────────────────────────────────

export interface SeasonalPriceInput {
  startDate: Date
  endDate: Date
  pricePerNight: number
}

export interface PricingRuleInput {
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
  /** subtotal - longStayDiscount (accommodation cost only — does NOT include cleaningFee / securityDeposit) */
  totalPrice: number
  /** Average effective nightly price = totalPrice / nights */
  pricePerNight: number
}

// ─── couponService types ──────────────────────────────────────────────────────

export type ValidateCouponResult =
  | { valid: true; couponId: string; discount: number; finalPrice: number; description: string }
  | { valid: false; error: string }
