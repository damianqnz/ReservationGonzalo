import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { updateReview } from '@/lib/services/reviewService'
import { db } from '@/lib/db'

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'reply', 'toggle']),
  ownerReply: z.string().optional(),
})

/**
 * PATCH /api/reviews/[id]
 * Updates a review (approve, reject, reply, toggle).
 * 
 * Auth: OWNER or ADMIN
 */
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== Role.OWNER && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
    }

    const result = ActionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { action, ownerReply } = result.data

    if (action === 'reply' && !ownerReply) {
      return NextResponse.json({ data: null, error: 'Reply text is required' }, { status: 400 })
    }

    // Verify ownership if OWNER
    if (session.user.role === Role.OWNER) {
      const review = await db.review.findUnique({
        where: { id },
        include: { property: { select: { ownerId: true } } }
      })

      if (!review) {
        return NextResponse.json({ data: null, error: 'Review not found' }, { status: 404 })
      }

      if (review.property.ownerId !== session.user.id) {
        return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
      }
    }

    const updatedReview = await updateReview(id, action, ownerReply)

    return NextResponse.json({ data: updatedReview, error: null })
  } catch (error) {
    console.error('[API/reviews/[id]/PATCH]', error)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
