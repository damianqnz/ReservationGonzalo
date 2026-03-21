import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'
import { Suspense } from 'react'
import SearchFilters from './SearchFilters'

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
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function countryFlag(code: string): string {
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'amber' },
  CONFIRMED: { label: 'Confirmado', color: 'emerald' },
  CANCELLED: { label: 'Cancelado', color: 'red' },
  COMPLETED: { label: 'Concluído', color: 'blue' },
  NO_SHOW: { label: 'Não Compareceu', color: 'slate' },
}

const PAGE_SIZE = 20

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; search?: string }>
}

export default async function ReservationsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  const statusFilter = params.status as BookingStatus | undefined
  const search = params.search?.trim() ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const skip = (page - 1) * PAGE_SIZE

  const ownerId = session.user.id

  // ── Build where clause ────────────────────────────────────────────────────
  const where = {
    property: { ownerId },
    ...(statusFilter && Object.values(BookingStatus).includes(statusFilter)
      ? { status: statusFilter }
      : {}),
    ...(search
      ? {
          OR: [
            { guestName: { contains: search, mode: 'insensitive' as const } },
            { guestEmail: { contains: search, mode: 'insensitive' as const } },
            { confirmationCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [reservations, total] = await db.$transaction([
    db.booking.findMany({
      where,
      select: {
        id: true,
        confirmationCode: true,
        guestName: true,
        guestEmail: true,
        guestCountry: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        property: {
          select: {
            title: true,
            address: true,
            city: true,
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    db.booking.count({ where }),
  ])

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
          <SearchFilters currentStatus={statusFilter ?? ''} currentSearch={search} />
        </Suspense>

        {reservations.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
            <p className="text-slate-400 mt-2 font-medium">Nenhuma reserva encontrada.</p>
            {(search || statusFilter) && (
              <Link
                href="/dashboard/reservations"
                className="mt-4 inline-block text-sm font-bold text-[#8b1a1a] hover:underline"
              >
                Limpar filtros
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Check-in / Out</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Propriedade</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reservations.map((res) => {
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
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1.5">
                              {res.guestName}
                              {res.guestCountry && (
                                <span title={res.guestCountry} className="text-base leading-none">
                                  {countryFlag(res.guestCountry)}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">{res.guestEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-500">
                        <div>{fmtDate(res.checkIn)}</div>
                        <div className="text-[10px]">{fmtDate(res.checkOut)}</div>
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-500">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-text-main truncate">
                              {res.property.title}
                            </h3>
                            {res.room && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                                {res.room.name}
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] text-text-muted truncate">
                            {res.property.address}, {res.property.city}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span
                          className={`px-3 py-1 bg-${s.color}-50 text-${s.color}-700 text-xs font-bold rounded-full`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold">{fmtCurrency(res.totalPrice)}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/confirmacion?bookingId=${res.id}`}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#1a1a2e]"
                            title="Ver reserva"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-slate-200 flex items-center justify-between text-sm">
            <p className="text-slate-500">
              Página {page} de {totalPages} · {total} resultados
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}), page: String(page - 1) }).toString()}`}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}), page: String(page + 1) }).toString()}`}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Próxima
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
