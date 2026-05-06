import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'

// ─── Validation schemas ───────────────────────────────────────────────────────

const patchSeasonalSchema = z.object({
  kind: z.literal('seasonal'),
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v))).optional(),
  pricePerNight: z.number().positive().optional(),
  minNights: z.number().int().min(1).nullable().optional(),
})

const patchRuleSchema = z.object({
  kind: z.literal('rule'),
  value: z.number().min(0).optional(),
  isPercentage: z.boolean().optional(),
})

const patchSchema = z.discriminatedUnion('kind', [patchSeasonalSchema, patchRuleSchema])

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function assertAccess(propertyId: string) {
  const session = await auth()
  if (!session?.user) return { ok: false, status: 401, error: 'Unauthorized.' } as const
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return { ok: false, status: 403, error: 'Forbidden.' } as const
  }
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true },
  })
  if (!property) return { ok: false, status: 404, error: 'Property not found.' } as const
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return { ok: false, status: 403, error: 'Forbidden.' } as const
  }
  return { ok: true } as const
}

// ─── PATCH /api/properties/[id]/pricing/[ruleId] ─────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { id, ruleId } = await params
  const access = await assertAccess(id)
  if (!access.ok) {
    return NextResponse.json({ data: null, error: access.error }, { status: access.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = patchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    if (result.data.kind === 'seasonal') {
      const { startDate, endDate, ...rest } = result.data
      const updated = await db.seasonalPrice.update({
        where: { id: ruleId },
        data: {
          ...rest,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
        },
        select: { id: true, name: true, startDate: true, endDate: true, pricePerNight: true, minNights: true, roomId: true },
      })
      return NextResponse.json({ data: updated, error: null })
    }

    // kind === 'rule'
    const { kind: _kind, ...ruleData } = result.data
    const updated = await db.pricingRule.update({
      where: { id: ruleId },
      data: ruleData,
      select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
    })
    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    console.error('[properties/[id]/pricing/[ruleId]/PATCH]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── DELETE /api/properties/[id]/pricing/[ruleId] ────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const { id, ruleId } = await params
  const access = await assertAccess(id)
  if (!access.ok) {
    return NextResponse.json({ data: null, error: access.error }, { status: access.status })
  }

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind')

  try {
    if (kind === 'seasonal') {
      await db.seasonalPrice.delete({ where: { id: ruleId } })
    } else {
      await db.pricingRule.delete({ where: { id: ruleId } })
    }
    return NextResponse.json({ data: { id: ruleId }, error: null })
  } catch (error) {
    console.error('[properties/[id]/pricing/[ruleId]/DELETE]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
