import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { Suspense } from 'react'
import SearchFilters from './SearchFilters'
import ReservationsTable from './ReservationsTable'

const PAGE_SIZE = 20

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingRow {
  id:               string
  confirmationCode: string
  guestName:        string
  guestEmail:       string
  guestPhone:       string | null
  guestCountry:     string | null
  guestCount:       number
  checkIn:          string
  checkOut:         string
  nights:           number
  status:           string
  source:           string
  totalPrice:       number
  paymentStatus:    string
  guestMessage:     string | null
  couponCode:       string | null
  checkedInAt:      string | null
  checkedOutAt:     string | null
  property: {
    id:                 string
    title:              string
    type:               string
    accessCode:         string | null
    wifiName:           string | null
    wifiPassword:       string | null
    floor:              string | null
    accessInstructions: string | null
    contactPhone:       string | null
  }
  room: {
    id:   string
    name: string
    type: string
  } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    status?:     string
    page?:       string
    search?:     string
    propertyId?: string
    dateRange?:  string
  }>
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin = session.user.role === 'ADMIN'
  const ownerId = session.user.id

  const params       = await searchParams
  const statusFilter = params.status as BookingStatus | undefined
  const search       = params.search?.trim() ?? ''
  const propertyId   = params.propertyId ?? ''
  const dateRange    = params.dateRange ?? ''
  const page         = Math.max(1, parseInt(params.page ?? '1', 10))
  const skip         = (page - 1) * PAGE_SIZE

  // ── Date range filter ─────────────────────────────────────────────────────
  const now = new Date()
  let dateFilter: { checkIn?: { gte?: Date; lte?: Date } } = {}
  if (dateRange === 'week') {
    const weekStart = new Date(now)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    dateFilter = { checkIn: { gte: weekStart, lte: weekEnd } }
  } else if (dateRange === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    dateFilter = { checkIn: { gte: monthStart, lte: monthEnd } }
  }

  // ── Owner filter ──────────────────────────────────────────────────────────
  const ownerFilter = isAdmin ? {} : { property: { ownerId } }

  // ── Build where clause ────────────────────────────────────────────────────
  const where = {
    ...ownerFilter,
    ...(statusFilter && Object.values(BookingStatus).includes(statusFilter)
      ? { status: statusFilter }
      : {}),
    ...(propertyId ? { propertyId } : {}),
    ...dateFilter,
    ...(search
      ? {
          OR: [
            { guestName:        { contains: search, mode: 'insensitive' as const } },
            { guestEmail:       { contains: search, mode: 'insensitive' as const } },
            { confirmationCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [rawBookings, total, properties] = await Promise.all([
    db.booking.findMany({
      where,
      select: {
        id:               true,
        confirmationCode: true,
        guestName:        true,
        guestEmail:       true,
        guestPhone:       true,
        guestCountry:     true,
        guestCount:       true,
        checkIn:          true,
        checkOut:         true,
        nights:           true,
        status:           true,
        source:           true,
        totalPrice:       true,
        paymentStatus:    true,
        guestMessage:     true,
        checkedInAt:      true,
        checkedOutAt:     true,
        couponUsage: {
          select: { coupon: { select: { code: true } } },
        },
        property: {
          select: {
            id:                 true,
            title:              true,
            type:               true,
            accessCode:         true,
            wifiName:           true,
            wifiPassword:       true,
            floor:              true,
            accessInstructions: true,
            contactPhone:       true,
          },
        },
        room: {
          select: {
            id:   true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    db.booking.count({ where }),
    db.property.findMany({
      where:   isAdmin ? {} : { ownerId },
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  // Serialize Dates → ISO strings for client component
  const bookings: BookingRow[] = rawBookings.map((b) => ({
    ...b,
    status:        b.status        as string,
    source:        b.source        as string,
    paymentStatus: b.paymentStatus as string,
    checkIn:       b.checkIn.toISOString(),
    checkOut:      b.checkOut.toISOString(),
    checkedInAt:   b.checkedInAt  ? b.checkedInAt.toISOString()  : null,
    checkedOutAt:  b.checkedOutAt ? b.checkedOutAt.toISOString() : null,
    couponCode:    b.couponUsage?.coupon.code ?? null,
    property: { ...b.property, type: b.property.type as string },
    room: b.room ? { ...b.room, type: b.room.type as string } : null,
  }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Reservas</h2>
          <p className="text-slate-500 mt-1">
            {total} reserva{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <Suspense fallback={null}>
          <SearchFilters
            currentStatus={statusFilter ?? ''}
            currentSearch={search}
            currentPropertyId={propertyId}
            currentDateRange={dateRange}
            properties={properties}
          />
        </Suspense>

        <ReservationsTable
          bookings={bookings}
          total={total}
          page={page}
          totalPages={totalPages}
          statusFilter={statusFilter ?? ''}
          search={search}
          propertyId={propertyId}
          dateRange={dateRange}
        />
      </div>
    </div>
  )
}
