'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday, addWeeks, subWeeks,
  addDays, subDays, isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  CalendarBooking, CalendarBlockedDate, CalendarProperty, CalendarRoom,
} from './page'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; line?: boolean }> = {
  CONFIRMED: { bg: 'bg-emerald-100', border: 'border-l-emerald-500', text: 'text-emerald-800' },
  PENDING:   { bg: 'bg-amber-100',   border: 'border-l-amber-500',   text: 'text-amber-800'   },
  CANCELLED: { bg: 'bg-red-100',     border: 'border-l-red-400',     text: 'text-red-600', line: true },
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  PENDING:   'Pendente',
  CANCELLED: 'Cancelada',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function bookingsForDay(bookings: CalendarBooking[], dateStr: string) {
  return bookings.filter((b) => b.checkIn <= dateStr && b.checkOut > dateStr)
}

function blockedForDay(blocked: CalendarBlockedDate[], dateStr: string) {
  return blocked.find((b) => b.date === dateStr) ?? null
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────

function BookingModal({
  booking,
  onClose,
}: {
  booking: CalendarBooking
  onClose: () => void
}) {
  const s = STATUS_STYLE[booking.status] ?? STATUS_STYLE.PENDING

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {booking.confirmationCode}
            </p>
            <h3 className="text-lg font-bold text-[#1a1a2e]">{booking.guestName}</h3>
            {booking.roomName && (
              <p className="text-sm text-slate-500">{booking.roomName}</p>
            )}
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
          >
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check-in</p>
            <p className="font-semibold text-[#1a1a2e]">
              {format(new Date(booking.checkIn + 'T00:00:00'), 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check-out</p>
            <p className="font-semibold text-[#1a1a2e]">
              {format(new Date(booking.checkOut + 'T00:00:00'), 'dd MMM yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
            {booking.guestEmail}
          </div>
          {booking.guestPhone && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-slate-400">phone</span>
              {booking.guestPhone}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-400">group</span>
            {booking.guestCount} hóspede{booking.guestCount !== 1 ? 's' : ''}
            &nbsp;·&nbsp;{booking.nights} noite{booking.nights !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-400">payments</span>
            {fmtCurrency(booking.totalPrice)}
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-400">home</span>
            {booking.propertyTitle}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

// ─── Block Date Modal ─────────────────────────────────────────────────────────

function BlockModal({
  date,
  existing,
  propertyId,
  roomId,
  onClose,
  onRefresh,
}: {
  date: string
  existing: CalendarBlockedDate | null
  propertyId: string
  roomId: string
  onClose: () => void
  onRefresh: () => void
}) {
  const [reason, setReason] = useState(existing?.reason ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBlock() {
    if (!propertyId) { setError('Selecione uma propriedade primeiro.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/calendar/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, date, reason: reason || undefined, roomId: roomId || undefined }),
      })
      const json = await res.json()
      if (!res.ok) { setError(typeof json.error === 'string' ? json.error : 'Erro ao bloquear.'); return }
      onRefresh()
      onClose()
    } catch { setError('Erro de ligação.') }
    setLoading(false)
  }

  async function handleUnblock() {
    if (!existing) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(
        `/api/calendar/block/${existing.id}?type=${existing.type}`,
        { method: 'DELETE' },
      )
      if (!res.ok) { setError('Erro ao desbloquear.'); return }
      onRefresh()
      onClose()
    } catch { setError('Erro de ligação.') }
    setLoading(false)
  }

  const displayDate = format(new Date(date + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: ptBR })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-bold text-[#1a1a2e]">
            {existing ? 'Dia bloqueado' : 'Bloquear dia'}
          </h3>
          <p className="text-sm text-slate-500 capitalize mt-0.5">{displayDate}</p>
        </div>

        {existing ? (
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-slate-500">Motivo</p>
            <p className="text-sm text-slate-700">{existing.reason || '—'}</p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ex: Manutenção, Uso pessoal…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-3">
          {existing ? (
            <button
              onClick={handleUnblock}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? '…' : 'Desbloquear'}
            </button>
          ) : (
            <button
              onClick={handleBlock}
              disabled={loading || !propertyId}
              className="flex-1 py-2.5 rounded-xl bg-[#1a1a2e] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '…' : 'Bloquear dia'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Month Grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  monthDate,
  bookings,
  blockedDates,
  onBookingClick,
  onDayClick,
}: {
  monthDate: Date
  bookings: CalendarBooking[]
  blockedDates: CalendarBlockedDate[]
  onBookingClick: (b: CalendarBooking) => void
  onDayClick: (dateStr: string, blocked: CalendarBlockedDate | null) => void
}) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </div>
        ))}
      </div>

      {/* Day cells — in rows of 7 */}
      <div className="grid grid-cols-7">
        {gridDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, monthDate)
          const today = isToday(day)
          const dayBookings = bookingsForDay(bookings, dateStr)
          const blocked = blockedForDay(blockedDates, dateStr)
          const maxVisible = 3

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr, blocked)}
              className={`min-h-[100px] p-1.5 border-r border-b border-slate-100 cursor-pointer transition-colors group
                ${!inMonth ? 'bg-slate-50/60' : 'hover:bg-slate-50/80'}
                ${blocked ? 'bg-slate-100' : ''}
              `}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                    ${today ? 'bg-[#8b1a1a] text-white' : inMonth ? 'text-[#1a1a2e]' : 'text-slate-300'}
                  `}
                >
                  {format(day, 'd')}
                </span>
                {blocked && (
                  <span
                    className="material-symbols-outlined text-sm text-slate-400"
                    title={blocked.reason ?? 'Bloqueado'}
                  >
                    lock
                  </span>
                )}
              </div>

              {/* Blocked label */}
              {blocked && (
                <div className="mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-slate-200 truncate">
                  {blocked.reason || 'Bloqueado'}
                </div>
              )}

              {/* Booking pills */}
              <div className="space-y-0.5">
                {dayBookings.slice(0, maxVisible).map((b) => {
                  const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING
                  return (
                    <div
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(b) }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border-l-2 cursor-pointer
                        hover:opacity-80 transition-opacity
                        ${s.bg} ${s.border} ${s.text}
                        ${s.line ? 'line-through' : ''}
                      `}
                      title={`${b.guestName}${b.roomName ? ` · ${b.roomName}` : ''}`}
                    >
                      {b.guestName}
                      {b.roomName && (
                        <span className="opacity-60 ml-1">· {b.roomName}</span>
                      )}
                    </div>
                  )
                })}
                {dayBookings.length > maxVisible && (
                  <p className="text-[10px] text-slate-400 font-medium px-1">
                    +{dayBookings.length - maxVisible} mais
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week Grid ────────────────────────────────────────────────────────────────

function WeekGrid({
  weekStart,
  bookings,
  blockedDates,
  onBookingClick,
  onDayClick,
}: {
  weekStart: Date
  bookings: CalendarBooking[]
  blockedDates: CalendarBlockedDate[]
  onBookingClick: (b: CalendarBooking) => void
  onDayClick: (dateStr: string, blocked: CalendarBlockedDate | null) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {days.map((day) => {
          const today = isToday(day)
          return (
            <div key={day.toISOString()} className={`py-3 text-center ${today ? 'bg-[#1a1a2e]/5' : ''}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${today ? 'text-[#1a1a2e]' : 'text-slate-400'}`}>
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={`text-lg font-extrabold ${today ? 'text-[#8b1a1a]' : 'text-[#1a1a2e]'}`}>
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const today = isToday(day)
          const dayBookings = bookingsForDay(bookings, dateStr)
          const blocked = blockedForDay(blockedDates, dateStr)

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr, blocked)}
              className={`min-h-[180px] p-2 space-y-1.5 cursor-pointer hover:bg-slate-50 transition-colors
                ${today ? 'bg-[#1a1a2e]/3' : ''}
                ${blocked ? 'bg-slate-100' : ''}
              `}
            >
              {blocked && (
                <div className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 bg-slate-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  {blocked.reason || 'Bloqueado'}
                </div>
              )}
              {dayBookings.map((b) => {
                const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING
                return (
                  <div
                    key={b.id}
                    onClick={(e) => { e.stopPropagation(); onBookingClick(b) }}
                    className={`px-2 py-1.5 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity
                      ${s.bg} ${s.border} ${s.text}
                    `}
                  >
                    <p className={`text-[11px] font-bold truncate ${s.line ? 'line-through' : ''}`}>
                      {b.guestName}
                    </p>
                    {b.roomName && (
                      <p className="text-[10px] opacity-60 truncate">{b.roomName}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  day,
  bookings,
  blockedDates,
  onBookingClick,
  onDayClick,
}: {
  day: Date
  bookings: CalendarBooking[]
  blockedDates: CalendarBlockedDate[]
  onBookingClick: (b: CalendarBooking) => void
  onDayClick: (dateStr: string, blocked: CalendarBlockedDate | null) => void
}) {
  const dateStr = format(day, 'yyyy-MM-dd')
  const dayBookings = bookingsForDay(bookings, dateStr)
  const blocked = blockedForDay(blockedDates, dateStr)
  const displayDate = format(day, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#1a1a2e] capitalize">{displayDate}</h3>
        <button
          onClick={() => onDayClick(dateStr, blocked)}
          className="text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">
            {blocked ? 'lock_open' : 'lock'}
          </span>
          {blocked ? 'Desbloquear' : 'Bloquear dia'}
        </button>
      </div>

      {blocked && (
        <div className="bg-slate-100 rounded-xl px-4 py-3 flex items-center gap-2 text-slate-600 text-sm">
          <span className="material-symbols-outlined text-sm">lock</span>
          Bloqueado: {blocked.reason || '—'}
        </div>
      )}

      {dayBookings.length === 0 && !blocked && (
        <p className="text-sm text-slate-400 text-center py-8">Sem reservas para este dia.</p>
      )}

      <div className="space-y-3">
        {dayBookings.map((b) => {
          const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.PENDING
          return (
            <div
              key={b.id}
              onClick={() => onBookingClick(b)}
              className={`p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${s.bg} ${s.border}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`font-bold text-sm ${s.text} ${s.line ? 'line-through' : ''}`}>
                    {b.guestName}
                  </p>
                  {b.roomName && <p className="text-xs text-slate-500 mt-0.5">{b.roomName}</p>}
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>{b.checkIn} → {b.checkOut}</span>
                <span>{b.nights} noite{b.nights !== 1 ? 's' : ''}</span>
                <span>{fmtCurrency(b.totalPrice)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'day'

interface Props {
  initialMonth: string  // YYYY-MM
  properties: CalendarProperty[]
  rooms: CalendarRoom[]
  bookings: CalendarBooking[]
  blockedDates: CalendarBlockedDate[]
  propertyIdFilter: string
  roomIdFilter: string
}

export default function CalendarClient({
  initialMonth, properties, rooms, bookings, blockedDates,
  propertyIdFilter, roomIdFilter,
}: Props) {
  const router = useRouter()

  const [view, setView] = useState<ViewMode>('month')
  const [focusDate, setFocusDate] = useState<Date>(() => new Date(initialMonth + '-01T00:00:00'))

  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [blockModal, setBlockModal] = useState<{ date: string; existing: CalendarBlockedDate | null } | null>(null)

  // Month label
  const monthLabel = format(focusDate, "MMMM 'de' yyyy", { locale: ptBR })

  // Navigation: update URL (triggers server re-render with new data)
  function navigate(direction: 'prev' | 'next') {
    let next: Date
    if (view === 'month') {
      next = direction === 'prev' ? subMonths(focusDate, 1) : addMonths(focusDate, 1)
    } else if (view === 'week') {
      next = direction === 'prev' ? subWeeks(focusDate, 1) : addWeeks(focusDate, 1)
    } else {
      next = direction === 'prev' ? subDays(focusDate, 1) : addDays(focusDate, 1)
    }
    setFocusDate(next)
    const month = format(next, 'yyyy-MM')
    const url = buildUrl({ month })
    router.push(url)
  }

  function buildUrl(overrides: Record<string, string> = {}) {
    const p = new URLSearchParams()
    const month = overrides.month ?? format(focusDate, 'yyyy-MM')
    p.set('month', month)
    if (overrides.propertyId !== undefined) {
      if (overrides.propertyId) p.set('propertyId', overrides.propertyId)
    } else if (propertyIdFilter) {
      p.set('propertyId', propertyIdFilter)
    }
    if (overrides.roomId !== undefined) {
      if (overrides.roomId) p.set('roomId', overrides.roomId)
    } else if (roomIdFilter) {
      p.set('roomId', roomIdFilter)
    }
    return `/dashboard/calendar?${p.toString()}`
  }

  function handlePropertyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildUrl({ propertyId: e.target.value, roomId: '' }))
  }

  function handleRoomChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(buildUrl({ roomId: e.target.value }))
  }

  const handleDayClick = useCallback(
    (dateStr: string, existing: CalendarBlockedDate | null) => {
      setBlockModal({ date: dateStr, existing })
    },
    [],
  )

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  // Focus label for week/day
  let focusLabel = ''
  if (view === 'week') {
    const wStart = startOfWeek(focusDate, { weekStartsOn: 1 })
    const wEnd = endOfWeek(focusDate, { weekStartsOn: 1 })
    focusLabel = `${format(wStart, 'd MMM', { locale: ptBR })} – ${format(wEnd, 'd MMM yyyy', { locale: ptBR })}`
  } else if (view === 'day') {
    focusLabel = format(focusDate, "d 'de' MMMM yyyy", { locale: ptBR })
  } else {
    focusLabel = monthLabel
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Calendário de Reservas</h2>
            <p className="text-sm text-slate-500 mt-0.5">Gerencie as suas reservas e disponibilidade.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('prev')}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-slate-500">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-[#1a1a2e] capitalize min-w-[160px] text-center">
              {focusLabel}
            </span>
            <button
              onClick={() => navigate('next')}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-slate-500">chevron_right</span>
            </button>
          </div>

          {/* Today */}
          <button
            onClick={() => {
              const today = new Date()
              setFocusDate(today)
              router.push(buildUrl({ month: format(today, 'yyyy-MM') }))
            }}
            className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            Hoje
          </button>

          {/* View selector */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors
                  ${view === v ? 'bg-[#1a1a2e] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {{ month: 'Mês', week: 'Semana', day: 'Dia' }[v]}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Property filter */}
          {properties.length > 1 && (
            <select
              value={propertyIdFilter}
              onChange={handlePropertyChange}
              className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 bg-white"
            >
              <option value="">Todas as propriedades</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          {/* Room filter */}
          {rooms.length > 0 && (
            <select
              value={roomIdFilter}
              onChange={handleRoomChange}
              className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 bg-white"
            >
              <option value="">Todos os quartos</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />Confirmada
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />Pendente
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-300" />Cancelada
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />Bloqueado
            </span>
          </div>
        </div>

        {/* Empty state */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">calendar_today</span>
            <p className="text-slate-400 mt-2 font-medium">Nenhuma propriedade encontrada.</p>
          </div>
        ) : (
          <>
            {view === 'month' && (
              <MonthGrid
                monthDate={focusDate}
                bookings={bookings}
                blockedDates={blockedDates}
                onBookingClick={setSelectedBooking}
                onDayClick={handleDayClick}
              />
            )}
            {view === 'week' && (
              <WeekGrid
                weekStart={startOfWeek(focusDate, { weekStartsOn: 1 })}
                bookings={bookings}
                blockedDates={blockedDates}
                onBookingClick={setSelectedBooking}
                onDayClick={handleDayClick}
              />
            )}
            {view === 'day' && (
              <DayView
                day={focusDate}
                bookings={bookings}
                blockedDates={blockedDates}
                onBookingClick={setSelectedBooking}
                onDayClick={handleDayClick}
              />
            )}
          </>
        )}
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}

      {/* Block/unblock modal */}
      {blockModal && (
        <BlockModal
          date={blockModal.date}
          existing={blockModal.existing}
          propertyId={propertyIdFilter || (properties[0]?.id ?? '')}
          roomId={roomIdFilter}
          onClose={() => setBlockModal(null)}
          onRefresh={handleRefresh}
        />
      )}
    </>
  )
}
