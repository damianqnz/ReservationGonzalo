import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAsRead } from '@/lib/services/notificationService'
import { db } from '@/lib/db'

// ─── PATCH /api/notifications/[id]/read ──────────────────────────────────────

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership before marking as read
  const notification = await db.notification.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!notification) {
    return NextResponse.json({ data: null, error: 'Not found.' }, { status: 404 })
  }
  if (notification.userId !== session.user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const updated = await markAsRead(id)
    return NextResponse.json({ data: updated, error: null }, { status: 200 })
  } catch (error) {
    console.error('[notifications/[id]/read/PATCH]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
