'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CheckInModal from '@/domains/booking/components/CheckInModal'
import BookingDetailModal from '@/domains/booking/components/BookingDetailModal'
import type { BookingRow } from '@/app/dashboard/reservations/page'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendente',         cls: 'bg-amber-50 text-amber-700'    },
  CONFIRMED: { label: 'Confirmado',       cls: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado',        cls: 'bg-red-50 text-red-700'        },
  COMPLETED: { label: 'Concluído',        cls: 'bg-slate-100 text-slate-600'   },
  NO_SHOW:   { label: 'Não Compareceu',   cls: 'bg-slate-100 text-slate-600'   },
}

const SOURCE_CONFIG: Record<string, { label: string; cls: string }> = {
  DIRECT:  { label: 'Direto',   cls: 'bg-emerald-50 text-emerald-700' },
  AIRBNB:  { label: 'Airbnb',   cls: 'bg-orange-50 text-orange-700'  },
  BOOKING: { label: 'Booking',  cls: 'bg-blue-50 text-blue-700'      },
  MANUAL:  { label: 'Manual',   cls: 'bg-slate-100 text-slate-500'   },
}

const ROOM_TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  ENTIRE_PLACE:  { label: 'Casa Completa', cls: 'bg-[#8b1a1a] text-white'          },
  DOUBLE:        { label: 'Duplo',         cls: 'bg-slate-100 text-slate-600'       },
  SINGLE:        { label: 'Individual',    cls: 'bg-slate-100 text-slate-600'       },
  TWIN:          { label: 'Twin',          cls: 'bg-slate-100 text-slate-600'       },
  SUITE:         { label: 'Suite',         cls: 'bg-purple-50 text-purple-700'      },
  JUNIOR_SUITE:  { label: 'Suite',         cls: 'bg-purple-50 text-purple-700'      },
  FAMILY:        { label: 'Família',       cls: 'bg-slate-100 text-slate-600'       },
  STUDIO:        { label: 'Studio',        cls: 'bg-slate-100 text-slate-600'       },
}

const PROPERTY_TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  APARTMENT: { label: 'Apartamento', cls: 'bg-slate-100 text-slate-600' },
  HOUSE:     { label: 'Casa',        cls: 'bg-slate-100 text-slate-600' },
  VILLA:     { label: 'Villa',       cls: 'bg-slate-100 text-slate-600' },
  STUDIO:    { label: 'Estúdio',     cls: 'bg-slate-100 text-slate-600' },
  ROOM:      { label: 'Quarto',      cls: 'bg-slate-100 text-slate-600' },
}

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEstadia(checkIn: string, checkOut: string, nights: number): string {
  const ci = new Date(checkIn)
  const co = new Date(checkOut)
  const ciDay = ci.getUTCDate()
  const coDay = co.getUTCDate()
  const ciMon = MONTHS_PT[ci.getUTCMonth()]
  const coMon = MONTHS_PT[co.getUTCMonth()]
  if (ci.getUTCMonth() === co.getUTCMonth()) {
    return `${ciDay} - ${coDay} ${ciMon} (${nights} nts)`
  }
  return `${ciDay} ${ciMon} - ${coDay} ${coMon} (${nights} nts)`
}

function isToday(isoStr: string): boolean {
  const d = new Date(isoStr)
  const t = new Date()
  return (
    d.getUTCFullYear() === t.getUTCFullYear() &&
    d.getUTCMonth()    === t.getUTCMonth()    &&
    d.getUTCDate()     === t.getUTCDate()
  )
}

