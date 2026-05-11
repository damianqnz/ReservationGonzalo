import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/shared/lib/auth'
import {
  updatePropertyImage,
  deletePropertyImage,
} from '@/domains/property/services/propertyService'
import { updatePropertyImageSchema } from '@/domains/property/validations/propertySchema'

type RouteContext = { params: Promise<{ id: string; imageId: string }> }

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId, imageId } = await params
    const body = await req.json()
    const validated = updatePropertyImageSchema.parse(body)

    const result = await updatePropertyImage(
      propertyId,
      imageId,
      validated,
      session.user.id,
      session.user.role
    )
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status })
    }
    return NextResponse.json({ data: result.data, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error('[PROPERTY_IMAGE_PATCH]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { id: propertyId, imageId } = await params

    const result = await deletePropertyImage(
      propertyId,
      imageId,
      session.user.id,
      session.user.role
    )
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status })
    }
    return NextResponse.json({ data: result.data, error: null })
  } catch (error) {
    console.error('[PROPERTY_IMAGE_DELETE]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
