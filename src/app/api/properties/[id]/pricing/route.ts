import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PricingRuleType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Validation schemas ───────────────────────────────────────────────────────

const seasonalSchema = z.object({
  kind: z.literal('seasonal'),
  name: z.string().min(1).max(100),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid start date'),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid end date'),
  pricePerNight: z.number().positive(),
  minNights: z.number().int().min(1).optional(),
  roomId: z.string().optional(),
})

const ruleSchema = z.object({
  kind: z.literal('rule'),
  type: z.nativeEnum(PricingRuleType),
  value: z.number().min(0),
  isPercentage: z.boolean(),
  roomId: z.string().optional(),
})

const postSchema = z.discriminatedUnion('kind', [seasonalSchema, ruleSchema])

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function assertOwnerOrAdmin(propertyId: string) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized.', status: 401 } as const
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return { error: 'Forbidden.', status: 403 } as const
  }

  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true },
  })
  if (!property) return { error: 'Property not found.', status: 404 } as const
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return { error: 'Forbidden.', status: 403 } as const
  }

  return { error: null, propertyId: property.id }
}

// ─── GET /api/properties/[id]/pricing ────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const check = await assertOwnerOrAdmin(id)
  if (check.error) {
    return NextResponse.json({ data: null, error: check.error }, { status: check.status })
  }

  try {
    const [seasonalPrices, pricingRules, rooms] = await Promise.all([
      db.seasonalPrice.findMany({
        where: { propertyId: id },
        orderBy: { startDate: 'asc' },
        select: {
          id: true, name: true, startDate: true, endDate: true,
          pricePerNight: true, minNights: true, roomId: true,
        },
      }),
      db.pricingRule.findMany({
        where: { propertyId: id },
        select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
      }),
      db.room.findMany({
        where: { propertyId: id, status: 'ACTIVE' },
        orderBy: { order: 'asc' },
        select: { id: true, name: true },
      }),
    ])

    return NextResponse.json({ data: { seasonalPrices, pricingRules, rooms }, error: null })
  } catch (error) {
    console.error('[properties/[id]/pricing/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── POST /api/properties/[id]/pricing ───────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const check = await assertOwnerOrAdmin(id)
  if (check.error) {
    return NextResponse.json({ data: null, error: check.error }, { status: check.status })
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
    if (result.data.kind === 'seasonal') {
      const { name, startDate, endDate, pricePerNight, minNights, roomId } = result.data
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (end <= start) {
        return NextResponse.json(
          { data: null, error: 'End date must be after start date.' },
          { status: 400 },
        )
      }

      const seasonal = await db.seasonalPrice.create({
        data: {
          propertyId: id,
          roomId: roomId ?? null,
          name,
          startDate: start,
          endDate: end,
          pricePerNight,
          minNights: minNights ?? null,
        },
        select: { id: true, name: true, startDate: true, endDate: true, pricePerNight: true, minNights: true, roomId: true },
      })

      return NextResponse.json({ data: seasonal, error: null }, { status: 201 })
    }

    // kind === 'rule'
    const { type, value, isPercentage, roomId } = result.data

    // Upsert: update if a rule of this type already exists for this property+room combo
    const existing = await db.pricingRule.findFirst({
      where: { propertyId: id, type, roomId: roomId ?? null },
      select: { id: true },
    })

    const rule = existing
      ? await db.pricingRule.update({
          where: { id: existing.id },
          data: { value, isPercentage },
          select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
        })
      : await db.pricingRule.create({
          data: { propertyId: id, roomId: roomId ?? null, type, value, isPercentage },
          select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
        })

    return NextResponse.json({ data: rule, error: null }, { status: 201 })
  } catch (error) {
    console.error('[properties/[id]/pricing/POST]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
