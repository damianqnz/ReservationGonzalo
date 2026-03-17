import { NextRequest, NextResponse } from 'next/server'
import { BookingStatus } from '@prisma/client'
import { db } from '@/lib/db'
import {
  EMAIL_BOOKING_SELECT,
  sendCheckInReminderToGuest,
  sendCheckInReminderToOwner,
  sendCheckOutReminderToOwner,
  sendReviewInvitationToGuest,
} from '@/lib/services/emailService'

// ─── GET /api/cron/reminders ──────────────────────────────────────────────────
//
// Intended to be called daily by a cron service (e.g. Vercel Cron, GitHub Actions).
// Protected by Authorization: Bearer <CRON_SECRET>.
//
// Jobs:
//   1. checkIn tomorrow + CONFIRMED → remind guest + owner
//   2. checkOut today   + CONFIRMED → remind owner
//   3. checkOut yesterday + COMPLETED → invite guest to leave a review

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/reminders] CRON_SECRET is not set')
    return NextResponse.json({ data: null, error: 'Server misconfiguration.' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }

  // ── Date ranges (UTC midnight boundaries) ─────────────────────────────────
  const now = new Date()

  const tomorrowStart = new Date(now)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const yesterdayStart = new Date(now)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  yesterdayStart.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterdayStart)
  yesterdayEnd.setHours(23, 59, 59, 999)

  let processed = 0
  let errors = 0

  try {
    // ── 1. Check-in reminders (checkIn = tomorrow, status CONFIRMED) ──────────
    const checkInTomorrow = await db.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        checkIn: { gte: tomorrowStart, lte: tomorrowEnd },
      },
      select: EMAIL_BOOKING_SELECT,
    })

    for (const booking of checkInTomorrow) {
      const results = await Promise.allSettled([
        sendCheckInReminderToGuest(booking),
        sendCheckInReminderToOwner(booking),
      ])
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success) {
          processed++
        } else {
          errors++
          if (r.status === 'rejected') {
            console.error('[cron/reminders] checkIn reminder failed', r.reason)
          } else if (!r.value.success) {
            console.error('[cron/reminders] checkIn reminder failed', r.value.error)
          }
        }
      }
    }

    // ── 2. Check-out reminders (checkOut = today, status CONFIRMED) ───────────
    const checkOutToday = await db.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        checkOut: { gte: todayStart, lte: todayEnd },
      },
      select: EMAIL_BOOKING_SELECT,
    })

    for (const booking of checkOutToday) {
      const result = await sendCheckOutReminderToOwner(booking)
      if (result.success) {
        processed++
      } else {
        errors++
        console.error('[cron/reminders] checkOut reminder failed', result.error)
      }
    }

    // ── 3. Review invitations (checkOut = yesterday, status COMPLETED) ────────
    const checkOutYesterday = await db.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        checkOut: { gte: yesterdayStart, lte: yesterdayEnd },
      },
      select: EMAIL_BOOKING_SELECT,
    })

    for (const booking of checkOutYesterday) {
      const result = await sendReviewInvitationToGuest(booking)
      if (result.success) {
        processed++
      } else {
        errors++
        console.error('[cron/reminders] review invitation failed', result.error)
      }
    }

    return NextResponse.json({ data: { processed, errors }, error: null })
  } catch (err) {
    console.error('[cron/reminders]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error.' },
      { status: 500 },
    )
  }
}
