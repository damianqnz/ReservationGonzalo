'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyInfo {
  id:    string
  title: string
  slug:  string
}

interface Props {
  property: PropertyInfo
  isOpen:   boolean
  onClose:  () => void
}

// ─── Actions config ───────────────────────────────────────────────────────────

function getActions(id: string) {
  return [
    {
      icon:        'calendar_month',
      title:       'Ver Reservas',
      description: 'Ver todas as reservas desta propriedade',
      href:        `/dashboard/reservations?propertyId=${id}`,
    },
    {
      icon:        'photo_library',
      title:       'Imagens',
      description: 'Gerir fotos da propriedade',
      href:        `/dashboard/properties/${id}/images`,
    },
    {
      icon:        'bed',
      title:       'Quartos',
      description: 'Gerir quartos e tipos',
      href:        `/dashboard/properties/${id}/rooms`,
    },
    {
      icon:        'sell',
      title:       'Preços',
      description: 'Preços e temporadas',
      href:        `/dashboard/properties/${id}/pricing`,
    },
    {
      icon:        'event_sync',
      title:       'iCal',
      description: 'Sincronizar com Airbnb/Booking',
      href:        `/dashboard/properties/${id}/ical`,
    },
    {
      icon:        'key',
      title:       'Acesso',
      description: 'Dados de acesso e WiFi',
      href:        `/dashboard/properties/${id}/edit#access`,
    },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyManageModal({ property, isOpen, onClose }: Props) {
  const router  = useRouter()
  const actions = getActions(property.id)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gerir</p>
            <h2 className="text-lg font-extrabold text-[#1a1a2e] tracking-tight truncate max-w-[360px]">
              {property.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Grid */}
        <div className="p-5 grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-100 hover:bg-[#f5f5f5] hover:border-slate-200 transition-colors text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-3xl text-[#1a1a2e]">
                {action.icon}
              </span>
              <span className="text-sm font-bold text-[#1a1a2e]">{action.title}</span>
              <span className="text-[11px] text-slate-400 leading-snug">{action.description}</span>
            </button>
          ))}
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
