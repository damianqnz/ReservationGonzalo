import { db } from '@/shared/lib/db'
import { parseICalFeed, generateICalFeed } from '@/domains/calendar/lib/ical'
import type { BookingForICal, BlockedDateForICal } from '@/domains/calendar/lib/ical'
import { BookingStatus } from '@prisma/client'
import type { SyncResult } from '@/domains/calendar/types'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

// ─── getICalUrl ───────────────────────────────────────────────────────────────

/**
 * Returns the public .ics export URL for a property or room.
 */
export function getICalUrl(propertyId: string, roomId?: string | null): string {
  if (roomId) {
    return `${BASE_URL}/api/ical/room/${roomId}`
  }
  return `${BASE_URL}/api/ical/${propertyId}`
}

// ─── generatePropertyICalFeed ─────────────────────────────────────────────────

/**
 * Fetches bookings and blocked dates for a property (or room) and returns
 * a valid RFC 5545 .ics string.
 */
export async function generatePropertyICalFeed(
  propertyId: string,
  roomId?: string | null,
): Promise<string> {
  const [property, rawBookings, blockedDates] = await Promise.all([
    db.property.findUnique({
      where: { id: propertyId },
      select: { title: true },
    }),
    db.booking.findMany({
      where: {
        propertyId,
        ...(roomId ? { roomId } : {}),
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      select: {
        confirmationCode: true,
        guestName: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
      orderBy: { checkIn: 'asc' },
    }),
    roomId
      ? db.roomBlockedDate.findMany({
          where: { roomId },
          select: { date: true, reason: true },
        })
      : db.blockedDate.findMany({
          where: { propertyId },
          select: { date: true, reason: true },
        }),
  ])

  const bookings: BookingForICal[] = rawBookings.map((b) => ({
    confirmationCode: b.confirmationCode,
    guestName: b.guestName,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    status: b.status,
  }))

  const blocked: BlockedDateForICal[] = blockedDates.map((d) => ({
    date: d.date,
    reason: d.reason,
  }))

  return generateICalFeed(bookings, blocked, property?.title ?? 'Propriedade')
}

// ─── syncExternalCalendar ─────────────────────────────────────────────────────

export type { SyncResult } from '@/domains/calendar/types'

/**
 * Fetches an external iCal feed (Airbnb, Booking.com, etc.), parses it, and
 * upserts blocked dates for the given property or room.
 * Old blocked dates previously imported from this source are removed first.
 */
export async function syncExternalCalendar(
  propertyId: string,
  roomId: string | null,
  icalUrl: string,
  source: string,
  syncId: string,
): Promise<SyncResult> {
  // 1. Fetch the remote .ics with a timeout
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  let icalContent: string
  try {
    const response = await fetch(icalUrl, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${icalUrl}`)
    }
    icalContent = await response.text()
  } finally {
    clearTimeout(timeout)
  }

  // 2. Parse events
  const events = parseICalFeed(icalContent)

  // 3. Build blocked date list from parsed events (one entry per day)
  const reasonPrefix = `Sync: ${source}`
  const datesToBlock: Date[] = []

  for (const event of events) {
    const current = new Date(event.startDate)
    // Iterate from startDate up to (but not including) endDate
    while (current < event.endDate) {
      datesToBlock.push(new Date(current))
      current.setUTCDate(current.getUTCDate() + 1)
    }
  }

  // 4. Replace old sync-imported dates in a transaction
  const syncedDates = await db.$transaction(async (tx) => {
    if (roomId) {
      await tx.roomBlockedDate.deleteMany({
        where: { roomId, reason: reasonPrefix },
      })
      if (datesToBlock.length > 0) {
        await tx.roomBlockedDate.createMany({
          data: datesToBlock.map((date) => ({
            roomId,
            date,
            reason: reasonPrefix,
          })),
          skipDuplicates: true,
        })
      }
    } else {
      await tx.blockedDate.deleteMany({
        where: { propertyId, reason: reasonPrefix },
      })
      if (datesToBlock.length > 0) {
        await tx.blockedDate.createMany({
          data: datesToBlock.map((date) => ({
            propertyId,
            date,
            reason: reasonPrefix,
          })),
          skipDuplicates: true,
        })
      }
    }

    // Update sync record
    await tx.iCalSync.update({
      where: { id: syncId },
      data: { lastSyncedAt: new Date(), syncedDates: datesToBlock.length },
    })

    return datesToBlock.length
  })

  return { syncedDates, source }
}

// ─── syncAllCalendars ─────────────────────────────────────────────────────────

/**
 * Syncs all active ICalSync records. Called by the cron endpoint.
 * Returns a summary of results.
 */
export async function syncAllCalendars(): Promise<{
  total: number
  succeeded: number
  failed: number
  errors: string[]
}> {
  const syncs = await db.iCalSync.findMany({
    select: {
      id: true,
      propertyId: true,
      roomId: true,
      icalUrl: true,
      source: true,
    },
  })

  let succeeded = 0
  let failed = 0
  const errors: string[] = []

  for (const sync of syncs) {
    try {
      await syncExternalCalendar(
        sync.propertyId,
        sync.roomId,
        sync.icalUrl,
        sync.source,
        sync.id,
      )
      succeeded++
    } catch (err) {
      failed++
      errors.push(`[${sync.source}] ${sync.icalUrl}: ${err instanceof Error ? err.message : String(err)}`)
      console.error('[icalService/syncAllCalendars]', err)
    }
  }

  return { total: syncs.length, succeeded, failed, errors }
}
