import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAvailability, getUnavailableDates } from '@/services/availabilityService'

// ─── Schema: check a specific date range ──────────────────────────────────────
const rangeSchema = z.object({
  roomId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

// ─── Schema: get all unavailable dates for a property ────────────────────────
const blockedSchema = z.object({
  propertyId: z.string().min(1),
})

/**
 * GET /api/availability
 *
 * Mode 1 — range check:
 *   ?roomId=X&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *   → { data: { available: boolean }, error: null }
 *
 * Mode 2 — unavailable dates list:
 *   ?propertyId=X
 *   → { data: { unavailableDates: string[] }, error: null }
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)

  // Mode 2: only propertyId provided
  if ('propertyId' in params && !('roomId' in params)) {
    const result = blockedSchema.safeParse(params)
    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    try {
      const dates = await getUnavailableDates(result.data.propertyId)
      return NextResponse.json({
        data: { unavailableDates: dates.map((d) => d.toISOString()) },
        error: null,
      })
    } catch (error) {
      console.error('[availability/GET unavailable]', error)
      return NextResponse.json(
        { data: null, error: 'An unexpected error occurred.' },
        { status: 500 },
      )
    }
  }

  // Mode 1: range check
  const result = rangeSchema.safeParse(params)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { roomId, startDate, endDate } = result.data

  if (endDate <= startDate) {
    return NextResponse.json(
      { data: null, error: { endDate: ['endDate must be after startDate'] } },
      { status: 400 },
    )
  }

  try {
    const available = await checkAvailability(roomId, startDate, endDate)
    return NextResponse.json({ data: { available }, error: null })
  } catch (error) {
    console.error('[availability/GET range]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
