import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CouponType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { getCoupons, createCoupon } from '@/lib/services/couponService'

// ─── Validation ───────────────────────────────────────────────────────────────

const postSchema = z.object({
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9_-]+$/i, 'Apenas letras, números, hífens e underscores'),
  type: z.nativeEnum(CouponType),
  discountValue: z.number().positive('Deve ser um valor positivo'),
  description: z.string().max(200).optional(),
  maxUses: z.number().int().positive().optional(),
  minNights: z.number().int().positive().optional(),
  minOrderAmount: z.number().positive().optional(),
  expiresAt: z.coerce.date().optional(),
})

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

  const result = postSchema.safeParse(body)
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
