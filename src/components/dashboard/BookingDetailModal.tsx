'use client'

import { useEffect } from 'react'
import type { BookingRow } from '@/app/dashboard/reservations/page'

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  PT: '🇵🇹', ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', GB: '🇬🇧',
  IT: '🇮🇹', BR: '🇧🇷', NL: '🇳🇱', BE: '🇧🇪', US: '🇺🇸',
  CH: '🇨🇭', AT: '🇦🇹', PL: '🇵🇱', SE: '🇸🇪', NO: '🇳🇴',
  DK: '🇩🇰', FI: '🇫🇮', IE: '🇮🇪', CA: '🇨🇦', AU: '🇦🇺',
}

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal',       ES: 'Espanha',        FR: 'França',
  DE: 'Alemanha',       GB: 'Reino Unido',    IT: 'Itália',
  BR: 'Brasil',         NL: 'Países Baixos',  BE: 'Bélgica',
  US: 'Estados Unidos', CH: 'Suíça',          AT: 'Áustria',
  PL: 'Polónia',        SE: 'Suécia',         NO: 'Noruega',
  DK: 'Dinamarca',      FI: 'Finlândia',      IE: 'Irlanda',
  CA: 'Canadá',         AU: 'Austrália',
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  UNPAID:   { label: 'Não pago',     cls: 'bg-red-50 text-red-700'          },
  PARTIAL:  { label: 'Parcial',      cls: 'bg-amber-50 text-amber-700'      },
  PAID:     { label: 'Pago',         cls: 'bg-emerald-50 text-emerald-700'  },
  REFUNDED: { label: 'Reembolsado',  cls: 'bg-slate-100 text-slate-600'     },
}

const SOURCE_CONFIG: Record<string, { label: string; cls: string }> = {
  DIRECT:  { label: 'Website',  cls: 'bg-emerald-50 text-emerald-700' },
  AIRBNB:  { label: 'Airbnb',   cls: 'bg-orange-50 text-orange-700'  },
  BOOKING: { label: 'Booking',  cls: 'bg-blue-50 text-blue-700'      },
  MANUAL:  { label: 'Manual',   cls: 'bg-slate-100 text-slate-500'   },
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  ENTIRE_PLACE: 'Alojamento Completo',
  DOUBLE:       'Quarto Duplo',
  SINGLE:       'Quarto Individual',
  TWIN:         'Quarto Twin',
  SUITE:        'Suite',
  JUNIOR_SUITE: 'Suite',
  FAMILY:       'Quarto Família',
  STUDIO:       'Studio',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function fmtTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  booking: BookingRow
  isOpen:  boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingDetailModal({ booking: b, isOpen, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const countryCode   = b.guestCountry?.toUpperCase() ?? ''
  const countryLabel  = countryCode
    ? `${COUNTRY_FLAGS[countryCode] ?? '🌍'} ${COUNTRY_NAMES[countryCode] ?? b.guestCountry}`
    : null

  const paymentCfg = PAYMENT_STATUS_CONFIG[b.paymentStatus] ?? { label: b.paymentStatus, cls: 'bg-slate-100 text-slate-600' }
  const sourceCfg  = SOURCE_CONFIG[b.source] ?? { label: b.source, cls: 'bg-slate-100 text-slate-600' }

  const unitLabel = b.room
    ? (ROOM_TYPE_LABELS[b.room.type] ?? b.room.type)
    : (ROOM_TYPE_LABELS[b.property.type] ?? 'Propriedade Completa')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reserva</p>
            <h2 className="text-lg font-extrabold text-[#1a1a2e] tracking-tight font-mono">
              #{b.confirmationCode}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">

          {/* ── Hóspede ── */}
          <Section title="Hóspede">
            <Row label="Nome"     value={b.guestName} />
            <Row label="Email"    value={b.guestEmail} />
            <Row label="Telefone" value={b.guestPhone ?? 'N/A'} />
            <Row label="País"     value={countryLabel ?? 'N/A'} />
          </Section>

          {/* ── Estadia ── */}
          <Section title="Estadia">
            <Row label="Check-in"  value={`${fmtDate(b.checkIn)} às ${fmtTime(b.checkIn)}`} />
            <Row label="Check-out" value={`${fmtDate(b.checkOut)} às ${fmtTime(b.checkOut)}`} />
            <Row label="Noites"    value={String(b.nights)} />
            <Row label="Hóspedes" value={`${b.guestCount} pax`} />
          </Section>

          {/* ── Unidade ── */}
          <Section title="Unidade">
            <Row label="Propriedade" value={b.property.title} />
            {b.room && <Row label="Tipo" value={b.room.name} />}
            <div className="flex items-start gap-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium w-28 shrink-0 pt-0.5">Categoria</span>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600`}>
                {unitLabel}
              </span>
            </div>
          </Section>

          {/* ── Pagamento ── */}
          <Section title="Pagamento">
            <Row label="Total" value={fmtCurrency(b.totalPrice)} bold />
            <div className="flex items-start gap-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium w-28 shrink-0 pt-0.5">Estado</span>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${paymentCfg.cls}`}>
                {paymentCfg.label}
              </span>
            </div>
            <div className="flex items-start gap-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium w-28 shrink-0 pt-0.5">Canal</span>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${sourceCfg.cls}`}>
                {sourceCfg.label}
              </span>
            </div>
            <Row label="Cupão" value={b.couponCode ?? 'N/A'} />
          </Section>

          {/* ── Mensagem ── */}
          {b.guestMessage && (
            <Section title="Mensagem do Hóspede">
              <p className="text-sm text-slate-600 italic leading-relaxed">
                &ldquo;{b.guestMessage}&rdquo;
              </p>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1a1a2e] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
      <div className="bg-slate-50 rounded-xl px-4 py-1 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-xs text-slate-400 font-medium w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-[#1a1a2e] break-all ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  )
}
