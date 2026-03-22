'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const ROOM_TYPES = [
  { value: 'SINGLE',       label: 'Individual' },
  { value: 'DOUBLE',       label: 'Duplo' },
  { value: 'TWIN',         label: 'Twin' },
  { value: 'SUITE',        label: 'Suite' },
  { value: 'JUNIOR_SUITE', label: 'Suite Junior' },
  { value: 'FAMILY',       label: 'Familiar' },
  { value: 'STUDIO',       label: 'Estúdio' },
  { value: 'ENTIRE_PLACE', label: 'Alojamento completo' },
]

const ROOM_STATUSES = [
  { value: 'ACTIVE',      label: 'Ativo' },
  { value: 'INACTIVE',    label: 'Inativo' },
  { value: 'MAINTENANCE', label: 'Em manutenção' },
]

interface FormState {
  name: string
  description: string
  type: string
  status: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  beds: number
  pricePerNight: number
  order: number
}

export default function NewRoomPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const propertyId = params.id

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    type: 'DOUBLE',
    status: 'ACTIVE',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    pricePerNight: 0,
    order: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pricePerNight: Number(form.pricePerNight),
          maxGuests: Number(form.maxGuests),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          beds: Number(form.beds),
          order: Number(form.order),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        const errMsg = typeof json.error === 'string'
          ? json.error
          : JSON.stringify(json.error)
        setError(errMsg)
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Nome do quarto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="ex: Quarto Duplo Vista Mar"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descrição opcional do quarto..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] resize-none"
          />
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] bg-white"
            >
              {ROOM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Estado</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] bg-white"
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Hóspedes máx. <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={20}
              value={form.maxGuests}
              onChange={(e) => set('maxGuests', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Preço por noite (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.pricePerNight}
              onChange={(e) => set('pricePerNight', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
        </div>

        {/* Bedrooms + Bathrooms + Beds */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quartos</label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.bedrooms}
              onChange={(e) => set('bedrooms', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">WC</label>
            <input
              type="number"
              min={0}
              max={20}
              value={form.bathrooms}
              onChange={(e) => set('bathrooms', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Camas</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.beds}
              onChange={(e) => set('beds', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
        </div>

        {/* Order */}
        <div className="w-1/3">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ordem de exibição</label>
          <input
            type="number"
            min={0}
            value={form.order}
            onChange={(e) => set('order', Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
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
