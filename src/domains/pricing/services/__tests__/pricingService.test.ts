import { calculateNightlyPrice } from '../pricingService'
import { PricingRuleType } from '@prisma/client'

// calculateNightlyPrice is a pure function — no DB mocks needed.

// UTC weekday references
const WED = new Date('2025-01-08T00:00:00.000Z') // Wednesday (UTC day = 3)
const FRI = new Date('2025-01-10T00:00:00.000Z') // Friday   (UTC day = 5)
const SAT = new Date('2025-01-11T00:00:00.000Z') // Saturday (UTC day = 6)
const SUN = new Date('2025-01-12T00:00:00.000Z') // Sunday   (UTC day = 0)
const MON = new Date('2025-01-13T00:00:00.000Z') // Monday   (UTC day = 1)

describe('calculateNightlyPrice — no rules', () => {
  it('returns basePrice when no seasonal prices and no rules', () => {
    expect(calculateNightlyPrice(100, WED, [], [])).toBe(100)
  })
})

describe('calculateNightlyPrice — seasonal override', () => {
  const seasonal = [
    {
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-01-31T00:00:00.000Z'),
      pricePerNight: 180,
    },
  ]

  it('uses seasonal price when date falls within range', () => {
    expect(calculateNightlyPrice(100, WED, seasonal, [])).toBe(180)
  })

  it('uses basePrice when date is outside seasonal range', () => {
    const feb = new Date('2025-02-05T00:00:00.000Z')
    expect(calculateNightlyPrice(100, feb, seasonal, [])).toBe(100)
  })
})

describe('calculateNightlyPrice — weekend markup (flat)', () => {
  const rules = [{ type: PricingRuleType.WEEKEND_MARKUP, value: 25, isPercentage: false }]

  it('applies markup on Friday', () => {
    expect(calculateNightlyPrice(100, FRI, [], rules)).toBe(125)
  })

  it('applies markup on Saturday', () => {
    expect(calculateNightlyPrice(100, SAT, [], rules)).toBe(125)
  })

  it('does NOT apply markup on Sunday', () => {
    expect(calculateNightlyPrice(100, SUN, [], rules)).toBe(100)
  })

  it('does NOT apply markup on Monday', () => {
    expect(calculateNightlyPrice(100, MON, [], rules)).toBe(100)
  })

  it('does NOT apply markup on Wednesday', () => {
    expect(calculateNightlyPrice(100, WED, [], rules)).toBe(100)
  })
})

describe('calculateNightlyPrice — weekend markup (percentage)', () => {
  const rules = [{ type: PricingRuleType.WEEKEND_MARKUP, value: 10, isPercentage: true }]

  it('applies 10% markup on Friday', () => {
    expect(calculateNightlyPrice(200, FRI, [], rules)).toBe(220)
  })

  it('applies percentage markup on the seasonal base, not the original base', () => {
    const seasonal = [
      {
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: new Date('2025-01-31T00:00:00.000Z'),
        pricePerNight: 300,
      },
    ]
    // 10% of 300 = 30, total = 330
    expect(calculateNightlyPrice(100, FRI, seasonal, rules)).toBe(330)
  })
})

describe('calculateNightlyPrice — minimum price floor', () => {
  const rules = [{ type: PricingRuleType.MINIMUM_PRICE, value: 80, isPercentage: false }]

  it('raises price to minimum when base is below floor', () => {
    expect(calculateNightlyPrice(50, WED, [], rules)).toBe(80)
  })

  it('does not lower price when base is above floor', () => {
    expect(calculateNightlyPrice(100, WED, [], rules)).toBe(100)
  })

  it('applies minimum floor after weekend markup', () => {
    const combinedRules = [
      { type: PricingRuleType.WEEKEND_MARKUP, value: 10, isPercentage: false },
      { type: PricingRuleType.MINIMUM_PRICE, value: 80, isPercentage: false },
    ]
    // 40 base + 10 markup = 50, still below 80 → floor kicks in
    expect(calculateNightlyPrice(40, FRI, [], combinedRules)).toBe(80)
  })
})
