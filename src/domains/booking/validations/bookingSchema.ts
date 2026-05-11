import { z } from 'zod'
import { BookingStatus, PaymentStatus } from '@prisma/client'

// ─── Availability ─────────────────────────────────────────────────────────────

export const availabilityRangeSchema = z.object({
  propertyId: z.string().optional(),
  roomId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

export const unavailableDatesSchema = z.object({
  propertyId: z.string().optional(),
  roomId: z.string().optional(),
})

// ─── Reservations ─────────────────────────────────────────────────────────────

export const createReservationSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  roomId: z.string().optional(),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  guestName: z.string().min(2, 'Guest name is required'),
  guestEmail: z.string().email('Invalid guest email'),
  guestPhone: z.string().optional(),
  guestCount: z.number().int().min(1, 'At least 1 guest required'),
  guestMessage: z.string().max(500, 'Message is too long').optional(),
  guestCountry: z.string().min(2).max(2),
  acceptedTerms: z.boolean().refine((v) => v === true, { message: 'Terms must be accepted' }),
  acceptedPrivacy: z.boolean().refine((v) => v === true, { message: 'Privacy policy must be accepted' }),
  acceptedMarketing: z.boolean().default(false),
})

export const listReservationsQuerySchema = z.object({
  propertyId: z.string().optional(),
  guestEmail: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
})

export const updateReservationSchema = z
  .object({
    status:        z.nativeEnum(BookingStatus).optional(),
    ownerNotes:    z.string().max(1000).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    action:        z.enum(['checkin', 'checkout']).optional(),
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.ownerNotes !== undefined ||
      d.paymentStatus !== undefined ||
      d.action !== undefined,
    { message: 'At least one field (status, ownerNotes, paymentStatus, action) must be provided.' },
  )

export const createManualBookingSchema = z.object({
  propertyId:      z.string().min(1),
  roomId:          z.string().optional(),
  guestName:       z.string().min(2).max(200),
  guestEmail:      z.string().email(),
  guestPhone:      z.string().max(30).optional(),
  guestCountry:    z.string().max(2).optional(),
  guestCount:      z.number().int().min(1),
  checkIn:         z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid date'),
  checkOut:        z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid date'),
  pricePerNight:   z.number().min(0),
  cleaningFee:     z.number().min(0).default(0),
  securityDeposit: z.number().min(0).default(0),
  paymentStatus:   z.enum(['PAID', 'UNPAID']),
  guestMessage:    z.string().max(1000).optional(),
  ownerNotes:      z.string().max(1000).optional(),
})

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const createCheckoutSchema = z.object({
  bookingId: z.string().cuid({ message: 'Invalid booking ID' }),
  successUrl: z.string().url({ message: 'successUrl must be a valid URL' }),
  cancelUrl: z.string().url({ message: 'cancelUrl must be a valid URL' }),
})

// ─── Guest portal ─────────────────────────────────────────────────────────────

export const guestLookupSchema = z
  .object({
    email: z.string().email().optional(),
    code: z.string().min(1).max(32).optional(),
  })
  .refine((d) => d.email || d.code, {
    message: 'email or code is required',
  })

export const guestBookingByIdSchema = z.object({
  code: z.string().min(1).max(32),
})

export const guestBookingPdfSchema = z.object({
  code: z.string().min(1).max(32),
})
