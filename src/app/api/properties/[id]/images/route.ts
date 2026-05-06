import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ImageCategory } from '@prisma/client'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { getImageUrl } from '@/shared/lib/cloudinary'

const createSchema = z.object({
  publicId: z.string().min(1),
  alt: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
  category: z.nativeEnum(ImageCategory).optional(),
})

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
    const validated = createSchema.parse(body)

    // Verify property exists and belongs to the session user
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    if (!property) {
      return NextResponse.json({ data: null, error: 'Property not found' }, { status: 404 })
    }
    if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    // If isCover, unset any existing cover first
    if (validated.isCover) {
      await db.propertyImage.updateMany({
        where: { propertyId, isCover: true },
        data: { isCover: false },
      })
    }

    const url = getImageUrl(validated.publicId)
    const image = await db.propertyImage.create({
      data: {
        propertyId,
        publicId: validated.publicId,
        url,
        alt: validated.alt ?? null,
        order: validated.order ?? 0,
        isCover: validated.isCover ?? false,
        ...(validated.category && { category: validated.category }),
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
    const images = await db.propertyImage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ data: images, error: null })
  } catch (error) {
    console.error('[PROPERTY_IMAGES_GET]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
