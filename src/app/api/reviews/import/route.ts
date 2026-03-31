import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { importReview } from '@/lib/services/reviewService'
import { db } from '@/lib/db'

const ImportSchema = z.object({
  propertyId: z.string().min(1, 'Propriedade é obrigatória'),
  guestName: z.string().min(1, 'Nome do hóspede é obrigatório'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comentário é obrigatório'),
  source: z.enum(['AIRBNB', 'BOOKING', 'MANUAL']),
  sourceUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  stayDate: z.string().optional().or(z.literal('')),
})

/**
 * POST /api/reviews/import
 * Manually import a review from an external source or manual entry.
 * 
 * Auth: OWNER or ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== Role.OWNER && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
    }

    const result = ImportSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { data: null, error: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { propertyId, stayDate, ...rest } = result.data

    // Verify property ownership if OWNER
    if (session.user.role === Role.OWNER) {
      const property = await db.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true }
      })

      if (!property) {
        return NextResponse.json({ data: null, error: 'Property not found' }, { status: 404 })
      }

      if (property.ownerId !== session.user.id) {
        return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
      }
    }

    const review = await importReview({
      propertyId,
      ...rest,
      stayDate: stayDate ? new Date(stayDate) : undefined,
    })

    return NextResponse.json({ data: review, error: null }, { status: 201 })
  } catch (error) {
    console.error('[API/reviews/import/POST]', error)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
