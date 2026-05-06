import { NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { BookingStatus, PaymentStatus } from '@prisma/client'

const DAY_MS = 86_400_000

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const ownerId = session.user.id

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const daysInMonth = monthEnd.getDate()
    const weekFromNow = new Date(now.getTime() + 7 * DAY_MS)

    const [totalBookings, pendingBookings, confirmedBookings, revenueAgg, properties] =
      await db.$transaction([
        db.booking.count({ where: { property: { ownerId } } }),
        db.booking.count({ where: { property: { ownerId }, status: BookingStatus.PENDING } }),
        db.booking.count({ where: { property: { ownerId }, status: BookingStatus.CONFIRMED } }),
        db.booking.aggregate({
          where: { property: { ownerId }, paymentStatus: PaymentStatus.PAID },
          _sum: { totalPrice: true },
        }),
        db.property.findMany({ where: { ownerId }, select: { id: true } }),
      ])

    const occupancyBookings = await db.booking.findMany({
      where: {
        property: { ownerId },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn: { lt: monthEnd },
        checkOut: { gt: monthStart },
      },
      select: { checkIn: true, checkOut: true },
    })

    let occupiedDays = 0
    for (const b of occupancyBookings) {
      const start = b.checkIn > monthStart ? b.checkIn : monthStart
      const end = b.checkOut < monthEnd ? b.checkOut : monthEnd
      occupiedDays += Math.max(0, Math.ceil((end.getTime() - start.getTime()) / DAY_MS))
    }
    const totalCapacityDays = daysInMonth * Math.max(1, properties.length)
    const occupancyRate = Math.min(100, Math.round((occupiedDays / totalCapacityDays) * 100))

    const upcomingCheckIns = await db.booking.count({
      where: {
        property: { ownerId },
        status: BookingStatus.CONFIRMED,
        checkIn: { gte: now, lte: weekFromNow },
      },
    })

    return NextResponse.json({
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalRevenue: revenueAgg._sum.totalPrice ?? 0,
        occupancyRate,
        upcomingCheckIns,
        propertyCount: properties.length,
      },
      error: null,
    })
  } catch (error) {
    console.error('[dashboard/stats/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
