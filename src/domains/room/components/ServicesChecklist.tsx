'use client'

import { useState } from 'react'

// ─── Services data ────────────────────────────────────────────────────────────

export const SERVICE_CATEGORIES = [
  {
    id: 'general',
    label: 'Condições gerais',
    services: [
      'Água quente', 'Estacionamento na rua', 'Estacionamento privado',
      'Elevador', 'Varanda', 'Caldeira', 'Aquecimento', 'Champô',
      'Chave', 'Climatização', 'Contentor', 'Quadro elétrico',
      'Elementos essenciais', 'Router de Internet', 'Vassoura',
      'Espaço de trabalho para portáteis', 'Esfregona', 'Máquina de lavar',
      'Máquina de lavar loiça', 'Limpeza profissional', 'Limpeza e desinfeção',
      'Check-in e check-out sem contacto', 'Mobiliário exterior',
      'Caixote do lixo', 'Ferro e tábua de engomar', 'Proibido fumar',
      'Secador de cabelo', 'Tábua de engomar', 'Estendal de roupa',
      'Tomada de corrente', 'Velocidade WiFi', 'Janela', 'WiFi',
      'Zona de contentores de lixo',
    ],
  },
  {
    id: 'kitchen',
    label: 'Cozinha',
    services: [
      'Cafeteira', 'Exaustor', 'Cozinha totalmente equipada',
      'Básicos de cozinha (Panelas, azeite, sal e pimenta)', 'Congelador',
      'Copos de vinho', 'Talheres', 'Chaleira', 'Mesa de jantar',
      'Micro-ondas', 'Frigorífico', 'Placa de cozinha', 'Torradeira',
      'Utensílios de cozinha',
    ],
  },
  {
    id: 'bedroom',
    label: 'Quarto',
    services: ['Cabides'],
  },
  {
    id: 'children',
    label: 'Crianças',
    services: ['Adequado para crianças (a partir de 2 anos)'],
  },
  {
    id: 'sport',
    label: 'Desporto',
    services: ['Ciclismo', 'Ciclismo de montanha', 'Caminhadas', 'Surf', 'Windsurf'],
  },
  {
    id: 'leisure',
    label: 'Lazer',
    services: ['Compras', 'Museus', 'TV'],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value:    string[]
  onChange: (v: string[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicesChecklist({ value, onChange }: Props) {
  const [search,   setSearch]   = useState('')
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})

  const query = search.toLowerCase().trim()

  function toggleService(svc: string) {
    if (value.includes(svc)) {
      onChange(value.filter((s) => s !== svc))
    } else {
      onChange([...value, svc])
    }
  }

  function toggleCategory(id: string) {
    setOpenCats((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Pesquisar serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
        />
      </div>

      {/* Accordion */}
      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
        {SERVICE_CATEGORIES.map((cat) => {
          const filtered = query
            ? cat.services.filter((s) => s.toLowerCase().includes(query))
            : cat.services

          if (filtered.length === 0) return null

          const selectedInCat = filtered.filter((s) => value.includes(s)).length
          const isOpen = query ? true : (openCats[cat.id] ?? false)

          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-[#1a1a2e]">{cat.label}</span>
                <div className="flex items-center gap-2">
                  {selectedInCat > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#8b1a1a] text-white rounded-full">
                      {selectedInCat}/{filtered.length}
                    </span>
                  )}
                  {!query && (
                    <span
                      className="material-symbols-outlined text-slate-400 text-base transition-transform duration-200"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  )}
                </div>
              </button>

              {/* Services list */}
              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 px-4 py-3 bg-white">
                  {filtered.map((svc) => (
                    <label
                      key={svc}
                      className="flex items-center gap-2.5 py-1.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(svc)}
                        onChange={() => toggleService(svc)}
                        className="w-4 h-4 rounded border-slate-300 text-[#8b1a1a] focus:ring-[#8b1a1a]/30 cursor-pointer"
                      />
                      <span className="text-sm text-slate-600 group-hover:text-[#1a1a2e] transition-colors leading-tight">
                        {svc}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected summary */}
      {value.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-slate-500 mb-1">
            Serviços selecionados ({value.length}):
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {value.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
