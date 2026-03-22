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
      property:          { select: { title: true } },
    },
    orderBy: { checkIn: 'desc' },
  })

  // ── Group by email ────────────────────────────────────────────────────────
  const map = new Map<string, ClientRow>()

  for (const b of bookings) {
    const email = b.guestEmail.toLowerCase()
    const checkInDate = b.checkIn.toISOString().split('T')[0]

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
    }
  }

  const initialClients = Array.from(map.values()).sort(
    (a, b) => b.lastBooking.localeCompare(a.lastBooking),
  )

  return (
    <ClientsClient
      initialClients={initialClients}
      properties={properties}
    />
  )
}
