import { db } from '@/shared/lib/db'
import { Role, Review, Property, Booking } from '@prisma/client'

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

/**
 * Lists reviews based on filters and user role.
 * 
 * @param query - Filters and user authentication context.
 * @returns List of reviews with property and booking details.
 */
export async function listReviews(query: ListReviewsQuery): Promise<ReviewWithDetails[]> {
  try {
    const where: any = {}

    // Filter by owner's properties if role is OWNER
    if (query.role === Role.OWNER) {
      where.property = { ownerId: query.userId }
    }

    if (query.propertyId) {
      where.propertyId = query.propertyId
    }

    if (query.status && query.status !== 'all') {
      if (query.status === 'pending') {
        where.isPublished = false
        where.isRejected = false
      } else if (query.status === 'approved') {
        where.isPublished = true
      } else if (query.status === 'rejected') {
        where.isRejected = true
      }
    }

    if (query.source && query.source !== 'all') {
      where.source = query.source
    }

    return db.review.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        booking: {
          select: {
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<ReviewWithDetails[]>
  } catch (error) {
    console.error('[ReviewService/listReviews]', error)
    throw error
  }
}

/**
 * Updates a review status or reply.
 * 
 * @param id - Review ID.
 * @param action - Action to perform: approve, reject, reply, toggle.
 * @param ownerReply - The reply text (required if action is 'reply').
 * @returns The updated review.
 */
export async function updateReview(
  id: string, 
  action: 'approve' | 'reject' | 'reply' | 'toggle', 
  ownerReply?: string
) {
  try {
    const review = await db.review.findUnique({
      where: { id },
    })

    if (!review) {
      throw new Error('Review not found')
    }

    switch (action) {
      case 'approve':
        return db.review.update({
          where: { id },
          data: { isPublished: true, isRejected: false },
        })
      case 'reject':
        return db.review.update({
          where: { id },
          data: { isPublished: false, isRejected: true },
        })
      case 'reply':
        return db.review.update({
          where: { id },
          data: { ownerReply },
        })
      case 'toggle':
        const newPublished = !review.isPublished
        return db.review.update({
          where: { id },
          data: { 
            isPublished: newPublished, 
            isRejected: false 
          },
        })
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('[ReviewService/updateReview]', error)
    throw error
  }
}

/**
 * Manually imports an external review.
 * 
 * @param data - Review data.
 * @returns The created review.
 */
export async function importReview(data: {
  propertyId: string
  guestName: string
  rating: number
  comment: string
  source: 'AIRBNB' | 'BOOKING' | 'MANUAL'
  sourceUrl?: string
  stayDate?: Date
}) {
  try {
    return db.review.create({
      data: {
        propertyId: data.propertyId,
        guestName: data.guestName,
        rating: data.rating,
        comment: data.comment,
        source: data.source,
        sourceUrl: data.sourceUrl,
        stayDate: data.stayDate,
        isPublished: true,
        isRejected: false,
        bookingId: null,
      },
    })
  } catch (error) {
    console.error('[ReviewService/importReview]', error)
    throw error
  }
}

/**
 * Gets count of pending reviews for a user.
 * 
 * @param userId - User ID.
 * @param role - User role.
 */
export async function getPendingReviewsCount(userId: string, role: Role): Promise<number> {
  try {
    const where: any = {
      isPublished: false,
      isRejected: false,
    }

    if (role === Role.OWNER) {
      where.property = { ownerId: userId }
    }

    return db.review.count({ where })
  } catch (error) {
    console.error('[ReviewService/getPendingReviewsCount]', error)
    throw error
  }
}
