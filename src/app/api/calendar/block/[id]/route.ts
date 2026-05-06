import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'

/** DELETE /api/calendar/block/[id]?type=property|room */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params
  const type = new URL(req.url).searchParams.get('type') ?? 'property'

  try {
    if (type === 'room') {
      await db.roomBlockedDate.delete({ where: { id } })
    } else {
      await db.blockedDate.delete({ where: { id } })
    }
    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    console.error('[calendar/block/[id]/DELETE]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
