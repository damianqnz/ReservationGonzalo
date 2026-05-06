import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { BookingStatus } from '@prisma/client'
import {
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  format,
} from 'date-fns'
import CalendarClient from './CalendarClient'

// ─── Types exported to client ─────────────────────────────────────────────────

export interface CalendarBooking {
  id: string
  confirmationCode: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  guestCount: number
  checkIn: string   // YYYY-MM-DD
  checkOut: string  // YYYY-MM-DD
  nights: number
  totalPrice: number
  status: string
  propertyId: string
  propertyTitle: string
  roomId: string | null
  roomName: string | null
}

export interface CalendarBlockedDate {
  id: string
  date: string  // YYYY-MM-DD
  reason: string | null
  type: 'property' | 'room'
  propertyId: string
  roomId: string | null
}

export interface CalendarProperty {
  id: string
  title: string
  hasRooms: boolean
}

export interface CalendarRoom {
  id: string
  name: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    month?: string       // YYYY-MM
    propertyId?: string
    roomId?: string
  }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  const isAdmin = session.user.role === 'ADMIN'

  // ── Month range ──────────────────────────────────────────────────────────
  const monthParam = params.month
  const baseDate = monthParam ? new Date(monthParam + '-01T00:00:00Z') : new Date()
  const monthDate = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1))

  // Grid needs Mon-Sun week padding around the month
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const propertyIdFilter = params.propertyId ?? ''
  const roomIdFilter = params.roomId ?? ''

  // ── Properties (role-based) ──────────────────────────────────────────────
  const properties = await db.property.findMany({
    where: isAdmin ? {} : { ownerId: session.user.id },
    select: { id: true, title: true, hasRooms: true },
    orderBy: { createdAt: 'asc' },
  })

  const propertyIds = properties.map((p) => p.id)
  const activePropertyIds = propertyIdFilter ? [propertyIdFilter] : propertyIds

  // ── Rooms for selected property ──────────────────────────────────────────
  const rooms: CalendarRoom[] = propertyIdFilter
    ? await db.room.findMany({
        where: { propertyId: propertyIdFilter, status: 'ACTIVE' },
        orderBy: { order: 'asc' },
        select: { id: true, name: true },
      })
    : []

  if (propertyIds.length === 0) {
    return (
      <CalendarClient
        initialMonth={format(monthDate, 'yyyy-MM')}
        properties={[]}
        rooms={[]}
        bookings={[]}
        blockedDates={[]}
        propertyIdFilter={propertyIdFilter}
        roomIdFilter={roomIdFilter}
      />
    )
  }

  // ── Bookings in range ────────────────────────────────────────────────────
  const rawBookings = await db.booking.findMany({
    where: {
      propertyId: { in: activePropertyIds },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED] },
      checkIn: { lt: rangeEnd },
      checkOut: { gt: rangeStart },
      ...(roomIdFilter ? { roomId: roomIdFilter } : {}),
    },
    select: {
      id: true,
      confirmationCode: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      guestCount: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      totalPrice: true,
      status: true,
      propertyId: true,
      property: { select: { title: true } },
      room: { select: { id: true, name: true } },
    },
    orderBy: { checkIn: 'asc' },
  })

  // ── Blocked dates in range ────────────────────────────────────────────────
  const [propertyBlocked, roomBlocked] = await Promise.all([
    db.blockedDate.findMany({
      where: {
        propertyId: { in: activePropertyIds },
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: { id: true, date: true, reason: true, propertyId: true },
    }),
    roomIdFilter
      ? db.roomBlockedDate.findMany({
          where: { roomId: roomIdFilter, date: { gte: rangeStart, lte: rangeEnd } },
          select: { id: true, date: true, reason: true, roomId: true },
        })
      : Promise.resolve([]),
  ])

  // ── Serialize ────────────────────────────────────────────────────────────
  const bookings: CalendarBooking[] = rawBookings.map((b) => ({
    id: b.id,
    confirmationCode: b.confirmationCode,
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    guestCount: b.guestCount,
    checkIn: format(b.checkIn, 'yyyy-MM-dd'),
    checkOut: format(b.checkOut, 'yyyy-MM-dd'),
    nights: b.nights,
    totalPrice: b.totalPrice,
    status: b.status,
    propertyId: b.propertyId,
    propertyTitle: b.property.title,
    roomId: b.room?.id ?? null,
    roomName: b.room?.name ?? null,
  }))

  const blockedDates: CalendarBlockedDate[] = [
    ...propertyBlocked.map((d) => ({
      id: d.id,
      date: format(d.date, 'yyyy-MM-dd'),
      reason: d.reason,
      type: 'property' as const,
      propertyId: d.propertyId,
      roomId: null,
    })),
    ...roomBlocked.map((d) => ({
      id: d.id,
      date: format(d.date, 'yyyy-MM-dd'),
      reason: d.reason,
      type: 'room' as const,
      propertyId: '',
      roomId: d.roomId,
    })),
  ]

  return (
    <CalendarClient
      initialMonth={format(monthDate, 'yyyy-MM')}
      properties={properties}
      rooms={rooms}
      bookings={bookings}
      blockedDates={blockedDates}
      propertyIdFilter={propertyIdFilter}
      roomIdFilter={roomIdFilter}
    />
  )
}
