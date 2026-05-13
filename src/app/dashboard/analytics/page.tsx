import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { computeAnalytics } from '@/domains/analytics/services/analyticsService'
import AnalyticsClient from '@/domains/analytics/components/AnalyticsClient'

export const metadata = { title: 'Análises' }

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role
  if (role !== 'OWNER' && role !== 'ADMIN') redirect('/dashboard')

  const isAdmin = role === 'ADMIN'
  const currentYear = new Date().getFullYear()

  const [initialData, properties] = await Promise.all([
    computeAnalytics(isAdmin ? null : session.user.id, currentYear),
    db.property.findMany({
      where: isAdmin ? {} : { ownerId: session.user.id },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return (
    <AnalyticsClient
      initialData={initialData}
      properties={properties}
      initialYear={currentYear}
    />
  )
}
