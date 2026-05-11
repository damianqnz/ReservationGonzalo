import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { listProperties, createProperty } from '@/domains/property/services/propertyService'
import { createPropertySchema } from '@/domains/property/validations/propertySchema'

// ─── GET /api/properties — public, returns ACTIVE properties ─────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const ownerId = searchParams.get('ownerId') ?? undefined

  const result = await listProperties(page, limit, ownerId)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}

// ─── POST /api/properties — owner auth required ───────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = createPropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const result = await createProperty(parsed.data, session.user.id)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null }, { status: 201 })
}
