import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { listNotifications } from '@/domains/notification/services/notificationService'
import NotificationsClient from './NotificationsClient'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Load first page server-side for fast initial render
  const { items, unreadCount } = await listNotifications(session.user.id, 20)

  const serialized = items.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">
          Notificações
        </h1>
        <p className="text-slate-500 mt-1">
          Todas as suas notificações num só lugar.
        </p>
      </div>

      <NotificationsClient initialItems={serialized} initialUnread={unreadCount} />
    </div>
  )
}
