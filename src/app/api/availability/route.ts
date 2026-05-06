import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  checkAvailability,
  checkRoomAvailability,
  getUnavailableDates,
  getUnavailableDatesForRoom,
} from '@/domains/booking/services/availabilityService'
import { db } from '@/shared/lib/db'

// ─── Schema: check a specific date range ──────────────────────────────────────
const rangeSchema = z.object({
  propertyId: z.string().optional(),
  roomId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

// ─── Schema: get all unavailable dates ────────────────────────────────────────
const blockedSchema = z.object({
  propertyId: z.string().optional(),
  roomId: z.string().optional(),
})

/**
 * GET /api/availability
 *
 * Mode 1 — range check:
 *   ?propertyId=X&roomId=Y&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *   → { data: { available: boolean }, error: null }
 *
 * Mode 2 — unavailable dates list:
 *   ?propertyId=X&roomId=Y
 *   → { data: { unavailableDates: string[] }, error: null }
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)

  // Mode 2: get unavailable dates list
  if (!('startDate' in params) && !('endDate' in params)) {
    const result = blockedSchema.safeParse(params)
    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { propertyId, roomId } = result.data

    try {
      let dates: Date[] = []
      if (roomId) {
        dates = await getUnavailableDatesForRoom(roomId)
      } else if (propertyId) {
        dates = await getUnavailableDates(propertyId)
      } else {
        return NextResponse.json(
          { data: null, error: 'propertyId or roomId required' },
          { status: 400 },
        )
      }

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

  const { propertyId, roomId, startDate, endDate } = result.data

  if (endDate <= startDate) {
    return NextResponse.json(
      { data: null, error: { endDate: ['endDate must be after startDate'] } },
      { status: 400 },
    )
  }

  try {
    let available = false
    if (roomId) {
      available = await checkRoomAvailability(roomId, startDate, endDate)
    } else if (propertyId) {
      available = await checkAvailability(propertyId, startDate, endDate)
    } else {
      return NextResponse.json(
        { data: null, error: 'propertyId or roomId required' },
        { status: 400 },
      )
    }

    // Silent background SearchEvent save — never blocks the response
    const sessionId = req.cookies.get('rg-session-id')?.value ?? crypto.randomUUID()
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? undefined
    const response = NextResponse.json({ data: { available }, error: null })
    response.cookies.set('rg-session-id', sessionId, { httpOnly: true, maxAge: 86400, path: '/' })

    void Promise.allSettled([
      db.searchEvent.create({
        data: {
          propertyId: propertyId ?? null,
          roomId: roomId ?? null,
          checkIn: startDate,
          checkOut: endDate,
          sessionId,
          ipAddress: ipAddress ?? null,
        },
      }),
    ])

    return response
  } catch (error) {
    console.error('[availability/GET range]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
