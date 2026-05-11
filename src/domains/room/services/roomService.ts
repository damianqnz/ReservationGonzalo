import { db } from '@/shared/lib/db'
import { deleteImage } from '@/shared/lib/cloudinary-server'
import { getImageUrl } from '@/shared/lib/cloudinary'
import { BookingStatus, ImageCategory } from '@prisma/client'

// ─── Result type ──────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { data: T; error: null; status?: never }
  | { data: null; error: string; status: number }

// ─── Input interfaces ─────────────────────────────────────────────────────────

export interface UpdateRoomInput {
  name?: string
  description?: string
  type?: import('@prisma/client').RoomType
  status?: import('@prisma/client').RoomStatus
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  bathroomType?: string
  beds?: number
  bedsList?: string | null
  services?: string | null
  pricePerNight?: number
  order?: number
}

export interface CreateRoomImageInput {
  publicId: string
  alt?: string
  order?: number
  isCover?: boolean
}

export interface UpdateRoomImageInput {
  order?: number
  isCover?: boolean
  alt?: string
  category?: ImageCategory
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function resolveRoom(roomId: string, userId: string, userRole: string) {
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { id: true, property: { select: { ownerId: true } } },
  })
  if (!room) return { room: null, forbidden: false }
  const forbidden = userRole !== 'ADMIN' && room.property.ownerId !== userId
  return { room, forbidden }
}

// ─── updateRoom ───────────────────────────────────────────────────────────────

/** Updates a room after verifying ownership. */
export async function updateRoom(
  roomId: string,
  data: UpdateRoomInput,
  userId: string,
  userRole: string
): Promise<ServiceResult<{
  id: string
  name: string
  type: import('@prisma/client').RoomType
  status: import('@prisma/client').RoomStatus
  pricePerNight: number
  updatedAt: Date
}>> {
  try {
    const { room, forbidden } = await resolveRoom(roomId, userId, userRole)
    if (!room) {
      return { data: null, error: 'Room not found.', status: 404 }
    }
    if (forbidden) {
      return { data: null, error: 'Forbidden.', status: 403 }
    }

    const updated = await db.room.update({
      where: { id: roomId },
      data,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        pricePerNight: true,
        updatedAt: true,
      },
    })
    return { data: updated, error: null }
  } catch (error) {
    console.error('[RoomService.updateRoom]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 }
  }
}

// ─── deleteRoom ───────────────────────────────────────────────────────────────

/** Deletes a room after ownership check, booking guard, and Cloudinary cleanup. */
export async function deleteRoom(
  roomId: string,
  userId: string,
  userRole: string
): Promise<ServiceResult<{ deleted: true }>> {
  try {
    const { room, forbidden } = await resolveRoom(roomId, userId, userRole)
    if (!room) {
      return { data: null, error: 'Room not found.', status: 404 }
    }
    if (forbidden) {
      return { data: null, error: 'Forbidden.', status: 403 }
    }

    const activeCount = await db.booking.count({
      where: {
        roomId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
    })
    if (activeCount > 0) {
      return {
        data: null,
        error: 'Não é possível eliminar um quarto com reservas ativas. Cancele as reservas primeiro.',
        status: 409,
      }
    }

    const images = await db.roomImage.findMany({
      where: { roomId },
      select: { publicId: true },
    })
    const publicIds = images
      .map((i) => i.publicId)
      .filter((pid): pid is string => !!pid && pid.includes('/'))

    await db.room.delete({ where: { id: roomId } })

    if (publicIds.length > 0) {
      void Promise.allSettled(publicIds.map((pid) => deleteImage(pid)))
    }

    return { data: { deleted: true }, error: null }
  } catch (error) {
    console.error('[RoomService.deleteRoom]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 }
  }
}

// ─── listRoomImages ───────────────────────────────────────────────────────────

/** Returns all images for a room ordered by display order. */
export async function listRoomImages(roomId: string) {
  try {
    const images = await db.roomImage.findMany({
      where: { roomId },
      orderBy: { order: 'asc' },
    })
    return { data: images, error: null } as const
  } catch (error) {
    console.error('[RoomService.listRoomImages]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── createRoomImage ──────────────────────────────────────────────────────────

/** Creates a room image after verifying ownership. Unsets existing cover if isCover. */
export async function createRoomImage(
  roomId: string,
  data: CreateRoomImageInput,
  userId: string,
  userRole: string
) {
  try {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { property: { select: { ownerId: true } } },
    })
    if (!room) {
      return { data: null, error: 'Room not found', status: 404 } as const
    }
    if (room.property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden', status: 403 } as const
    }

    if (data.isCover) {
      await db.roomImage.updateMany({
        where: { roomId, isCover: true },
        data: { isCover: false },
      })
    }

    const url = getImageUrl(data.publicId)
    const image = await db.roomImage.create({
      data: {
        roomId,
        publicId: data.publicId,
        url,
        alt: data.alt ?? null,
        order: data.order ?? 0,
        isCover: data.isCover ?? false,
      },
    })
    return { data: image, error: null } as const
  } catch (error) {
    console.error('[RoomService.createRoomImage]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── updateRoomImage ──────────────────────────────────────────────────────────

/** Updates a room image after verifying ownership. */
export async function updateRoomImage(
  roomId: string,
  imageId: string,
  data: UpdateRoomImageInput,
  userId: string,
  userRole: string
) {
  try {
    const existing = await db.roomImage.findUnique({
      where: { id: imageId },
      include: { room: { include: { property: { select: { ownerId: true } } } } },
    })
    if (!existing || existing.roomId !== roomId) {
      return { data: null, error: 'Image not found', status: 404 } as const
    }
    if (existing.room.property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden', status: 403 } as const
    }

    if (data.isCover) {
      await db.roomImage.updateMany({
        where: { roomId, isCover: true, id: { not: imageId } },
        data: { isCover: false },
      })
    }

    const updated = await db.roomImage.update({
      where: { id: imageId },
      data: {
        ...(data.order    !== undefined && { order:    data.order }),
        ...(data.isCover  !== undefined && { isCover:  data.isCover }),
        ...(data.alt      !== undefined && { alt:      data.alt }),
        ...(data.category !== undefined && { category: data.category }),
      },
    })
    return { data: updated, error: null } as const
  } catch (error) {
    console.error('[RoomService.updateRoomImage]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── deleteRoomImage ──────────────────────────────────────────────────────────

/** Deletes a room image from DB and Cloudinary after verifying ownership. */
export async function deleteRoomImage(
  roomId: string,
  imageId: string,
  userId: string,
  userRole: string
) {
  try {
    const existing = await db.roomImage.findUnique({
      where: { id: imageId },
      include: { room: { include: { property: { select: { ownerId: true } } } } },
    })
    if (!existing || existing.roomId !== roomId) {
      return { data: null, error: 'Image not found', status: 404 } as const
    }
    if (existing.room.property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden', status: 403 } as const
    }

    if (existing.publicId.includes('/')) {
      await deleteImage(existing.publicId)
    }

    await db.roomImage.delete({ where: { id: imageId } })
    return { data: { success: true } as const, error: null } as const
  } catch (error) {
    console.error('[RoomService.deleteRoomImage]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}
