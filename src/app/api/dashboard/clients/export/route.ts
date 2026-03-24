import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { z } from 'zod'
import { format } from 'date-fns'

// ─── Country names (PT locale) ────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal',       ES: 'Espanha',        FR: 'França',
  DE: 'Alemanha',       GB: 'Reino Unido',    IT: 'Itália',
  BR: 'Brasil',         NL: 'Países Baixos',  BE: 'Bélgica',
  US: 'Estados Unidos', CH: 'Suíça',          AT: 'Áustria',
  PL: 'Polónia',        SE: 'Suécia',         NO: 'Noruega',
  DK: 'Dinamarca',      FI: 'Finlândia',      IE: 'Irlanda',
  CA: 'Canadá',         AU: 'Austrália',
}

function countryName(code: string | null): string {
  if (!code) return ''
  return COUNTRY_NAMES[code.toUpperCase()] ?? code
}

// ─── Query schema ─────────────────────────────────────────────────────────────

const querySchema = z.object({
  search:     z.string().optional(),
  country:    z.string().optional(),
  marketing:  z.enum(['true', 'false']).optional(),
  propertyId: z.string().optional(),
  period:     z.enum(['30d', '90d', '1y', 'all']).optional().default('all'),
})

function periodStart(period: string): Date | null {
  const now = new Date()
  if (period === '30d') return new Date(now.getTime() - 30 * 86_400_000)
  if (period === '90d') return new Date(now.getTime() - 90 * 86_400_000)
  if (period === '1y')  return new Date(now.getTime() - 365 * 86_400_000)
  return null
}

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  // Escape double quotes, wrap in quotes if contains comma/quote/newline
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(',')
}

// ─── GET /api/dashboard/clients/export ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const sp = Object.fromEntries(new URL(req.url).searchParams.entries())
  const parsed = querySchema.safeParse(sp)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { search, country, marketing, propertyId, period } = parsed.data
  const isAdmin = session.user.role === 'ADMIN'

  try {
    // ── Resolve property scope ──────────────────────────────────────────────
    let propertyIds: string[] | undefined

    if (!isAdmin) {
      const props = await db.property.findMany({
        where: { ownerId: session.user.id },
        select: { id: true },
      })
      propertyIds = props.map((p) => p.id)
      if (propertyIds.length === 0) {
        return new NextResponse('Nome,Email,Telefone,País,Canal,Reservas,Total Gasto (EUR),Primeira Reserva,Última Reserva,Aceitou Marketing\r\n', {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="clientes-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
          },
        })
      }
    }

    // ── Build WHERE clause ──────────────────────────────────────────────────
    const cutoff = periodStart(period)

    const where = {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      ...(propertyIds ? { propertyId: { in: propertyIds } } : {}),
      ...(propertyId  ? { propertyId } : {}),
      ...(country     ? { guestCountry: country } : {}),
      ...(marketing !== undefined
        ? { acceptedMarketing: marketing === 'true' }
        : {}),
      ...(cutoff      ? { checkIn: { gte: cutoff } } : {}),
      ...(search
        ? {
            OR: [
              { guestName:  { contains: search, mode: 'insensitive' as const } },
              { guestEmail: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const bookings = await db.booking.findMany({
      where,
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

    // ── Group by email ──────────────────────────────────────────────────────
    type AggRow = {
      guestName: string; guestEmail: string; guestPhone: string | null
      guestCountry: string | null; acceptedMarketing: boolean
      totalBookings: number; totalSpent: number
      lastBooking: string; firstBooking: string
      _srcCounts: Record<string, number>
    }

    const map = new Map<string, AggRow>()

    for (const b of bookings) {
      const email = b.guestEmail.toLowerCase()
      const checkInDate = toYMD(b.checkIn)
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
        existing._srcCounts[src] = (existing._srcCounts[src] ?? 0) + 1
      }
    }

    const SOURCE_LABELS: Record<string, string> = {
      WEBSITE: 'Website', AIRBNB: 'Airbnb', BOOKING: 'Booking', MANUAL: 'Manual',
    }

    const clients = Array.from(map.values())
      .sort((a, b) => b.lastBooking.localeCompare(a.lastBooking))
      .map(({ _srcCounts, ...rest }) => {
        let primarySource = 'WEBSITE'
        let maxCount = 0
        for (const [src, count] of Object.entries(_srcCounts)) {
          if (count > maxCount) { maxCount = count; primarySource = src }
        }
        return { ...rest, primarySource }
      })

    // ── Build CSV ───────────────────────────────────────────────────────────
    const headers = ['Nome', 'Email', 'Telefone', 'País', 'Canal', 'Reservas',
                     'Total Gasto (EUR)', 'Primeira Reserva', 'Última Reserva', 'Aceitou Marketing']

    const rows = [
      headers.join(','),
      ...clients.map((c) =>
        csvRow([
          c.guestName,
          c.guestEmail,
          c.guestPhone ?? '',
          countryName(c.guestCountry),
          SOURCE_LABELS[c.primarySource] ?? c.primarySource,
          c.totalBookings,
          c.totalSpent.toFixed(2),
          c.firstBooking,
          c.lastBooking,
          c.acceptedMarketing ? 'Sim' : 'Não',
        ]),
      ),
    ]

    const csv = rows.join('\r\n') + '\r\n'
    const filename = `clientes-${format(new Date(), 'yyyy-MM-dd')}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[dashboard/clients/export/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
