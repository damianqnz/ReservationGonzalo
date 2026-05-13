'use client'

import { useState } from 'react'
import type { BookingRow } from '@/app/dashboard/reservations/page'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmtDate(isoStr: string): string {
  const d = new Date(isoStr)
  return `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function buildWhatsAppMessage(booking: BookingRow): string {
  const p = booking.property
  const unitName = booking.room?.name ?? p.title
  const lines: string[] = [
    `Olá ${booking.guestName}! 👋`,
    `Bem-vindo/a ao ${p.title}!`,
    '',
    'Aqui estão os seus dados de acesso:',
    p.accessCode         ? `🔑 Código: ${p.accessCode}` : '',
    p.wifiName           ? `📶 WiFi: ${p.wifiName}${p.wifiPassword ? ` / ${p.wifiPassword}` : ''}` : '',
    p.floor              ? `🏠 ${p.floor}` : '',
    p.accessInstructions ? `\n${p.accessInstructions}` : '',
    '',
    p.contactPhone       ? `Qualquer dúvida estou disponível: ${p.contactPhone}` : '',
    '',
    'Boa estadia! 😊',
  ]
  return lines.filter((l) => l !== '').join('\n').trim()
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  booking:   BookingRow
  isOpen:    boolean
  onClose:   () => void
  onConfirm: (bookingId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckInModal({ booking, isOpen, onClose, onConfirm }: Props) {
  const [confirmed,     setConfirmed]     = useState(false)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [emailStatus,   setEmailStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  const p        = booking.property
  const unitName = booking.room?.name ?? p.title
  const phone    = booking.guestPhone?.replace(/\D/g, '') ?? ''
  const whatsAppMsg = buildWhatsAppMessage(booking)

  async function handleConfirmCheckIn() {
    if (!confirmed) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/reservations/${booking.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'checkin' }),
      })
      if (res.ok) {
        onConfirm(booking.id)
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSendEmail() {
    setEmailStatus('loading')
    try {
      const res = await fetch('/api/emails/checkin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId: booking.id }),
      })
      setEmailStatus(res.ok ? 'success' : 'error')
    } catch {
      setEmailStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1a1a2e]">
                Check-in — {booking.guestName}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {unitName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1 — Confirmar entrada */}
          <div>
            <h3 className="text-sm font-bold text-[#1a1a2e] mb-3">
              1. Confirmar entrada
            </h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#8b1a1a] cursor-pointer"
              />
              <span className="text-sm text-slate-700">
                Confirmo que o hóspede chegou e entregou as chaves
              </span>
            </label>
          </div>

          {/* Section 2 — Dados de acesso */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#1a1a2e]">2. Dados de acesso</h3>
              <a
                href={`/dashboard/properties/${p.id}/edit#access`}
                className="text-xs text-[#8b1a1a] hover:underline font-medium"
              >
                Editar dados de acesso →
              </a>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <AccessRow icon="key" label="Código da caixa" value={p.accessCode} />
              <AccessRow
                icon="wifi"
                label="WiFi"
                value={p.wifiName ? `${p.wifiName}${p.wifiPassword ? ` / ${p.wifiPassword}` : ''}` : null}
              />
              <AccessRow icon="home" label="Localização" value={p.floor} />
              <AccessRow icon="info" label="Instruções" value={p.accessInstructions} multiline />
              <AccessRow icon="call" label="Contacto" value={p.contactPhone} />
            </div>
          </div>

          {/* Section 3 — Notificar hóspede */}
          <div>
            <h3 className="text-sm font-bold text-[#1a1a2e] mb-3">3. Notificar hóspede</h3>
            <div className="flex gap-3">
              {/* WhatsApp */}
              {phone ? (
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">smartphone</span>
                  WhatsApp
                </a>
              ) : (
                <div className="flex-1 relative group">
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg text-sm font-semibold cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">smartphone</span>
                    WhatsApp
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Número de telefone não disponível
                  </div>
                </div>
              )}

              {/* Email */}
              <button
                onClick={handleSendEmail}
                disabled={emailStatus === 'loading' || emailStatus === 'success'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                {emailStatus === 'loading' ? 'A enviar...' : 'Email'}
              </button>
            </div>

            {/* Email feedback */}
            {emailStatus === 'success' && (
              <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Email enviado para {booking.guestEmail}
              </p>
            )}
            {emailStatus === 'error' && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-base">error</span>
                Erro ao enviar email. Tente novamente.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCheckIn}
            disabled={!confirmed || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-[#8b1a1a] text-white text-sm font-bold rounded-lg hover:bg-[#6b1414] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'A confirmar...' : 'Confirmar Check-in'}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AccessRow sub-component ──────────────────────────────────────────────────

function AccessRow({
  icon,
  label,
  value,
  multiline = false,
}: {
  icon:      string
  label:     string
  value:     string | null | undefined
  multiline?: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
      <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        {value ? (
          <p className={`text-sm text-[#1a1a2e] mt-0.5 font-medium ${multiline ? 'whitespace-pre-wrap' : ''}`}>
            {value}
          </p>
        ) : (
          <p className="text-sm text-slate-400 mt-0.5 italic">Não configurado</p>
        )}
      </div>
    </div>
  )
}
