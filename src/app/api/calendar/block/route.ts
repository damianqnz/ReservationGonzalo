import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Validation ───────────────────────────────────────────────────────────────

const bodySchema = z.object({
  propertyId: z.string().min(1),
  startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  reason:     z.string().max(200).optional(),
  roomId:     z.string().optional(),
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function eachDateInRange(startStr: string, endStr: string): Date[] {
  const dates: Date[] = []
  const cursor = new Date(startStr + 'T00:00:00Z')
  const end    = new Date(endStr   + 'T00:00:00Z')
  if (end < cursor) return dates
  while (cursor <= end) {
    dates.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

// ─── POST /api/calendar/block — block a date range for a property or room ─────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON.' }, { status: 400 })
  }

  const result = bodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ data: null, error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const { propertyId, startDate, endDate, reason, roomId } = result.data

  if (endDate < startDate) {
    return NextResponse.json(
      { data: null, error: 'endDate must be on or after startDate.' },
      { status: 400 },
    )
  }

  // Verify ownership
  const property = await db.property.findUnique({
    where:  { id: propertyId },
    select: { ownerId: true },
  })
  if (!property) {
    return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
  }
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const dates = eachDateInRange(startDate, endDate)

    let count = 0
    if (roomId) {
      const created = await db.roomBlockedDate.createMany({
        data:           dates.map((d) => ({ roomId, date: d, reason: reason ?? null })),
        skipDuplicates: true,
      })
      count = created.count
    } else {
      const created = await db.blockedDate.createMany({
        data:           dates.map((d) => ({ propertyId, date: d, reason: reason ?? null })),
        skipDuplicates: true,
      })
      count = created.count
    }

    return NextResponse.json({ data: { count }, error: null }, { status: 201 })
  } catch (error) {
    console.error('[calendar/block/POST]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
