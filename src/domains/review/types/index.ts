import { Role, Review, Property, Booking } from '@prisma/client'

// ─── reviewService types ──────────────────────────────────────────────────────

export interface ListReviewsQuery {
  propertyId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'all'
  source?: 'WEBSITE' | 'AIRBNB' | 'BOOKING' | 'MANUAL' | 'all'
  userId: string
  role: Role
}

export type ReviewWithDetails = Review & {
  property: Pick<Property, 'id' | 'title'>
  booking: Pick<Booking, 'guestName' | 'checkIn' | 'checkOut'> | null
}
