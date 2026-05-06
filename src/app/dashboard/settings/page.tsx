import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return <SettingsClient user={user} />
}
