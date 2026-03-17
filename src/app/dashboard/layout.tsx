import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import DashboardLayout from '@/components/stitch/DashboardLayout'

export default async function RootDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

  const userName = session.user.name
    ? session.user.name.split(' ').slice(0, 2).join(' ')
    : 'Gonzalo R.'

  return (
    <DashboardLayout unreadCount={unreadCount} userName={userName}>
      {children}
    </DashboardLayout>
  )
}
