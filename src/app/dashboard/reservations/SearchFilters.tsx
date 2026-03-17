'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: 'Status: Todos' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'COMPLETED', label: 'Concluído' },
]

interface SearchFiltersProps {
  currentStatus: string
  currentSearch: string
}

export default function SearchFilters({ currentStatus, currentSearch }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const push = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v) sp.set(k, v)
        else sp.delete(k)
      }
      sp.delete('page')
      router.push(`?${sp.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="p-8 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Pesquisar reservas..."
            defaultValue={currentSearch}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                push({ search: (e.target as HTMLInputElement).value })
              }
            }}
          />
        </div>
        <select
          value={currentStatus}
          onChange={(e) => push({ status: e.target.value })}
          className="text-sm border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-2 ring-0"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => push({ status: '', search: '' })}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 text-sm"
          title="Limpar filtros"
        >
          <span className="material-symbols-outlined">filter_list_off</span>
        </button>
      </div>
    </div>
  )
}
