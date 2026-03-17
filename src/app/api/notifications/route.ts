import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listNotifications } from '@/lib/services/notificationService'

// ─── GET /api/notifications ───────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const data = await listNotifications(session.user.id, 20)
    return NextResponse.json({ data, error: null }, { status: 200 })
  } catch (error) {
    console.error('[notifications/GET]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
