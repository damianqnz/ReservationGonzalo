import { NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { markAllAsRead } from '@/domains/notification/services/notificationService'

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────

export async function PATCH() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const updated = await markAllAsRead(session.user.id)
    return NextResponse.json({ data: { updated }, error: null }, { status: 200 })
  } catch (error) {
    console.error('[notifications/read-all/PATCH]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
