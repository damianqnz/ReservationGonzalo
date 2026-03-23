import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import StatCard from '@/components/stitch/StatCard'
import Link from 'next/link'
import SparklineSection from './SparklineSection'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'Pendente',         color: 'amber'   },
  CONFIRMED: { label: 'Confirmado',      color: 'emerald' },
  CANCELLED: { label: 'Cancelado',       color: 'red'     },
  COMPLETED: { label: 'Concluído',       color: 'blue'    },
  NO_SHOW:   { label: 'Não Compareceu',  color: 'slate'   },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin = session.user.role === 'ADMIN'
  const ownerId = session.user.id

  const ownerFilter = isAdmin ? {} : { property: { ownerId } }

  // ── Date helpers ──────────────────────────────────────────────────────────
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const daysInMonth = monthEnd.getDate()
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const weekFromNow = new Date(now)
  weekFromNow.setDate(weekFromNow.getDate() + 7)

  // ── Stats (parallel) ──────────────────────────────────────────────────────
  const [activeBookings, monthRevenueAgg, checkInsToday] = await Promise.all([
    // 1. Total active — CONFIRMED + COMPLETED
    db.booking.count({
      where: {
        ...ownerFilter,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    // 2. Revenue this month — CONFIRMED + COMPLETED with checkIn in current month
    db.booking.aggregate({
      where: {
        ...ownerFilter,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        checkIn: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalPrice: true },
    }),
    // 3. Check-ins today — CONFIRMED with checkIn = today
    db.booking.count({
      where: {
        ...ownerFilter,
        status: BookingStatus.CONFIRMED,
        checkIn: { gte: todayStart, lte: todayEnd },
      },
    }),
  ])

  const monthRevenue = monthRevenueAgg._sum.totalPrice ?? 0

  // ── Occupancy rate for current month ──────────────────────────────────────
  const propertyWhere = isAdmin ? {} : { ownerId }
  const [properties, occupancyBookings] = await Promise.all([
    db.property.findMany({ where: propertyWhere, select: { id: true } }),
    db.booking.findMany({
      where: {
        ...ownerFilter,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn:  { lt: monthEnd },
        checkOut: { gt: monthStart },
      },
      select: { checkIn: true, checkOut: true },
    }),
  ])

  let occupiedDays = 0
  for (const b of occupancyBookings) {
    const start = b.checkIn  > monthStart ? b.checkIn  : monthStart
    const end   = b.checkOut < monthEnd   ? b.checkOut : monthEnd
    occupiedDays += Math.max(
      0,
      Math.ceil((end.getTime() - start.getTime()) / 86_400_000),
    )
  }
  const totalCapacityDays = daysInMonth * Math.max(1, properties.length)
  const occupancyRate = Math.min(100, Math.round((occupiedDays / totalCapacityDays) * 100))

  // ── Upcoming check-ins / check-outs ───────────────────────────────────────
  const bookingSelect = {
    id:               true,
    confirmationCode: true,
    guestName:        true,
    checkIn:          true,
    checkOut:         true,
    status:           true,
    totalPrice:       true,
    nights:           true,
    property: { select: { title: true } },
  } as const

  const [upcomingCheckIns, upcomingCheckOuts, recentBookings] = await Promise.all([
    db.booking.findMany({
      where: {
        ...ownerFilter,
        status:  BookingStatus.CONFIRMED,
        checkIn: { gte: now, lte: weekFromNow },
      },
      select:  bookingSelect,
      orderBy: { checkIn: 'asc' },
      take:    5,
    }),
    db.booking.findMany({
      where: {
        ...ownerFilter,
        status:   BookingStatus.CONFIRMED,
        checkOut: { gte: now, lte: weekFromNow },
      },
      select:  bookingSelect,
      orderBy: { checkOut: 'asc' },
      take:    5,
    }),
    db.booking.findMany({
      where:   ownerFilter,
      select:  bookingSelect,
      orderBy: { createdAt: 'desc' },
      take:    5,
    }),
  ])

  // ── Sparkline: last 6 months booking counts ───────────────────────────────
  const MONTHS_PT_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const sparkMonths: { month: string; bookings: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    sparkMonths.push({ month: MONTHS_PT_SHORT[d.getMonth()], bookings: 0 })
  }
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const sparkBookings = await db.booking.findMany({
    where: {
      ...ownerFilter,
      status:  { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      checkIn: { gte: sixMonthsAgo },
    },
    select: { checkIn: true },
  })
  for (const b of sparkBookings) {
    const mIdx =
      (b.checkIn.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
      b.checkIn.getMonth() - sixMonthsAgo.getMonth()
    if (mIdx >= 0 && mIdx < 6) sparkMonths[mIdx].bookings++
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">
            Visão Geral do Painel
          </h2>
          <p className="text-slate-500 mt-1">
            Bem-vindo de volta. Aqui está o que está a acontecer hoje.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/reservations"
            className="px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">event_available</span>
            <span>Ver Reservas</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Reservas"
          value={activeBookings.toLocaleString('pt-PT')}
          change="Confirmadas + Concluídas"
          isPositive={activeBookings > 0}
          icon="event_available"
          color="primary"
        />
        <StatCard
          title="Receita do Mês"
          value={fmtCurrency(monthRevenue)}
          change={`${now.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`}
          isPositive={monthRevenue > 0}
          icon="payments"
          color="accent"
        />
        <StatCard
          title="Check-ins Hoje"
          value={checkInsToday.toLocaleString('pt-PT')}
          change={checkInsToday > 0 ? 'Chegadas confirmadas' : 'Sem chegadas hoje'}
          isPositive={checkInsToday > 0}
          icon="login"
          color="primary"
        />
        <StatCard
          title="Taxa de Ocupação"
          value={`${occupancyRate}%`}
          change={`Mês ${now.toLocaleDateString('pt-PT', { month: 'long' })}`}
          isPositive={occupancyRate >= 50}
          icon="hotel"
          color="accent"
        />
      </div>

      {/* Upcoming check-ins/outs */}
      {(upcomingCheckIns.length > 0 || upcomingCheckOuts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-ins */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl">login</span>
              Check-ins próximos (7 dias)
            </h3>
            {upcomingCheckIns.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Sem check-ins previstos.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingCheckIns.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-[#1a1a2e]">{b.guestName}</p>
                      <p className="text-xs text-slate-500">
                        {b.property?.title} · {fmtDate(b.checkIn)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {b.nights} noite{b.nights !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Check-outs */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8b1a1a] text-xl">logout</span>
              Check-outs próximos (7 dias)
            </h3>
            {upcomingCheckOuts.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Sem check-outs previstos.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingCheckOuts.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-[#1a1a2e]">{b.guestName}</p>
                      <p className="text-xs text-slate-500">
                        {b.property?.title} · {fmtDate(b.checkOut)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                      {fmtCurrency(b.totalPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Sparkline quick analytics */}
      <SparklineSection data={sparkMonths} />

      {/* Recent bookings table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#1a1a2e]">Reservas Recentes</h3>
            <p className="text-sm text-slate-500">Últimas 5 reservas</p>
          </div>
          <Link
            href="/dashboard/reservations"
            className="text-[#8b1a1a] text-sm font-bold hover:underline"
          >
            Ver Todas
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">
              event_busy
            </span>
            <p className="text-slate-400 mt-2">Nenhuma reserva encontrada.</p>
            <p className="text-sm text-slate-400">
              Quando receber a primeira reserva, aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Código</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Hóspede</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Check-in</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentBookings.map((res) => {
                  const s = STATUS_MAP[res.status] ?? { label: res.status, color: 'slate' }
                  return (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 font-bold text-[#1a1a2e] text-sm">
                        {res.confirmationCode}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#1a1a2e] text-xs">
                            {initials(res.guestName)}
                          </div>
                          <span className="text-sm font-medium">{res.guestName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-500">{fmtDate(res.checkIn)}</td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 bg-${s.color}-50 text-${s.color}-700 text-xs font-bold rounded-full`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold">{fmtCurrency(res.totalPrice)}</td>
                      <td className="px-8 py-4">
                        <Link
                          href={`/dashboard/reservations?search=${res.confirmationCode}`}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-all inline-block"
                        >
                          <span className="material-symbols-outlined text-slate-400">more_horiz</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
