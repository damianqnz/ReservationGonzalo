import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/shared/lib/auth'
import { updateRoomImage, deleteRoomImage } from '@/domains/room/services/roomService'
import { updateRoomImageSchema } from '@/domains/room/validations/roomSchema'

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
    const validated = updateRoomImageSchema.parse(body)

    const result = await updateRoomImage(
      roomId,
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

    const result = await deleteRoomImage(
      roomId,
      imageId,
      session.user.id,
      session.user.role
    )
    if (result.error) {
      return NextResponse.json({ data: null, error: result.error }, { status: result.status })
    }
    return NextResponse.json({ data: result.data, error: null })
  } catch (error) {
    console.error('[ROOM_IMAGE_DELETE]', error)
    return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
  }
}
