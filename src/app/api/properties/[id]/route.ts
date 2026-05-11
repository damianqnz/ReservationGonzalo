import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from '@/domains/property/services/propertyService'
import {
  updatePropertySchema,
} from '@/domains/property/validations/propertySchema'

// ─── GET /api/properties/[id] — public ───────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = await getPropertyById(id)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}

// ─── PATCH /api/properties/[id] — owner auth, verify ownerId ─────────────────

export async function PATCH(
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

  const parsed = updatePropertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const result = await updateProperty(id, parsed.data, session.user.id, session.user.role)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}

// ─── DELETE /api/properties/[id] — owner or admin, hard delete ───────────────

export async function DELETE(
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

  const result = await deleteProperty(id, session.user.id, session.user.role)
  if (result.error) {
    return NextResponse.json({ data: null, error: result.error }, { status: result.status })
  }
  return NextResponse.json({ data: result.data, error: null })
}
