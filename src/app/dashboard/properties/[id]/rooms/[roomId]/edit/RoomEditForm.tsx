'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BedPicker from '../../new/BedPicker'
import ServicesChecklist from '../../new/ServicesChecklist'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { value: 'SINGLE',       label: 'Individual'          },
  { value: 'DOUBLE',       label: 'Duplo'               },
  { value: 'TWIN',         label: 'Twin'                },
  { value: 'SUITE',        label: 'Suite'               },
  { value: 'JUNIOR_SUITE', label: 'Suite Junior'        },
  { value: 'FAMILY',       label: 'Familiar'            },
  { value: 'STUDIO',       label: 'Estúdio'             },
  { value: 'ENTIRE_PLACE', label: 'Alojamento completo' },
]

const ROOM_STATUSES = [
  { value: 'ACTIVE',      label: 'Ativo'         },
  { value: 'INACTIVE',    label: 'Inativo'       },
  { value: 'MAINTENANCE', label: 'Em manutenção' },
]

const BATHROOM_TYPES = [
  { value: 'private', label: 'Casa de banho privada'    },
  { value: 'shared',  label: 'Casa de banho partilhada' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomData {
  id:           string
  name:         string
  description:  string | null
  type:         string
  status:       string
  maxGuests:    number
  bedrooms:     number
  bathrooms:    number
  bathroomType: string | null
  beds:         number
  bedsList:     string | null
  services:     string | null
  pricePerNight: number
  order:        number
}

interface Props {
  propertyId: string
  room:       RoomData
}

interface FormState {
  name:          string
  description:   string
  type:          string
  status:        string
  maxGuests:     number
  bedrooms:      number
  bathrooms:     number
  bathroomType:  string
  pricePerNight: number
  order:         number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomEditForm({ propertyId, room }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    name:          room.name,
    description:   room.description   ?? '',
    type:          room.type,
    status:        room.status,
    maxGuests:     room.maxGuests,
    bedrooms:      room.bedrooms,
    bathrooms:     room.bathrooms,
    bathroomType:  room.bathroomType  ?? 'private',
    pricePerNight: room.pricePerNight,
    order:         room.order,
  })

  const [bedsList, setBedsList] = useState<string[]>(() => {
    try { return room.bedsList ? (JSON.parse(room.bedsList) as string[]) : [] } catch { return [] }
  })
  const [services, setServices] = useState<string[]>(() => {
    try { return room.services ? (JSON.parse(room.services) as string[]) : [] } catch { return [] }
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [toast,   setToast]   = useState<'success' | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pricePerNight: Number(form.pricePerNight),
          maxGuests:     Number(form.maxGuests),
          bedrooms:      Number(form.bedrooms),
          bathrooms:     Number(form.bathrooms),
          order:         Number(form.order),
          beds:          Math.max(1, bedsList.length),
          bedsList:      bedsList.length > 0 ? JSON.stringify(bedsList) : null,
          services:      services.length  > 0 ? JSON.stringify(services) : null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
        return
      }

      setToast('success')
      setTimeout(() => setToast(null), 3000)
      router.refresh()
    } catch {
      setError('Erro de ligação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Toast */}
      {toast === 'success' && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold bg-emerald-600 text-white">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Guardado com sucesso!
        </div>
      )}

      {/* ── Informações gerais ──────────────────────────────────────── */}
      <Section title="Informações gerais" icon="info">

        <div>
          <Label required>Nome do quarto</Label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Tipo</Label>
            <select
              required
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Estado</Label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {ROOM_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Hóspedes máx.</Label>
            <input
              type="number"
              required
              min={1}
              max={20}
              value={form.maxGuests}
              onChange={(e) => set('maxGuests', Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <Label required>Preço por noite (€)</Label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.pricePerNight}
              onChange={(e) => set('pricePerNight', Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Quartos</Label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.bedrooms}
              onChange={(e) => set('bedrooms', Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <Label>Ordem de exibição</Label>
            <input
              type="number"
              min={0}
              value={form.order}
              onChange={(e) => set('order', Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* ── Casa de banho ───────────────────────────────────────────── */}
      <Section title="Casa de banho" icon="bathtub">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Tipo</Label>
            <select
              required
              value={form.bathroomType}
              onChange={(e) => set('bathroomType', e.target.value)}
              className={`${inputCls} bg-white`}
            >
              {BATHROOM_TYPES.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Nº de casas de banho</Label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.bathrooms}
              onChange={(e) => set('bathrooms', Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* ── Camas ───────────────────────────────────────────────────── */}
      <Section title="Camas" icon="bed">
        <BedPicker value={bedsList} onChange={setBedsList} />
      </Section>

      {/* ── Serviços incluídos ──────────────────────────────────────── */}
      <Section title="Serviços incluídos" icon="check_circle">
        <ServicesChecklist value={services} onChange={setServices} />
      </Section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-3 pb-8">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#8b1a1a] text-white px-8 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'A guardar...' : 'Guardar alterações'}
        </button>
        <Link
          href={`/dashboard/properties/${propertyId}/rooms`}
          className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Section({
  title, icon, children,
}: {
  title: string; icon: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2 text-sm uppercase tracking-wider">
        <span className="material-symbols-outlined text-[#8b1a1a] text-lg">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}
