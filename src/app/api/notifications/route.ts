import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listNotifications, getUnreadCount } from '@/lib/services/notificationService'

// ─── GET /api/notifications ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

  try {
    if (unreadOnly) {
      const unreadCount = await getUnreadCount(session.user.id)
      return NextResponse.json({ data: { unreadCount }, error: null }, { status: 200 })
    }

    const data = await listNotifications(session.user.id, limit)
    return NextResponse.json({ data, error: null }, { status: 200 })
  } catch (error) {
    console.error('[notifications/GET]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
