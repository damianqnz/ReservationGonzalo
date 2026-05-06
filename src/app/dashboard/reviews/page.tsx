import { auth } from '@/shared/lib/auth'
import { redirect } from 'next/navigation'
import { listReviews } from '@/domains/review/services/reviewService'
import { db } from '@/shared/lib/db'
import { Role } from '@prisma/client'
import ReviewsClient from './ReviewsClient'

/**
 * Reviews management dashboard page.
 * Server component that fetches initial data and properties.
 */
export default async function ReviewsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as Role
  if (role !== Role.OWNER && role !== Role.ADMIN) redirect('/dashboard')

  // Initial fetch of reviews
  const reviews = await listReviews({
    userId: session.user.id,
    role: role,
    status: 'all',
  })

  // Fetch properties for filtering and import modal
  const properties = await db.property.findMany({
    where: role === Role.OWNER ? { ownerId: session.user.id } : {},
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ReviewsClient initialReviews={reviews} properties={properties} />
    </div>
  )
}
