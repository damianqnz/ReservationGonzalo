import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import {
  updatePricingEntry,
  deletePricingEntry,
} from '@/domains/property/services/propertyService'
import {
  updatePricingEntrySchema,
} from '@/domains/pricing/validations/pricingSchema'

// ─── PATCH /api/properties/[id]/pricing/[ruleId] ─────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id, ruleId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = updatePricingEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const result = await updatePricingEntry(
    ruleId,
    parsed.data,
    id,
    session.user.id,
    session.user.role
  )
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}

// ─── DELETE /api/properties/[id]/pricing/[ruleId] ────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id, ruleId } = await params
  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind')

  const result = await deletePricingEntry(
    ruleId,
    kind,
    id,
    session.user.id,
    session.user.role
  )
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}
