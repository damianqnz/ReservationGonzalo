import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000

/** Monday of the week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

const STATUS_BLOCK: Record<string, { label: string; bg: string; border: string; text: string }> = {
  CONFIRMED: {
    label: 'CONFIRMADO',
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
  },
  PENDING: {
    label: 'PENDENTE',
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-600',
  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ month?: string; propertyId?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  const propertyIdFilter = params.propertyId ?? ''

  // Compute the displayed week (default: current week)
  const now = new Date()
  const wStart = weekStart(now)
  const wEnd = new Date(wStart.getTime() + 7 * DAY_MS)

  const weekDates = Array.from({ length: 7 }, (_, i) => new Date(wStart.getTime() + i * DAY_MS))

  const ownerId = session.user.id

  const [properties, bookings] = await Promise.all([
    db.property.findMany({
      where: { ownerId },
      select: { id: true, title: true, maxGuests: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.booking.findMany({
      where: {
        property: { ownerId },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn: { lt: wEnd },
        checkOut: { gt: wStart },
        ...(propertyIdFilter ? { propertyId: propertyIdFilter } : {}),
      },
      select: {
        id: true,
        confirmationCode: true,
        guestName: true,
        checkIn: true,
        checkOut: true,
        status: true,
        propertyId: true,
      },
    }),
  ])

  // Pre-compute block positions for each booking
  type Block = {
    id: string
    guestName: string
    status: string
    leftPct: number
    widthPct: number
  }

  function blocksForProperty(propertyId: string): Block[] {
    return bookings
      .filter((b) => b.propertyId === propertyId)
      .map((b) => {
        const startMs = Math.max(b.checkIn.getTime(), wStart.getTime())
        const endMs = Math.min(b.checkOut.getTime(), wEnd.getTime())
        const leftDays = (startMs - wStart.getTime()) / DAY_MS
        const widthDays = (endMs - startMs) / DAY_MS
        return {
          id: b.id,
          guestName: b.guestName,
          status: b.status,
          leftPct: Math.max(0, (leftDays / 7) * 100),
          widthPct: Math.min(100, (widthDays / 7) * 100),
        }
      })
  }

  const filteredProperties = propertyIdFilter
    ? properties.filter((p) => p.id === propertyIdFilter)
    : properties

  const monthLabel = wStart.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
            Calendário de Reservas
          </h2>
          <p className="text-sm text-slate-500">
            Gerencie as suas reservas e disponibilidade.
          </p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-600">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-xs font-medium text-slate-600">Pendente</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {properties.length > 1 && (
            <form method="GET">
              <select
                name="propertyId"
                defaultValue={propertyIdFilter}
                onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
                className="text-xs font-medium border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-1.5 ring-0"
              >
                <option value="">Todas as Propriedades</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </form>
          )}
          <span className="text-sm font-bold text-[#1a1a2e] px-2 capitalize">{monthLabel}</span>
        </div>
      </div>

      {/* Week grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">home_work</span>
          <p className="text-slate-400 mt-2">Nenhuma propriedade encontrada.</p>
          <Link
            href="/dashboard/properties"
            className="mt-4 inline-block text-sm font-bold text-[#8b1a1a] hover:underline"
          >
            Adicionar propriedade
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200">
            <div className="p-4 border-r border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Propriedade
            </div>
            {weekDates.map((d, i) => {
              const isToday = d.toDateString() === now.toDateString()
              return (
                <div
                  key={i}
                  className={`p-4 text-center border-r border-slate-200 ${isToday ? 'bg-[#1a1a2e]/5' : ''}`}
                >
                  <p
                    className={`text-[10px] font-bold ${isToday ? 'text-[#1a1a2e]' : 'text-slate-400'}`}
                  >
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`text-sm font-bold ${isToday ? 'text-[#1a1a2e] font-extrabold' : 'text-[#1a1a2e]'}`}
                  >
                    {d.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Property rows */}
          {filteredProperties.map((property, pIdx) => {
            const blocks = blocksForProperty(property.id)
            return (
              <div
                key={property.id}
                className={`grid grid-cols-[200px_repeat(7,1fr)] ${pIdx < filteredProperties.length - 1 ? 'border-b border-slate-200' : ''} relative h-24`}
              >
                <div className="p-4 border-r border-slate-200 bg-slate-50/20 flex flex-col justify-center">
                  <p className="text-sm font-bold text-[#1a1a2e] truncate">{property.title}</p>
                  <p className="text-[10px] text-slate-500">
                    Até {property.maxGuests} hóspede{property.maxGuests !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="col-span-7 grid grid-cols-7 relative">
                  {weekDates.map((d, i) => {
                    const isToday = d.toDateString() === now.toDateString()
                    return (
                      <div
                        key={i}
                        className={`border-r border-slate-100 ${isToday ? 'bg-[#1a1a2e]/5' : ''}`}
                      />
                    )
                  })}
                  {blocks.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                      <p className="text-xs text-slate-400 italic">Sem reservas esta semana</p>
                    </div>
                  )}
                  {blocks.map((block) => {
                    const s = STATUS_BLOCK[block.status] ?? STATUS_BLOCK.PENDING
                    return (
                      <div
                        key={block.id}
                        className={`absolute top-4 h-14 ${s.bg} border-l-4 ${s.border} rounded-r-lg p-2 cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
                        style={{
                          left: `${block.leftPct}%`,
                          width: `${Math.max(block.widthPct, 14)}%`,
                        }}
                      >
                        <p className={`text-[10px] font-bold ${s.text}`}>{s.label}</p>
                        <p className="text-xs font-bold text-[#1a1a2e] truncate">
                          {block.guestName}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
