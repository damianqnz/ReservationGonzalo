import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import {
  listPropertyPricing,
  createPricingEntry,
} from '@/domains/property/services/propertyService'
import {
  createPricingEntrySchema,
} from '@/domains/pricing/validations/pricingSchema'

// ─── GET /api/properties/[id]/pricing ────────────────────────────────────────

export async function GET(
  _req: NextRequest,
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
  const result = await listPropertyPricing(id, session.user.id, session.user.role)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}

// ─── POST /api/properties/[id]/pricing ───────────────────────────────────────

export async function POST(
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = createPricingEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const result = await createPricingEntry(id, parsed.data, session.user.id, session.user.role)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null }, { status: 201 })
}
