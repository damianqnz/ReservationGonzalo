import { BookingStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { isDateOverlap, normalizeDate } from '@/lib/date'

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
]

/**
 * Checks whether a property is available for the given date range.
 * Returns true if no active booking overlaps and no blocked dates exist.
 *
 * Overlap condition (half-open intervals):
 *   booking.checkIn  < requestedEnd
 *   booking.checkOut > requestedStart
 */
export async function checkAvailability(
  roomId: string,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)

  return db.$transaction(async (tx) => {
    const activeBookings = await tx.booking.findMany({
      where: {
        propertyId: roomId,
        status: { in: ACTIVE_STATUSES },
      },
      select: { checkIn: true, checkOut: true },
    })

    const hasConflict = activeBookings.some(({ checkIn, checkOut }) =>
      isDateOverlap(normalizeDate(checkIn), normalizeDate(checkOut), start, end),
    )

    if (hasConflict) return false

    const blockedDate = await tx.blockedDate.findFirst({
      where: {
        propertyId: roomId,
        date: { gte: start, lt: end },
      },
      select: { id: true },
    })

    return blockedDate === null
  })
}

/**
 * Returns all dates on which the property is unavailable:
 * every calendar day covered by an active booking plus every manually blocked date.
 */
export async function getUnavailableDates(roomId: string): Promise<Date[]> {
  const [activeBookings, blockedDates] = await Promise.all([
    db.booking.findMany({
      where: {
        propertyId: roomId,
        status: { in: ACTIVE_STATUSES },
      },
      select: { checkIn: true, checkOut: true },
    }),
    db.blockedDate.findMany({
      where: { propertyId: roomId },
      select: { date: true },
    }),
  ])

  const dateSet = new Set<string>()

  for (const { checkIn, checkOut } of activeBookings) {
    const cursor = normalizeDate(checkIn)
    const end = normalizeDate(checkOut)

    while (cursor < end) {
      dateSet.add(cursor.toISOString())
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  for (const { date } of blockedDates) {
    dateSet.add(normalizeDate(date).toISOString())
  }

  return Array.from(dateSet).map((iso) => new Date(iso)).sort((a, b) => a.getTime() - b.getTime())
}
