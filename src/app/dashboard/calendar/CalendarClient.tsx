'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isToday, addWeeks, subWeeks,
  addDays, subDays,
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

const REASONS = [
  { value: 'personal',    label: 'Uso pessoal'                        },
  { value: 'maintenance', label: 'Manutenção'                         },
  { value: 'external',    label: 'Reserva externa (Airbnb/Booking)'   },
  { value: 'other',       label: 'Outro'                              },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(dateStr: string) {
  return format(new Date(dateStr + 'T00:00:00'), "d 'de' MMMM", { locale: ptBR })
}

function bookingsForDay(bookings: CalendarBooking[], dateStr: string) {
  return bookings.filter((b) => b.checkIn <= dateStr && b.checkOut > dateStr)
}

function blockedForDay(blocked: CalendarBlockedDate[], dateStr: string) {
  return blocked.find((b) => b.date === dateStr) ?? null
}

function daysInRange(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end   + 'T00:00:00Z')
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1)
}

/** Returns lo/hi pair for a range (handles reversed selection) */
function normalizeRange(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

// ─── Range highlight helpers (pure functions) ─────────────────────────────────

function getRangeClasses(
  dateStr: string,
  rangeStart: string | null,
  effectiveEnd: string | null,
): { isEndpoint: boolean; isInRange: boolean } {
  if (!rangeStart) return { isEndpoint: false, isInRange: false }
  const [lo, hi] = normalizeRange(rangeStart, effectiveEnd ?? rangeStart)
  const isEndpoint = dateStr === lo || dateStr === hi
  const isInRange  = dateStr > lo && dateStr < hi
  return { isEndpoint, isInRange }
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────

function BookingModal({ booking, onClose }: { booking: CalendarBooking; onClose: () => void }) {
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
            {booking.roomName && <p className="text-sm text-slate-500">{booking.roomName}</p>}
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
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

// ─── Block Range Modal ────────────────────────────────────────────────────────

function BlockRangeModal({
  start, end,
  properties, rooms,
  propertyIdFilter, roomIdFilter,
  onClose, onBlocked,
}: {
  start:            string
  end:              string
  properties:       CalendarProperty[]
  rooms:            CalendarRoom[]
  propertyIdFilter: string
  roomIdFilter:     string
  onClose:          () => void
  onBlocked:        (count: number) => void
}) {
  const [editStart,  setEditStart]  = useState(start)
  const [editEnd,    setEditEnd]    = useState(end)
  const [propId,     setPropId]     = useState(propertyIdFilter || properties[0]?.id || '')
  const [roomId,     setRoomId]     = useState(roomIdFilter)
  const [reasonKey,  setReasonKey]  = useState('personal')
  const [notes,      setNotes]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const selectedProp = properties.find((p) => p.id === propId)
  const count        = editStart && editEnd && editEnd >= editStart
    ? daysInRange(editStart, editEnd)
    : 0

  async function handleBlock() {
    if (!propId) { setError('Selecione uma propriedade.'); return }
    if (!editStart || !editEnd || editEnd < editStart) { setError('Datas inválidas.'); return }
    setLoading(true); setError(null)

    const reason = reasonKey === 'other'
      ? (notes.trim() || 'Outro')
      : (REASONS.find((r) => r.value === reasonKey)?.label ?? '')

    try {
      const res = await fetch('/api/calendar/block', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: propId,
          startDate:  editStart,
          endDate:    editEnd,
          reason:     reason || undefined,
          roomId:     roomId || undefined,
        }),
      })
      const json = await res.json() as { data: { count: number } | null; error: string | null }
      if (!res.ok) { setError(typeof json.error === 'string' ? json.error : 'Erro ao bloquear.'); return }
      onBlocked(json.data?.count ?? count)
      onClose()
    } catch {
      setError('Erro de ligação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-[460px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-[#1a1a2e]">Bloquear período</h3>
            {count > 0 && (
              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                {fmtDate(editStart)} → {fmtDate(editEnd)} &middot; {count} dia{count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Date range (editable — useful on mobile) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Início
              </label>
              <input
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Fim
              </label>
              <input
                type="date"
                min={editStart}
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Property select */}
          {properties.length > 1 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Propriedade
              </label>
              <select
                value={propId}
                onChange={(e) => { setPropId(e.target.value); setRoomId('') }}
                className={selectCls}
              >
                <option value="">Selecionar...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Room select — only if current property has rooms and rooms are loaded */}
          {selectedProp?.hasRooms && rooms.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Quarto
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={selectCls}
              >
                <option value="">Todos os quartos</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Motivo
            </label>
            <select
              value={reasonKey}
              onChange={(e) => setReasonKey(e.target.value)}
              className={selectCls}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Notes — only if "Outro" */}
          {reasonKey === 'other' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Notas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva o motivo do bloqueio..."
                className={`${inputCls} resize-none`}
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-xs font-semibold">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleBlock}
            disabled={loading || !propId || count === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#8b1a1a] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading
              ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> A bloquear...</>
              : <><span className="material-symbols-outlined text-base">lock</span> Bloquear período</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Unblock Day Modal ────────────────────────────────────────────────────────

function UnblockDayModal({
  blocked,
  onClose,
  onUnblocked,
}: {
  blocked:     CalendarBlockedDate
  onClose:     () => void
  onUnblocked: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleUnblock() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(
        `/api/calendar/block/${blocked.id}?type=${blocked.type}`,
        { method: 'DELETE' },
      )
      if (!res.ok) { setError('Erro ao desbloquear.'); return }
      onUnblocked()
      onClose()
    } catch {
      setError('Erro de ligação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1a1a2e]">Dia bloqueado</h3>
            <p className="text-sm text-slate-500 capitalize mt-0.5">
              {fmtDate(blocked.date)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-500">lock</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo</p>
          <p className="text-sm text-slate-700">{blocked.reason || '—'}</p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUnblock}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading
              ? '…'
              : <><span className="material-symbols-outlined text-base">lock_open</span> Desbloquear</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Month Grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  monthDate, bookings, blockedDates,
  onBookingClick, onDayClick, onDayHover, onGridLeave,
  rangeStart, rangeEnd, rangeHover, selecting,
}: {
  monthDate:      Date
  bookings:       CalendarBooking[]
  blockedDates:   CalendarBlockedDate[]
  onBookingClick: (b: CalendarBooking) => void
  onDayClick:     (dateStr: string, blocked: CalendarBlockedDate | null) => void
  onDayHover:     (dateStr: string) => void
  onGridLeave:    () => void
  rangeStart:     string | null
  rangeEnd:       string | null
  rangeHover:     string | null
  selecting:      boolean
}) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd   = endOfMonth(monthDate)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 })
  const gridDays   = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const effectiveEnd = rangeEnd ?? rangeHover

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

      {/* Day cells */}
      <div className="grid grid-cols-7" onMouseLeave={onGridLeave}>
        {gridDays.map((day) => {
          const dateStr  = format(day, 'yyyy-MM-dd')
          const inMonth  = isSameMonth(day, monthDate)
          const today    = isToday(day)
          const dayBkgs  = bookingsForDay(bookings, dateStr)
          const blocked  = blockedForDay(blockedDates, dateStr)
          const { isEndpoint, isInRange } = getRangeClasses(dateStr, rangeStart, effectiveEnd)
          const maxVisible = 3

          let cellBg = ''
          if (isEndpoint)      cellBg = 'bg-[#8b1a1a]/20'
          else if (isInRange)  cellBg = 'bg-[#8b1a1a]/10'
          else if (blocked)    cellBg = 'bg-slate-100'
          else if (!inMonth)   cellBg = 'bg-slate-50/60'

          const cursorCls = selecting ? 'cursor-crosshair' : 'cursor-pointer'

          let dayNumBg = ''
          if (isEndpoint)    dayNumBg = 'bg-[#8b1a1a] text-white'
          else if (today)    dayNumBg = 'bg-[#8b1a1a] text-white'
          else if (inMonth)  dayNumBg = 'text-[#1a1a2e]'
          else               dayNumBg = 'text-slate-300'

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr, blocked)}
              onMouseEnter={() => onDayHover(dateStr)}
              className={`min-h-[100px] p-1.5 border-r border-b border-slate-100 transition-colors group
                ${cellBg}
                ${!isEndpoint && !isInRange && !blocked && inMonth ? 'hover:bg-slate-50/80' : ''}
                ${cursorCls}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${dayNumBg}`}>
                  {format(day, 'd')}
                </span>
                {blocked && !isEndpoint && (
                  <span
                    className="material-symbols-outlined text-sm text-slate-400"
                    title={blocked.reason ?? 'Bloqueado'}
                  >
                    lock
                  </span>
                )}
                {isEndpoint && !rangeEnd && (
                  <span className="material-symbols-outlined text-xs text-[#8b1a1a] opacity-70">
                    radio_button_checked
                  </span>
                )}
              </div>

              {blocked && !isEndpoint && !isInRange && (
                <div className="mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 bg-slate-200 truncate">
                  {blocked.reason || 'Bloqueado'}
                </div>
              )}

              <div className="space-y-0.5">
                {dayBkgs.slice(0, maxVisible).map((b) => {
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
                      {b.roomName && <span className="opacity-60 ml-1">· {b.roomName}</span>}
                    </div>
                  )
                })}
                {dayBkgs.length > maxVisible && (
                  <p className="text-[10px] text-slate-400 font-medium px-1">
                    +{dayBkgs.length - maxVisible} mais
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
  weekStart, bookings, blockedDates,
  onBookingClick, onDayClick, onDayHover, onGridLeave,
  rangeStart, rangeEnd, rangeHover, selecting,
}: {
  weekStart:      Date
  bookings:       CalendarBooking[]
  blockedDates:   CalendarBlockedDate[]
  onBookingClick: (b: CalendarBooking) => void
  onDayClick:     (dateStr: string, blocked: CalendarBlockedDate | null) => void
  onDayHover:     (dateStr: string) => void
  onGridLeave:    () => void
  rangeStart:     string | null
  rangeEnd:       string | null
  rangeHover:     string | null
  selecting:      boolean
}) {
  const days         = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const effectiveEnd = rangeEnd ?? rangeHover

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
      <div className="grid grid-cols-7 divide-x divide-slate-100" onMouseLeave={onGridLeave}>
        {days.map((day) => {
          const dateStr  = format(day, 'yyyy-MM-dd')
          const today    = isToday(day)
          const dayBkgs  = bookingsForDay(bookings, dateStr)
          const blocked  = blockedForDay(blockedDates, dateStr)
          const { isEndpoint, isInRange } = getRangeClasses(dateStr, rangeStart, effectiveEnd)
          const cursorCls = selecting ? 'cursor-crosshair' : 'cursor-pointer'

          let cellBg = ''
          if (isEndpoint)     cellBg = 'bg-[#8b1a1a]/20'
          else if (isInRange) cellBg = 'bg-[#8b1a1a]/10'
          else if (blocked)   cellBg = 'bg-slate-100'
          else if (today)     cellBg = 'bg-[#1a1a2e]/3'

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr, blocked)}
              onMouseEnter={() => onDayHover(dateStr)}
              className={`min-h-[180px] p-2 space-y-1.5 transition-colors
                ${cellBg}
                ${!isEndpoint && !isInRange && !blocked ? 'hover:bg-slate-50' : ''}
                ${cursorCls}
              `}
            >
              {blocked && !isEndpoint && !isInRange && (
                <div className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 bg-slate-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  {blocked.reason || 'Bloqueado'}
                </div>
              )}
              {isEndpoint && (
                <div className="px-2 py-1 rounded-lg text-[11px] font-semibold text-white bg-[#8b1a1a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    {!rangeEnd ? 'radio_button_checked' : 'lock'}
                  </span>
                  {!rangeEnd ? 'Início' : 'Selecionado'}
                </div>
              )}
              {isInRange && (
                <div className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#8b1a1a] bg-[#8b1a1a]/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">horizontal_rule</span>
                  Selecionado
                </div>
              )}
              {dayBkgs.map((b) => {
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
                    {b.roomName && <p className="text-[10px] opacity-60 truncate">{b.roomName}</p>}
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
  day, bookings, blockedDates, onBookingClick, onDayClick,
}: {
  day:            Date
  bookings:       CalendarBooking[]
  blockedDates:   CalendarBlockedDate[]
  onBookingClick: (b: CalendarBooking) => void
  onDayClick:     (dateStr: string, blocked: CalendarBlockedDate | null) => void
}) {
  const dateStr    = format(day, 'yyyy-MM-dd')
  const dayBkgs    = bookingsForDay(bookings, dateStr)
  const blocked    = blockedForDay(blockedDates, dateStr)
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

      {dayBkgs.length === 0 && !blocked && (
        <p className="text-sm text-slate-400 text-center py-8">Sem reservas para este dia.</p>
      )}

      <div className="space-y-3">
        {dayBkgs.map((b) => {
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

// ─── Shared input classes ─────────────────────────────────────────────────────

const inputCls  = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]'
const selectCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] bg-white'

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'day'

interface Props {
  initialMonth:     string
  properties:       CalendarProperty[]
  rooms:            CalendarRoom[]
  bookings:         CalendarBooking[]
  blockedDates:     CalendarBlockedDate[]
  propertyIdFilter: string
  roomIdFilter:     string
}

export default function CalendarClient({
  initialMonth, properties, rooms, bookings, blockedDates,
  propertyIdFilter, roomIdFilter,
}: Props) {
  const router = useRouter()

  const [view,      setView]      = useState<ViewMode>('month')
  const [focusDate, setFocusDate] = useState<Date>(() => new Date(initialMonth + '-01T00:00:00'))

  // Booking modal
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)

  // Range selection state
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [rangeEnd,   setRangeEnd]   = useState<string | null>(null)
  const [rangeHover, setRangeHover] = useState<string | null>(null)
  const selecting = rangeStart !== null && rangeEnd === null

  // Modals
  const [blockRangeModal, setBlockRangeModal] = useState<{ start: string; end: string } | null>(null)
  const [unblockModal,    setUnblockModal]    = useState<CalendarBlockedDate | null>(null)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function clearSelection() {
    setRangeStart(null)
    setRangeEnd(null)
    setRangeHover(null)
  }

  // Navigation
  const monthLabel = format(focusDate, "MMMM 'de' yyyy", { locale: ptBR })

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
    router.push(buildUrl({ month: format(next, 'yyyy-MM') }))
  }

  function buildUrl(overrides: Record<string, string> = {}) {
    const p = new URLSearchParams()
    p.set('month', overrides.month ?? format(focusDate, 'yyyy-MM'))
    const pid = overrides.propertyId !== undefined ? overrides.propertyId : propertyIdFilter
    const rid = overrides.roomId     !== undefined ? overrides.roomId     : roomIdFilter
    if (pid) p.set('propertyId', pid)
    if (rid) p.set('roomId', rid)
    return `/dashboard/calendar?${p.toString()}`
  }

  function handlePropertyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    clearSelection()
    router.push(buildUrl({ propertyId: e.target.value, roomId: '' }))
  }

  function handleRoomChange(e: React.ChangeEvent<HTMLSelectElement>) {
    clearSelection()
    router.push(buildUrl({ roomId: e.target.value }))
  }

  // Day click — range selection logic
  const handleDayClick = useCallback(
    (dateStr: string, blocked: CalendarBlockedDate | null) => {
      if (blocked) {
        // Click on blocked day: open unblock modal, reset selection
        setUnblockModal(blocked)
        clearSelection()
        return
      }

      if (!rangeStart) {
        // First click: start selection
        setRangeStart(dateStr)
        setRangeEnd(null)
        setRangeHover(null)
      } else if (dateStr === rangeStart) {
        // Click same day: treat as single-day range
        setRangeEnd(dateStr)
        setBlockRangeModal({ start: dateStr, end: dateStr })
      } else {
        // Second click: confirm range
        const [lo, hi] = normalizeRange(rangeStart, dateStr)
        setRangeStart(lo)
        setRangeEnd(hi)
        setRangeHover(null)
        setBlockRangeModal({ start: lo, end: hi })
      }
    },
    [rangeStart], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleDayHover = useCallback(
    (dateStr: string) => {
      if (rangeStart && !rangeEnd) setRangeHover(dateStr)
    },
    [rangeStart, rangeEnd],
  )

  const handleGridLeave = useCallback(() => {
    setRangeHover(null)
  }, [])

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  // Focus label
  let focusLabel = monthLabel
  if (view === 'week') {
    const wStart = startOfWeek(focusDate, { weekStartsOn: 1 })
    const wEnd   = endOfWeek(focusDate,   { weekStartsOn: 1 })
    focusLabel = `${format(wStart, 'd MMM', { locale: ptBR })} – ${format(wEnd, 'd MMM yyyy', { locale: ptBR })}`
  } else if (view === 'day') {
    focusLabel = format(focusDate, "d 'de' MMMM yyyy", { locale: ptBR })
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Calendário de Reservas</h2>
            <p className="text-sm text-slate-500 mt-0.5">Gerencie as suas reservas e disponibilidade.</p>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            {selecting ? (
              <button
                onClick={clearSelection}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Limpar seleção
              </button>
            ) : (
              <button
                onClick={() => {
                  // Focus the calendar — user then clicks to start range
                  clearSelection()
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#8b1a1a] border border-[#8b1a1a]/30 rounded-lg px-3 py-2 hover:bg-[#8b1a1a]/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                Bloquear período
              </button>
            )}
          </div>
        </div>

        {/* Selection hint banner */}
        {rangeStart && !rangeEnd && (
          <div className="flex items-center justify-between gap-3 bg-[#8b1a1a]/5 border border-[#8b1a1a]/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[#8b1a1a] font-semibold">
              <span className="material-symbols-outlined text-base">touch_app</span>
              <span>
                Início: <strong className="capitalize">{fmtDate(rangeStart)}</strong>
                {' '}— clique noutra data para finalizar o intervalo
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 rounded-lg text-[#8b1a1a]/60 hover:text-[#8b1a1a] hover:bg-[#8b1a1a]/10 transition-colors"
              title="Cancelar seleção"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('prev')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined text-lg text-slate-500">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-[#1a1a2e] capitalize min-w-[160px] text-center">
              {focusLabel}
            </span>
            <button onClick={() => navigate('next')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
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
                onClick={() => { setView(v); clearSelection() }}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors
                  ${view === v ? 'bg-[#1a1a2e] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {{ month: 'Mês', week: 'Semana', day: 'Dia' }[v]}
              </button>
            ))}
          </div>

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
          <div className="flex flex-wrap items-center gap-3">
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
            {(rangeStart ?? selecting) && (
              <span className="flex items-center gap-1.5 text-xs text-[#8b1a1a] font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#8b1a1a]/40" />Selecionado
              </span>
            )}
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
                onDayHover={handleDayHover}
                onGridLeave={handleGridLeave}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                rangeHover={rangeHover}
                selecting={selecting}
              />
            )}
            {view === 'week' && (
              <WeekGrid
                weekStart={startOfWeek(focusDate, { weekStartsOn: 1 })}
                bookings={bookings}
                blockedDates={blockedDates}
                onBookingClick={setSelectedBooking}
                onDayClick={handleDayClick}
                onDayHover={handleDayHover}
                onGridLeave={handleGridLeave}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                rangeHover={rangeHover}
                selecting={selecting}
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

        {/* Legend for selection state */}
        {!rangeStart && !selecting && (
          <p className="text-xs text-slate-400 text-center pb-2">
            Clique em qualquer dia livre para iniciar a seleção de um período a bloquear.
          </p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1a1a2e] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
          <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
          {toast}
        </div>
      )}

      {/* Booking detail modal */}
      {selectedBooking && (
        <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}

      {/* Block range modal */}
      {blockRangeModal && (
        <BlockRangeModal
          start={blockRangeModal.start}
          end={blockRangeModal.end}
          properties={properties}
          rooms={rooms}
          propertyIdFilter={propertyIdFilter || (properties[0]?.id ?? '')}
          roomIdFilter={roomIdFilter}
          onClose={() => { setBlockRangeModal(null); clearSelection() }}
          onBlocked={(count) => {
            setBlockRangeModal(null)
            clearSelection()
            showToast(`${count} dia${count !== 1 ? 's' : ''} bloqueado${count !== 1 ? 's' : ''} com sucesso`)
            handleRefresh()
          }}
        />
      )}

      {/* Unblock modal */}
      {unblockModal && (
        <UnblockDayModal
          blocked={unblockModal}
          onClose={() => setUnblockModal(null)}
          onUnblocked={() => {
            setUnblockModal(null)
            showToast('Dia desbloqueado')
            handleRefresh()
          }}
        />
      )}
    </>
  )
}
