import type {
  User,
  Property,
  PropertyImage,
  Booking,
  Review,
  Notification,
  Amenity,
  Role,
  PropertyType,
  PropertyStatus,
  CancellationPolicy,
  BookingStatus,
  PaymentStatus,
  BookingSource,
  AmenityCategory,
  NotificationType,
} from '@prisma/client'

// Re-export Prisma types
export type {
  User,
  Property,
  PropertyImage,
  Booking,
  Review,
  Notification,
  Amenity,
  Role,
  PropertyType,
  PropertyStatus,
  CancellationPolicy,
  BookingStatus,
  PaymentStatus,
  BookingSource,
  AmenityCategory,
  NotificationType,
}

// Composed types
export type PropertyWithImages = Property & {
  images: Pick<PropertyImage, 'url' | 'alt' | 'isCover' | 'order'>[]
}

export type PropertyWithDetails = Property & {
  images: PropertyImage[]
  amenities: { amenity: Amenity }[]
  _count: { bookings: number; reviews: number }
}

export type BookingWithProperty = Booking & {
  property: Pick<Property, 'id' | 'title' | 'slug'>
}

export type ReviewWithProperty = Review & {
  property: Pick<Property, 'id' | 'title' | 'slug'>
}

// Dashboard
export type DashboardStats = {
  totalProperties: number
  totalBookings: number
  pendingBookings: number
  totalRevenue: number
}

// NextAuth session extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }
}
