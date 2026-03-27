'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import BedPicker from '@/components/dashboard/BedPicker'
import ServicesChecklist from '@/components/dashboard/ServicesChecklist'

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
  { value: 'ACTIVE',      label: 'Ativo'           },
  { value: 'INACTIVE',    label: 'Inativo'         },
  { value: 'MAINTENANCE', label: 'Em manutenção'   },
]

const BATHROOM_TYPES = [
  { value: 'private', label: 'Casa de banho privada'    },
  { value: 'shared',  label: 'Casa de banho partilhada' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewRoomPage() {
  const router     = useRouter()
  const params     = useParams<{ id: string }>()
  const propertyId = params.id

  const [form, setForm] = useState<FormState>({
    name:          '',
    description:   '',
    type:          'DOUBLE',
    status:        'ACTIVE',
    maxGuests:     2,
    bedrooms:      1,
    bathrooms:     1,
    bathroomType:  'private',
    pricePerNight: 0,
    order:         0,
  })
  const [bedsList,  setBedsList]  = useState<string[]>([])
  const [services,  setServices]  = useState<string[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pricePerNight: Number(form.pricePerNight),
          maxGuests:     Number(form.maxGuests),
          bedrooms:      Number(form.bedrooms),
          bathrooms:     Number(form.bathrooms),
          order:         Number(form.order),
          // beds derived from bedsList; fallback to 1
          beds:          Math.max(1, bedsList.length),
          bedsList:      bedsList.length > 0 ? JSON.stringify(bedsList) : undefined,
          services:      services.length  > 0 ? JSON.stringify(services) : undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
        return
      }

      router.push(`/dashboard/properties/${propertyId}/rooms/${json.data.id}/images`)
    } catch {
      setError('Erro de ligação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/properties/${propertyId}/rooms`}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Novo Quarto</h2>
          <p className="text-slate-500 text-sm mt-0.5">Preencha os detalhes do quarto.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Informações gerais ──────────────────────────────────────── */}
        <Section title="Informações gerais" icon="info">

          {/* Name */}
          <div>
            <Label required>Nome do quarto</Label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="ex: Quarto Duplo Vista Mar"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Descrição</Label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descrição opcional do quarto..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Type + Status */}
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

          {/* Guests + Price */}
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

          {/* Bedrooms + Order */}
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

        {/* ── WC ──────────────────────────────────────────────────────── */}
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

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#8b1a1a] text-white px-8 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'A criar...' : 'Criar quarto'}
          </button>
          <Link
            href={`/dashboard/properties/${propertyId}/rooms`}
            className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
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
