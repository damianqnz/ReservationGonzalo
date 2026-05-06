import { redirect, notFound } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { getICalUrl } from '@/domains/calendar/services/icalService'
import { format } from 'date-fns'
import ICalClient from './ICalClient'

export interface ICalSyncRow {
  id: string
  source: string
  icalUrl: string
  lastSyncedAt: string | null
  syncedDates: number
  roomId: string | null
  roomName: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ICalPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: propertyId } = await params

  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      ownerId: true,
      hasRooms: true,
      rooms: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true },
        orderBy: { order: 'asc' },
      },
      icalSyncs: {
        select: {
          id: true,
          source: true,
          icalUrl: true,
          lastSyncedAt: true,
          syncedDates: true,
          roomId: true,
          room: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!property) notFound()
  if (session.user.role !== 'ADMIN' && property.ownerId !== session.user.id) {
    redirect('/dashboard')
  }

  const syncs: ICalSyncRow[] = property.icalSyncs.map((s) => ({
    id: s.id,
    source: s.source,
    icalUrl: s.icalUrl,
    lastSyncedAt: s.lastSyncedAt ? format(s.lastSyncedAt, 'yyyy-MM-dd HH:mm') : null,
    syncedDates: s.syncedDates,
    roomId: s.roomId,
    roomName: s.room?.name ?? null,
  }))

  const exportUrlProperty = getICalUrl(propertyId)
  const exportUrlsRooms = property.rooms.map((r) => ({
    roomId: r.id,
    roomName: r.name,
    url: getICalUrl(propertyId, r.id),
  }))

  return (
    <ICalClient
      propertyId={propertyId}
      propertyTitle={property.title}
      hasRooms={property.hasRooms}
      rooms={property.rooms}
      syncs={syncs}
      exportUrlProperty={exportUrlProperty}
      exportUrlsRooms={exportUrlsRooms}
    />
  )
}
