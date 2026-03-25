'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Settings } from 'lucide-react'
import PushSubscribeButton from './PushSubscribeButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prefs {
  newBookings:    boolean
  payments:       boolean
  cancellations:  boolean
  checkInReminders: boolean
  newReviews:     boolean
  systemAlerts:   boolean
}

const DEFAULT_PREFS: Prefs = {
  newBookings:      true,
  payments:         true,
  cancellations:    true,
  checkInReminders: true,
  newReviews:       true,
  systemAlerts:     true,
}

const PREF_KEY = 'rg-notification-prefs'

// ─── Toggle row ───────────────────────────────────────────────────────────────

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer select-none">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-[#1a1a2e]' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function NotificationPreferences({ onClose }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREF_KEY)
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...(JSON.parse(saved) as Partial<Prefs>) })
    } catch {/* ignore */}
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function update(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    localStorage.setItem(PREF_KEY, JSON.stringify(next))
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#8b1a1a]" />
            <h2 className="text-base font-bold text-[#1a1a2e]">
              Preferências de notificações
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggles */}
        <div className="divide-y divide-slate-100">
          <Toggle label="Novas reservas"         checked={prefs.newBookings}      onChange={(v) => update('newBookings', v)} />
          <Toggle label="Pagamentos recebidos"   checked={prefs.payments}         onChange={(v) => update('payments', v)} />
          <Toggle label="Cancelamentos"          checked={prefs.cancellations}    onChange={(v) => update('cancellations', v)} />
          <Toggle label="Lembretes de check-in"  checked={prefs.checkInReminders} onChange={(v) => update('checkInReminders', v)} />
          <Toggle label="Novas avaliações"       checked={prefs.newReviews}       onChange={(v) => update('newReviews', v)} />
          <Toggle label="Notificações do sistema" checked={prefs.systemAlerts}    onChange={(v) => update('systemAlerts', v)} />
        </div>

        {/* Push notifications */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Notificações no navegador
          </p>
          <PushSubscribeButton />
        </div>
      </div>
    </div>
  )
}
