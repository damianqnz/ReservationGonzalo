'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Filter, X } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '',           label: 'Todos'      },
  { value: 'CONFIRMED',  label: 'Confirmado' },
  { value: 'PENDING',    label: 'Pendente'   },
  { value: 'COMPLETED',  label: 'Concluído'  },
  { value: 'CANCELLED',  label: 'Cancelado'  },
]

const DATE_OPTIONS = [
  { value: '',       label: 'Todos'       },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mês'    },
]

interface SearchFiltersProps {
  currentStatus:     string
  currentSearch:     string
  currentPropertyId: string
  currentDateRange:  string
  properties:        { id: string; title: string }[]
}

export default function SearchFilters({
  currentStatus,
  currentSearch,
  currentPropertyId,
  currentDateRange,
  properties,
}: SearchFiltersProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Panel state
  const [open,    setOpen]    = useState(false)
  // Draft values (edited inside panel, applied on "Aplicar")
  const [dStatus,   setDStatus]   = useState(currentStatus)
  const [dProperty, setDProperty] = useState(currentPropertyId)
  const [dDate,     setDDate]     = useState(currentDateRange)

  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef   = useRef<HTMLButtonElement>(null)

  // Sync drafts when props change (e.g. after navigation)
  useEffect(() => { setDStatus(currentStatus) },     [currentStatus])
  useEffect(() => { setDProperty(currentPropertyId) }, [currentPropertyId])
  useEffect(() => { setDDate(currentDateRange) },    [currentDateRange])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current   && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const push = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) sp.set(k, v)
        else   sp.delete(k)
      }
      sp.delete('page')
      router.push(`?${sp.toString()}`)
    },
    [router, searchParams],
  )

  function apply() {
    push({ status: dStatus, propertyId: dProperty, dateRange: dDate })
    setOpen(false)
  }

  function clear() {
    setDStatus('')
    setDProperty('')
    setDDate('')
    push({ status: '', search: '', propertyId: '', dateRange: '' })
    setOpen(false)
  }

  const activeCount = [currentStatus, currentPropertyId, currentDateRange].filter(Boolean).length

  return (
    <div className="p-6 border-b border-slate-200 flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Nome ou código..."
          defaultValue={currentSearch}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') push({ search: (e.target as HTMLInputElement).value })
          }}
        />
      </div>

      {/* Filter button + panel */}
      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setOpen((v) => !v)}
          className={`relative flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            open || activeCount > 0
              ? 'border-[#8b1a1a] text-[#8b1a1a] bg-red-50'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={15} />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-[#8b1a1a] text-white text-[10px] font-bold rounded-full">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-slate-200 rounded-xl shadow-lg z-40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-[#1a1a2e]">Filtros</span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Estado */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Estado
                </label>
                <select
                  value={dStatus}
                  onChange={(e) => setDStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Propriedade */}
              {properties.length > 1 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Propriedade
                  </label>
                  <select
                    value={dProperty}
                    onChange={(e) => setDProperty(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
                  >
                    <option value="">Todas</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Período */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Período
                </label>
                <select
                  value={dDate}
                  onChange={(e) => setDDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
                >
                  {DATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 gap-2">
              <button
                onClick={clear}
                className="flex-1 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={apply}
                className="flex-1 py-2 text-sm font-semibold text-white bg-[#1a1a2e] rounded-lg hover:opacity-90 transition-opacity"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
