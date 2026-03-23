'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUS_OPTIONS = [
  { value: '',           label: 'Estado: Todos'   },
  { value: 'CONFIRMED',  label: 'Confirmado'       },
  { value: 'PENDING',    label: 'Pendente'          },
  { value: 'COMPLETED',  label: 'Concluído'         },
  { value: 'CANCELLED',  label: 'Cancelado'         },
]

const DATE_OPTIONS = [
  { value: '',       label: 'Período: Todos'   },
  { value: 'week',   label: 'Esta semana'       },
  { value: 'month',  label: 'Este mês'          },
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

  return (
    <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Nome ou código..."
            defaultValue={currentSearch}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none w-52"
            onKeyDown={(e) => {
              if (e.key === 'Enter') push({ search: (e.target as HTMLInputElement).value })
            }}
          />
        </div>

        {/* Status */}
        <select
          value={currentStatus}
          onChange={(e) => push({ status: e.target.value })}
          className="text-sm border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-2 outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Property — only show if > 1 property */}
        {properties.length > 1 && (
          <select
            value={currentPropertyId}
            onChange={(e) => push({ propertyId: e.target.value })}
            className="text-sm border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-2 outline-none"
          >
            <option value="">Propriedade: Todas</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        )}

        {/* Date range */}
        <select
          value={currentDateRange}
          onChange={(e) => push({ dateRange: e.target.value })}
          className="text-sm border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-2 outline-none"
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Clear */}
      <button
        onClick={() => push({ status: '', search: '', propertyId: '', dateRange: '' })}
        className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 text-sm"
        title="Limpar filtros"
      >
        <span className="material-symbols-outlined">filter_list_off</span>
      </button>
    </div>
  )
}
