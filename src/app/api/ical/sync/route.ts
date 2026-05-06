import { NextRequest, NextResponse } from 'next/server'
import { syncAllCalendars } from '@/domains/calendar/services/icalService'

/**
 * GET /api/ical/sync
 * Cron endpoint — called by Vercel Cron every 6 hours.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const result = await syncAllCalendars()
    console.error(
      `[ical/sync] Synced ${result.succeeded}/${result.total} calendars. Failed: ${result.failed}`,
    )

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error('[ical/sync/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
