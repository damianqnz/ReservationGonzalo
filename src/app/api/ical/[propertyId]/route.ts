import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePropertyICalFeed } from '@/lib/services/icalService'

/**
 * GET /api/ical/[propertyId]
 * Public endpoint — returns the .ics feed for a property.
 * Compatible with Airbnb, Booking.com, Google Calendar imports.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await params

  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  })

  if (!property) {
    return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
  }

  try {
    const ics = await generatePropertyICalFeed(propertyId, null)

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="property-${propertyId}.ics"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[ical/[propertyId]/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
