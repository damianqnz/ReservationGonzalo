import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getImageUrl } from '@/lib/cloudinary'

const createSchema = z.object({
  publicId: z.string().min(1),
  alt: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { roomId } = await params
    const body = await req.json()
    const validated = createSchema.parse(body)

    // Verify room exists and belongs to the session user's property
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { property: { select: { ownerId: true } } },
    })
    if (!room) {
      return NextResponse.json({ data: null, error: 'Room not found' }, { status: 404 })
    }
    if (room.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    // If isCover, unset any existing cover first
    if (validated.isCover) {
      await db.roomImage.updateMany({
        where: { roomId, isCover: true },
        data: { isCover: false },
      })
    }

    const url = getImageUrl(validated.publicId)
    const image = await db.roomImage.create({
      data: {
        roomId,
        publicId: validated.publicId,
        url,
        alt: validated.alt ?? null,
        order: validated.order ?? 0,
        isCover: validated.isCover ?? false,
      },
    })

    return NextResponse.json({ data: image, error: null }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error('[ROOM_IMAGES_POST]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await params
    const images = await db.roomImage.findMany({
      where: { roomId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ data: images, error: null })
  } catch (error) {
    console.error('[ROOM_IMAGES_GET]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
