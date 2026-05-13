'use client'

import { useState } from 'react'

export const BED_TYPES = [
  'Individual',
  'Duplo Deluxe',
  'Sofá-cama',
  'Duplo + Sofá-cama',
  'Individual + Sofá-cama',
]

interface Props {
  value:    string[]
  onChange: (v: string[]) => void
}

export default function BedPicker({ value, onChange }: Props) {
  const [selected, setSelected] = useState(BED_TYPES[0])

  function add() {
    onChange([...value, selected])
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Add row */}
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] bg-white"
        >
          {BED_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Adicionar cama
        </button>
      </div>

      {/* Bed list */}
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((bed, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
            >
              <span className="text-sm text-[#1a1a2e] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-slate-400">bed</span>
                1× {bed}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                title="Remover"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-slate-400 italic">Nenhuma cama adicionada.</p>
      )}
    </div>
  )
}
