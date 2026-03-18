import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { toggleCoupon, deleteCoupon } from '@/lib/services/couponService'

// ─── PATCH /api/coupons/[id] — toggle active/inactive ────────────────────────

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params

  try {
    const coupon = await toggleCoupon(id)
    return NextResponse.json({ data: { coupon }, error: null })
  } catch (error) {
    console.error('[coupons/[id]/PATCH]', error)
    if (error instanceof Error && error.message.includes('não encontrado')) {
      return NextResponse.json({ data: null, error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}

// ─── DELETE /api/coupons/[id] — only if no usages ────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params

  try {
    await deleteCoupon(id)
    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('[coupons/[id]/DELETE]', error)
    if (error instanceof Error) {
      if (error.message.includes('utilizações')) {
        return NextResponse.json({ data: null, error: error.message }, { status: 409 })
      }
      if (error.message.includes('não encontrado')) {
        return NextResponse.json({ data: null, error: error.message }, { status: 404 })
      }
    }
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
