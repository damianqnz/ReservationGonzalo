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

type RouteContext = { params: Promise<{ roomId: string; imageId: string }> }

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { roomId, imageId } = await params
    const body = await req.json()
    const validated = patchSchema.parse(body)

    const existing = await db.roomImage.findUnique({
      where: { id: imageId },
      include: { room: { include: { property: { select: { ownerId: true } } } } },
    })
    if (!existing || existing.roomId !== roomId) {
      return NextResponse.json({ data: null, error: 'Image not found' }, { status: 404 })
    }
    if (existing.room.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    if (validated.isCover) {
      await db.roomImage.updateMany({
        where: { roomId, isCover: true, id: { not: imageId } },
        data: { isCover: false },
      })
    }

    const updated = await db.roomImage.update({
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
    console.error('[ROOM_IMAGE_PATCH]', error)
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

    const { roomId, imageId } = await params

    const existing = await db.roomImage.findUnique({
      where: { id: imageId },
      include: { room: { include: { property: { select: { ownerId: true } } } } },
    })
    if (!existing || existing.roomId !== roomId) {
      return NextResponse.json({ data: null, error: 'Image not found' }, { status: 404 })
    }
    if (existing.room.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    if (existing.publicId.includes('/')) {
      await deleteImage(existing.publicId)
    }

    await db.roomImage.delete({ where: { id: imageId } })

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('[ROOM_IMAGE_DELETE]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