function getActions(booking: BookingRow) {
  const checkInDate = new Date(booking.checkIn)
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  checkInDate.setUTCHours(0, 0, 0, 0)

  if (booking.status === 'PENDING') return { view: true, cancel: true }

  if (booking.status === 'CONFIRMED') {
    // Currently staying — checked in but not checked out
    if (booking.checkedInAt && !booking.checkedOutAt) {
      return { view: true, checkout: true }
    }
    // Future booking
    if (checkInDate > now) return { view: true }
    // Today's arrivals or past (not yet checked in)
    return { view: true, checkin: true }
  }

  return { view: true }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  bookings:     BookingRow[]
  total:        number
  page:         number
  totalPages:   number
  statusFilter: string
  search:       string
  propertyId:   string
  dateRange:    string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReservationsTable({
  bookings,
  total,
  page,
  totalPages,
  statusFilter,
  search,
  propertyId,
  dateRange,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [checkInBooking, setCheckInBooking]   = useState<BookingRow | null>(null)
  const [detailBooking,  setDetailBooking]    = useState<BookingRow | null>(null)
  const [localStatuses,  setLocalStatuses]    = useState<Record<string, string>>({})

  function paginationHref(p: number) {
    const sp = new URLSearchParams()
    if (statusFilter) sp.set('status', statusFilter)
    if (search)       sp.set('search', search)
    if (propertyId)   sp.set('propertyId', propertyId)
    if (dateRange)    sp.set('dateRange', dateRange)
    if (p > 1)        sp.set('page', String(p))
    return `?${sp.toString()}`
  }

  async function handleCancel(booking: BookingRow) {
    if (!window.confirm(`Cancelar a reserva de ${booking.guestName}?`)) return
    const res = await fetch(`/api/reservations/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    if (res.ok) {
      setLocalStatuses((prev) => ({ ...prev, [booking.id]: 'CANCELLED' }))
    }
  }

  async function handleCheckOut(booking: BookingRow) {
    if (!window.confirm(`Confirmar check-out de ${booking.guestName}?`)) return
    const res = await fetch(`/api/reservations/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkout' }),
    })
    if (res.ok) {
      setLocalStatuses((prev) => ({ ...prev, [booking.id]: 'COMPLETED' }))
      startTransition(() => router.refresh())
    }
  }

  function handleCheckInConfirm(bookingId: string) {
    setLocalStatuses((prev) => ({ ...prev, [bookingId]: 'checked_in' }))
    startTransition(() => router.refresh())
  }

  return (
    <>
      {/* Check-in modal */}
      {checkInBooking && (
        <CheckInModal
          booking={checkInBooking}
          isOpen={true}
          onClose={() => setCheckInBooking(null)}
          onConfirm={handleCheckInConfirm}
        />
      )}

      {/* Booking detail modal */}
      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          isOpen={true}
          onClose={() => setDetailBooking(null)}
        />
      )}

      {bookings.length === 0 ? (
        <div className="p-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
          <p className="text-slate-400 mt-2 font-medium">Nenhuma reserva encontrada.</p>
          {(search || statusFilter || propertyId || dateRange) && (
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
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Estadia</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Unidade</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Pax</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Canal</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Estado</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((res) => {
                const effectiveStatus = localStatuses[res.id] ?? res.status
                const statusCfg  = STATUS_CONFIG[effectiveStatus]  ?? { label: effectiveStatus, cls: 'bg-slate-100 text-slate-600' }
                const sourceCfg  = SOURCE_CONFIG[res.source]       ?? { label: res.source,      cls: 'bg-slate-100 text-slate-600' }
                const actions    = getActions({ ...res, status: effectiveStatus })
                const todayArrival = res.status === 'CONFIRMED' && isToday(res.checkIn) && !res.checkedInAt

                // Unit display
                const unitName = res.room?.name ?? res.property.title
                const unitType = res.room
                  ? (ROOM_TYPE_CONFIG[res.room.type]     ?? { label: res.room.type,      cls: 'bg-slate-100 text-slate-600' })
                  : (PROPERTY_TYPE_CONFIG[res.property.type] ?? { label: res.property.type, cls: 'bg-slate-100 text-slate-600' })

                return (
                  <tr
                    key={res.id}
                    className={`hover:bg-slate-50 transition-colors ${todayArrival ? 'border-l-4 border-[#8b1a1a]' : ''}`}
                  >
                    {/* ID */}
                    <td className="px-5 py-4 font-mono font-bold text-[#1a1a2e] text-sm">
                      #{res.confirmationCode.slice(-6)}
                    </td>

                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#1a1a2e] text-sm">{res.guestName}</p>
                      <p className="text-[11px] text-slate-400">{res.guestEmail}</p>
                    </td>

                    {/* Estadia */}
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {fmtEstadia(res.checkIn, res.checkOut, res.nights)}
                    </td>

                    {/* Unidade */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#1a1a2e]">{unitName}</p>
                      <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${unitType.cls}`}>
                        {unitType.label}
                      </span>
                    </td>

                    {/* Pax */}
                    <td className="px-5 py-4 text-sm text-slate-600 text-center">
                      {res.guestCount} pax
                    </td>

                    {/* Canal */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${sourceCfg.cls}`}>
                        {sourceCfg.label}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Ver */}
                        <button
                          onClick={() => setDetailBooking(res)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#1a1a2e] transition-all"
                          title="Ver reserva"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>

                        {/* Check-in */}
                        {actions.checkin && (
                          <button
                            onClick={() => setCheckInBooking(res)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              todayArrival
                                ? 'bg-[#8b1a1a] text-white hover:bg-[#6b1414]'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                            title="Fazer check-in"
                          >
                            <span className="material-symbols-outlined text-sm">login</span>
                            Check-in
                          </button>
                        )}

                        {/* Check-out */}
                        {actions.checkout && (
                          <button
                            onClick={() => handleCheckOut(res)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                            title="Fazer check-out"
                          >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            Check-out
                          </button>
                        )}

                        {/* Cancelar */}
                        {actions.cancel && (
                          <button
                            onClick={() => handleCancel(res)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                            title="Cancelar reserva"
                          >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        )}
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
                href={paginationHref(page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={paginationHref(page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}
