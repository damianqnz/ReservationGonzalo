import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ImageCategory } from '@prisma/client'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { deleteImage } from '@/shared/lib/cloudinary-server'

const patchSchema = z.object({
  order:    z.number().int().min(0).optional(),
  isCover:  z.boolean().optional(),
  alt:      z.string().max(200).optional(),
  category: z.nativeEnum(ImageCategory).optional(),
})

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
    const validated = patchSchema.parse(body)

    // Verify ownership
    const existing = await db.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: { select: { ownerId: true } } },
    })
    if (!existing || existing.propertyId !== propertyId) {
      return NextResponse.json({ data: null, error: 'Image not found' }, { status: 404 })
    }
    if (existing.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    // If setting as cover, unset existing cover
    if (validated.isCover) {
      await db.propertyImage.updateMany({
        where: { propertyId, isCover: true, id: { not: imageId } },
        data: { isCover: false },
      })
    }

    const updated = await db.propertyImage.update({
      where: { id: imageId },
      data: {
        ...(validated.order    !== undefined && { order:    validated.order }),
        ...(validated.isCover  !== undefined && { isCover:  validated.isCover }),
        ...(validated.alt      !== undefined && { alt:      validated.alt }),
        ...(validated.category !== undefined && { category: validated.category }),
      },
    })

    return NextResponse.json({ data: updated, error: null })
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

    const existing = await db.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: { select: { ownerId: true } } },
    })
    if (!existing || existing.propertyId !== propertyId) {
      return NextResponse.json({ data: null, error: 'Image not found' }, { status: 404 })
    }
    if (existing.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    // Delete from Cloudinary only if it's a real Cloudinary publicId (has a slash)
    if (existing.publicId.includes('/')) {
      await deleteImage(existing.publicId)
    }

    await db.propertyImage.delete({ where: { id: imageId } })

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('[PROPERTY_IMAGE_DELETE]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
