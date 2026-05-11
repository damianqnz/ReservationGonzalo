import { NotificationType } from '@prisma/client'

// ─── notificationService types ────────────────────────────────────────────────

export interface CreateNotificationInput {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

// ─── emailService types ───────────────────────────────────────────────────────

export type BookingWithProperty = {
  id: string
  confirmationCode: string
  guestName: string
  guestEmail: string
  guestPhone?: string | null
  checkIn: Date
  checkOut: Date
  nights: number
  pricePerNight: number
  cleaningFee: number
  securityDeposit: number
  totalPrice: number
  currency: string
  property: {
    title: string
    address: string
    city: string
    country: string
    checkInTime: string
    checkOutTime: string
  } | null
}

export type EmailResult = { success: boolean; error?: string }
