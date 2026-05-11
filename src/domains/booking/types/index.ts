import {
  BookingStatus,
  PaymentStatus,
  BookingSource,
  CancellationPolicy,
  RoomType,
} from '@prisma/client'

// ─── GuestBooking ─────────────────────────────────────────────────────────────

export type GuestBooking = {
  id: string
  confirmationCode: string
  guestName: string
  guestEmail: string
  guestCount: number
  checkIn: Date
  checkOut: Date
  nights: number
  pricePerNight: number
  cleaningFee: number
  securityDeposit: number
  totalPrice: number
  discountAmount: number | null
  currency: string
  status: BookingStatus
  paymentStatus: PaymentStatus
  source: BookingSource
  guestMessage: string | null
  property: {
    title: string
    address: string
    city: string
    country: string
    checkInTime: string
    checkOutTime: string
    cancellationPolicy: CancellationPolicy
    images: Array<{ url: string; publicId: string; alt: string | null }>
  }
  room: { name: string; type: RoomType } | null
}

// ─── Reservation input types ──────────────────────────────────────────────────

export interface CreateReservationInput {
  propertyId: string
  roomId?: string
  checkIn: Date
  checkOut: Date
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number
  guestMessage?: string
  guestCountry?: string
  acceptedTerms?: boolean
  acceptedPrivacy?: boolean
  acceptedMarketing?: boolean
  sessionId?: string
}

export interface CreateManualBookingInput {
  propertyId:      string
  roomId?:         string
  guestName:       string
  guestEmail:      string
  guestPhone?:     string
  guestCountry?:   string
  guestCount:      number
  checkIn:         Date
  checkOut:        Date
  pricePerNight:   number
  cleaningFee:     number
  securityDeposit: number
  paymentStatus:   'PAID' | 'UNPAID'
  guestMessage?:   string
  ownerNotes?:     string
}
