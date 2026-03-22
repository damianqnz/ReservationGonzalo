import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePropertyICalFeed } from '@/lib/services/icalService'

/**
 * GET /api/ical/room/[roomId]
 * Public endpoint — returns the .ics feed for a specific room.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params

  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { id: true, propertyId: true },
  })

  if (!room) {
    return NextResponse.json({ data: null, error: 'Room not found.' }, { status: 404 })
  }

  try {
    const ics = await generatePropertyICalFeed(room.propertyId, roomId)

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="room-${roomId}.ics"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[ical/room/[roomId]/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
