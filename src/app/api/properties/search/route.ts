import { NextRequest, NextResponse } from 'next/server'
import { searchProperties } from '@/domains/property/services/propertyService'
import { searchPropertySchema } from '@/domains/property/validations/propertySchema'

/**
 * GET /api/properties/search — public
 * Returns ACTIVE properties available for the given dates and guest count.
 *
 * Query params:
 *   checkIn  — ISO date string (optional)
 *   checkOut — ISO date string (optional)
 *   guests   — integer (optional)
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)

  const parsed = searchPropertySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { checkIn, checkOut, guests } = parsed.data

  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    return NextResponse.json(
      { data: null, error: 'Both checkIn and checkOut are required together.' },
      { status: 400 },
    )
  }

  if (checkIn && checkOut && checkOut <= checkIn) {
    return NextResponse.json(
      { data: null, error: 'checkOut must be after checkIn.' },
      { status: 400 },
    )
  }

  const result = await searchProperties({ checkIn, checkOut, guests })
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}
