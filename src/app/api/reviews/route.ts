import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { Role } from '@prisma/client'
import { listReviews } from '@/domains/review/services/reviewService'
import { listReviewsQuerySchema } from '@/domains/review/validations/reviewSchema'

/**
 * GET /api/reviews
 * Lists reviews for owner's properties or all properties for admins.
 *
 * Auth: OWNER or ADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== Role.OWNER && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const rawParams = {
      propertyId: searchParams.get('propertyId') || undefined,
      status: searchParams.get('status') || 'all',
      source: searchParams.get('source') || 'all',
    }

    const result = listReviewsQuerySchema.safeParse(rawParams)
    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const reviews = await listReviews({
      ...result.data,
      userId: session.user.id,
      role: session.user.role as Role,
    })

    return NextResponse.json({ data: reviews, error: null })
  } catch (error) {
    console.error('[API/reviews/GET]', error)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
