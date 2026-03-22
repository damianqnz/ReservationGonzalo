import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const bodySchema = z.object({
  propertyId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().max(200).optional(),
  roomId: z.string().optional(),
})

/** POST /api/calendar/block — block a date for a property or room */
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

  const { propertyId, date, reason, roomId } = result.data

  // Verify ownership
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  })
  if (!property) {
    return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
  }
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const blockDate = new Date(date + 'T00:00:00Z')

    if (roomId) {
      const blocked = await db.roomBlockedDate.create({
        data: { roomId, date: blockDate, reason: reason ?? null },
        select: { id: true, date: true, reason: true, roomId: true },
      })
      return NextResponse.json({ data: { ...blocked, type: 'room' }, error: null }, { status: 201 })
    }

    const blocked = await db.blockedDate.create({
      data: { propertyId, date: blockDate, reason: reason ?? null },
      select: { id: true, date: true, reason: true, propertyId: true },
    })
    return NextResponse.json({ data: { ...blocked, type: 'property' }, error: null }, { status: 201 })
  } catch (error) {
    console.error('[calendar/block/POST]', error)
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ data: null, error: 'Date already blocked.' }, { status: 409 })
    }
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
