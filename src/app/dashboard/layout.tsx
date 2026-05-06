import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

export default async function RootDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [unreadCount, pendingReviewsCount] = await Promise.all([
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    db.review.count({
      where: {
        isPublished: false,
        isRejected: false,
        property: session.user.role === 'OWNER' ? { ownerId: session.user.id } : {},
      },
    }),
  ])

  const userName = session.user.name
    ? session.user.name.split(' ').slice(0, 2).join(' ')
    : 'Gonzalo R.'

  return (
    <DashboardLayout 
      unreadCount={unreadCount} 
      pendingReviewsCount={pendingReviewsCount}
      userName={userName}
    >
      {children}
    </DashboardLayout>
  )

}
