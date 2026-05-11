import { z } from 'zod'
import { PropertyStatus, PropertyType, ImageCategory, RoomType, RoomStatus } from '@prisma/client'

// ─── Property CRUD ────────────────────────────────────────────────────────────

export const createPropertySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10).max(5000),
  type: z.nativeEnum(PropertyType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  country: z.string().length(2).optional(),
  zipCode: z.string().max(20).optional(),
  maxGuests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  beds: z.number().int().min(1).max(50),
  area: z.number().positive().optional(),
  pricePerNight: z.number().positive(),
  cleaningFee: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  minNights: z.number().int().min(1).optional(),
  maxNights: z.number().int().min(1).optional(),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(),
  hasRooms:     z.boolean().optional(),
  bedsConfig:   z.string().optional(),
  bathroomType: z.string().optional(),
  services:     z.string().optional(),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
  arrivalType: z.enum(['autonomous', 'guided']).optional(),
  floors: z.number().int().min(1).max(20).optional(),
  hasElevator: z.boolean().optional(),
  towelsIncluded: z.boolean().optional(),
  petsAllowed: z.boolean().optional(),
  childrenAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  spaceDescription: z.string().max(5000).optional(),
  accessInfo: z.string().max(5000).optional(),
  interactionInfo: z.string().max(5000).optional(),
  additionalInfo: z.string().max(5000).optional(),
  parkingInfo: z.string().max(2000).optional(),
  extraServices: z.string().max(2000).optional(),
  houseRules: z.string().max(5000).optional(),
  cancellationDays: z.number().int().min(0).optional(),
  licenseNumber: z.string().max(100).optional(),
  hostDescription: z.string().max(5000).optional(),
})

export const updatePropertySchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    type: z.nativeEnum(PropertyType).optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
    address: z.string().min(5).max(300).optional(),
    city: z.string().min(2).max(100).optional(),
    zipCode: z.string().max(20).optional(),
    maxGuests: z.number().int().min(1).max(50).optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    beds: z.number().int().min(1).max(50).optional(),
    area: z.number().positive().optional(),
    pricePerNight: z.number().positive().optional(),
    cleaningFee: z.number().min(0).optional(),
    latitude:     z.number().optional(),
    longitude:    z.number().optional(),
    bedsConfig:   z.string().optional(),
    bathroomType: z.string().optional(),
    services:     z.string().optional(),
    accessCode:          z.string().max(100).nullish(),
    wifiName:            z.string().max(100).nullish(),
    wifiPassword:        z.string().max(100).nullish(),
    floor:               z.string().max(50).nullish(),
    accessInstructions:  z.string().max(2000).nullish(),
    contactPhone:        z.string().max(30).nullish(),
    arrivalType: z.enum(['autonomous', 'guided']).optional(),
    floors: z.number().int().min(1).max(20).optional(),
    hasElevator: z.boolean().optional(),
    towelsIncluded: z.boolean().optional(),
    petsAllowed: z.boolean().optional(),
    childrenAllowed: z.boolean().optional(),
    smokingAllowed: z.boolean().optional(),
    spaceDescription: z.string().max(5000).optional(),
    accessInfo: z.string().max(5000).optional(),
    interactionInfo: z.string().max(5000).optional(),
    additionalInfo: z.string().max(5000).optional(),
    parkingInfo: z.string().max(2000).optional(),
    extraServices: z.string().max(2000).optional(),
    houseRules: z.string().max(5000).optional(),
    cancellationDays: z.number().int().min(0).optional(),
    licenseNumber: z.string().max(100).optional(),
    hostDescription: z.string().max(5000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided.' })

// ─── Property search ──────────────────────────────────────────────────────────

export const searchPropertySchema = z.object({
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  guests: z.coerce.number().int().min(1).max(50).optional(),
})

// ─── Property images ──────────────────────────────────────────────────────────

export const createPropertyImageSchema = z.object({
  publicId: z.string().min(1),
  alt: z.string().max(200).optional(),
  order: z.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
  category: z.nativeEnum(ImageCategory).optional(),
})

export const updatePropertyImageSchema = z.object({
  order:    z.number().int().min(0).optional(),
  isCover:  z.boolean().optional(),
  alt:      z.string().max(200).optional(),
  category: z.nativeEnum(ImageCategory).optional(),
})

// ─── Room within property ─────────────────────────────────────────────────────

export const createRoomInPropertySchema = z.object({
  name:          z.string().min(1).max(200),
  description:   z.string().max(2000).optional(),
  type:          z.nativeEnum(RoomType).optional(),
  status:        z.nativeEnum(RoomStatus).optional(),
  maxGuests:     z.number().int().min(1).max(20),
  bedrooms:      z.number().int().min(0).max(20),
  bathrooms:     z.number().int().min(0).max(20),
  bathroomType:  z.string().optional(),
  beds:          z.number().int().min(1).max(20),
  bedsList:      z.string().optional(),
  services:      z.string().optional(),
  pricePerNight: z.number().positive(),
  order:         z.number().int().min(0).optional(),
})
