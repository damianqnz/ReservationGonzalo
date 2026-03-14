import { BookingStatus } from '@prisma/client'
import { db } from '@/lib/db'

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
]

/**
 * Checks whether a property is available for the given date range.
 * Returns true if no active booking overlaps and no blocked dates exist.
 *
 * Overlap condition (half-open intervals):
 *   booking.checkIn  < requestedCheckOut
 *   booking.checkOut > requestedCheckIn
 */
export async function checkAvailability(
  roomId: string,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const overlappingBooking = await tx.booking.findFirst({
      where: {
        propertyId: roomId,
        status: { in: ACTIVE_STATUSES },
        checkIn: { lt: endDate },
        checkOut: { gt: startDate },
      },
      select: { id: true },
    })

    if (overlappingBooking) return false

    // Normalise to midnight UTC for date-only comparison
    const start = new Date(startDate)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setUTCHours(0, 0, 0, 0)

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
    const cursor = new Date(checkIn)
    cursor.setUTCHours(0, 0, 0, 0)
    const end = new Date(checkOut)
    end.setUTCHours(0, 0, 0, 0)

    while (cursor < end) {
      dateSet.add(cursor.toISOString())
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  for (const { date } of blockedDates) {
    const d = new Date(date)
    d.setUTCHours(0, 0, 0, 0)
    dateSet.add(d.toISOString())
  }

  return Array.from(dateSet).map((iso) => new Date(iso)).sort((a, b) => a.getTime() - b.getTime())
}
