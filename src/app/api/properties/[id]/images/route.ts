import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/shared/lib/auth'
import {
  listPropertyImages,
  createPropertyImage,
} from '@/domains/property/services/propertyService'
import { createPropertyImageSchema } from '@/domains/property/validations/propertySchema'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId } = await params
    const body = await req.json()
    const validated = createPropertyImageSchema.parse(body)

    const result = await createPropertyImage(
      propertyId,
      validated,
      session.user.id,
      session.user.role
    )
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status })
    }
    return NextResponse.json({ data: result.data, error: null }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error('[PROPERTY_IMAGES_POST]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: propertyId } = await params
    const result = await listPropertyImages(propertyId)
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status })
    }
    return NextResponse.json({ data: result.data, error: null })
  } catch (error) {
    console.error('[PROPERTY_IMAGES_GET]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
