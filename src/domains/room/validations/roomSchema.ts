import { z } from 'zod'
import { RoomType, RoomStatus, ImageCategory } from '@prisma/client'

// ─── Room CRUD ────────────────────────────────────────────────────────────────

export const updateRoomSchema = z
  .object({
    name:          z.string().min(1).max(200).optional(),
    description:   z.string().max(2000).optional(),
    type:          z.nativeEnum(RoomType).optional(),
    status:        z.nativeEnum(RoomStatus).optional(),
    maxGuests:     z.number().int().min(1).max(20).optional(),
    bedrooms:      z.number().int().min(0).max(20).optional(),
    bathrooms:     z.number().int().min(0).max(20).optional(),
    bathroomType:  z.string().optional(),
    beds:          z.number().int().min(1).max(20).optional(),
    bedsList:      z.string().nullish(),
    services:      z.string().nullish(),
    pricePerNight: z.number().positive().optional(),
    order:         z.number().int().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided.' })

// ─── Room images ──────────────────────────────────────────────────────────────

export const createRoomImageSchema = z.object({
  publicId: z.string().min(1),
  alt: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
})

export const updateRoomImageSchema = z.object({
  order:    z.number().int().min(0).optional(),
  isCover:  z.boolean().optional(),
  alt:      z.string().max(200).optional(),
  category: z.nativeEnum(ImageCategory).optional(),
})
