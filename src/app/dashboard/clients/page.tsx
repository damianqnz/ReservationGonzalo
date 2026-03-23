import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import ClientsClient from './ClientsClient'
import type { ClientRow } from '@/app/api/dashboard/clients/route'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin = session.user.role === 'ADMIN'
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // ── Resolve property scope ────────────────────────────────────────────────
  const properties = await db.property.findMany({
    where: isAdmin ? {} : { ownerId: session.user.id },
    select: { id: true, title: true },
    orderBy: { createdAt: 'asc' },
  })

  const propertyIds = properties.map((p) => p.id)

  if (propertyIds.length === 0) {
    return (
      <ClientsClient
        initialClients={[]}
        properties={[]}
      />
    )
  }

  // ── Fetch initial clients (all, no filters) ───────────────────────────────
  const bookings = await db.booking.findMany({
    where: {
      status:     { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      propertyId: { in: propertyIds },
    },
    select: {
      guestName:         true,
      guestEmail:        true,
      guestPhone:        true,
      guestCountry:      true,
      acceptedMarketing: true,
      totalPrice:        true,
      checkIn:           true,
      source:            true,
      property:          { select: { title: true } },
    },
    orderBy: { checkIn: 'desc' },
  })

  // ── Group by email ────────────────────────────────────────────────────────
  type AggRow = Omit<ClientRow, 'primarySource' | 'sourceCount'> & {
    _srcCounts: Record<string, number>
  }
  const map = new Map<string, AggRow>()

  for (const b of bookings) {
    const email = b.guestEmail.toLowerCase()
    const checkInDate = b.checkIn.toISOString().split('T')[0]
    const src = b.source as string

    if (!map.has(email)) {
      map.set(email, {
        guestName:         b.guestName,
        guestEmail:        b.guestEmail,
        guestPhone:        b.guestPhone,
        guestCountry:      b.guestCountry,
        acceptedMarketing: b.acceptedMarketing,
        totalBookings:     1,
        totalSpent:        b.totalPrice,
        lastBooking:       checkInDate,
        firstBooking:      checkInDate,
        properties:        [b.property.title],
        _srcCounts:        { [src]: 1 },
      })
    } else {
      const existing = map.get(email)!
      if (checkInDate >= existing.lastBooking) {
        existing.guestName  = b.guestName
        existing.guestPhone = b.guestPhone ?? existing.guestPhone
        existing.lastBooking = checkInDate
      }
      if (checkInDate < existing.firstBooking) {
        existing.firstBooking = checkInDate
      }
      existing.totalBookings += 1
      existing.totalSpent    += b.totalPrice
      existing.acceptedMarketing = existing.acceptedMarketing || b.acceptedMarketing
      if (!existing.properties.includes(b.property.title)) {
        existing.properties.push(b.property.title)
      }
      existing._srcCounts[src] = (existing._srcCounts[src] ?? 0) + 1
    }
  }

  const initialClients: ClientRow[] = Array.from(map.values())
    .sort((a, b) => b.lastBooking.localeCompare(a.lastBooking))
    .map(({ _srcCounts, ...rest }) => {
      let primarySource = 'DIRECT'
      let maxCount = 0
      for (const [src, count] of Object.entries(_srcCounts)) {
        if (count > maxCount) { maxCount = count; primarySource = src }
      }
      return { ...rest, primarySource, sourceCount: Object.keys(_srcCounts).length }
    })

  return (
    <ClientsClient
      initialClients={initialClients}
      properties={properties}
    />
  )
}
