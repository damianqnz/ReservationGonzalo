import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { getCoupons, createCoupon } from '@/domains/pricing/services/couponService'
import { createCouponSchema } from '@/domains/pricing/validations/couponSchema'

// ─── GET /api/coupons — owner only ───────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const coupons = await getCoupons()
    return NextResponse.json({ data: { coupons }, error: null })
  } catch (error) {
    console.error('[coupons/GET]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}

// ─── POST /api/coupons — owner only ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = createCouponSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const coupon = await createCoupon(result.data)
    return NextResponse.json({ data: { coupon }, error: null }, { status: 201 })
  } catch (error) {
    console.error('[coupons/POST]', error)
    if (error instanceof Error && error.message.includes('já existe')) {
      return NextResponse.json({ data: null, error: error.message }, { status: 409 })
    }
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
