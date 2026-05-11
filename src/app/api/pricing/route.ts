import { NextRequest, NextResponse } from 'next/server'
import { calculateTotalPrice } from '@/domains/pricing/services/pricingService'
import { calculatePriceQuerySchema } from '@/domains/pricing/validations/pricingSchema'

/**
 * GET /api/pricing — calculate price breakdown for given dates.
 * Used by checkout page and property page for price preview.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const result = calculatePriceQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { propertyId, roomId, checkIn, checkOut } = result.data

  try {
    const breakdown = await calculateTotalPrice(
      propertyId,
      roomId ?? null,
      new Date(checkIn),
      new Date(checkOut),
    )

    return NextResponse.json({ data: breakdown, error: null })
  } catch (error) {
    console.error('[pricing/GET]', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ data: null, error: message }, { status: 400 })
  }
}
