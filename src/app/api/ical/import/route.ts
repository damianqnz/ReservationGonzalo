import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { syncExternalCalendar } from '@/domains/calendar/services/icalService'
import { importICalSchema } from '@/domains/calendar/validations/calendarSchema'

/**
 * POST /api/ical/import
 * Auth: OWNER / ADMIN
 * Creates or updates an ICalSync record and runs a first sync immediately.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = importICalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { propertyId, roomId = null, source, icalUrl } = parsed.data

  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  })
  if (!property) {
    return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
  }
  if (session.user.role !== 'ADMIN' && property.ownerId !== session.user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const sync = await db.iCalSync.create({
      data: {
        propertyId,
        roomId: roomId ?? null,
        source,
        icalUrl,
      },
    })

    const result = await syncExternalCalendar(
      propertyId,
      roomId ?? null,
      icalUrl,
      source,
      sync.id,
    )

    return NextResponse.json({
      data: { syncId: sync.id, syncedDates: result.syncedDates },
      error: null,
    }, { status: 201 })
  } catch (error) {
    console.error('[ical/import/POST]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

/**
 * DELETE /api/ical/import?syncId=...
 * Auth: OWNER / ADMIN
 * Removes an ICalSync record (does NOT remove already-imported blocked dates).
 */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const syncId = new URL(req.url).searchParams.get('syncId')
  if (!syncId) {
    return NextResponse.json({ data: null, error: 'syncId is required.' }, { status: 400 })
  }

  try {
    const sync = await db.iCalSync.findUnique({
      where: { id: syncId },
      select: { id: true, propertyId: true, property: { select: { ownerId: true } } },
    })
    if (!sync) {
      return NextResponse.json({ data: null, error: 'Sync not found.' }, { status: 404 })
    }
    if (session.user.role !== 'ADMIN' && sync.property.ownerId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
    }

    await db.iCalSync.delete({ where: { id: syncId } })

    return NextResponse.json({ data: { id: syncId }, error: null })
  } catch (error) {
    console.error('[ical/import/DELETE]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
