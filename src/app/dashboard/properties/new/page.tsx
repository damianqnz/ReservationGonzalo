'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title: string
  slug: string
  description: string
  type: string
  status: string
  address: string
  city: string
  country: string
  zipCode: string
  maxGuests: string
  bedrooms: string
  bathrooms: string
  beds: string
  area: string
  pricePerNight: string
  cleaningFee: string
  securityDeposit: string
  checkInTime: string
  checkOutTime: string
  minNights: string
  maxNights: string
  cancellationPolicy: string
  hasRooms: boolean
}

const INITIAL: FormState = {
  title: '',
  slug: '',
  description: '',
  type: 'APARTMENT',
  status: 'DRAFT',
  address: '',
  city: '',
  country: 'PT',
  zipCode: '',
  maxGuests: '2',
  bedrooms: '1',
  bathrooms: '1',
  beds: '1',
  area: '',
  pricePerNight: '',
  cleaningFee: '0',
  securityDeposit: '0',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  minNights: '1',
  maxNights: '365',
  cancellationPolicy: 'FLEXIBLE',
  hasRooms: false,
}

// ─── Field components ─────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-[#8b1a1a] ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

const INPUT =
  'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition'
const SELECT = INPUT + ' cursor-pointer'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [slugManual, setSlugManual] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-generate slug from title unless user edited it manually
      if (field === 'title' && !slugManual) {
        next.slug = toSlug(value as string)
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) e.title = 'Título é obrigatório'
    if (!form.slug.trim()) e.slug = 'Slug é obrigatório'
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug: apenas letras minúsculas, números e hífens'
    if (!form.description.trim() || form.description.length < 10)
      e.description = 'Descrição deve ter pelo menos 10 caracteres'
    if (!form.address.trim()) e.address = 'Morada é obrigatória'
    if (!form.city.trim()) e.city = 'Cidade é obrigatória'
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0)
      e.pricePerNight = 'Preço por noite é obrigatório'
    if (!form.maxGuests || Number(form.maxGuests) < 1)
      e.maxGuests = 'Mínimo 1 hóspede'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        type: form.type,
        status: form.status,
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country || 'PT',
        zipCode: form.zipCode.trim() || undefined,
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        beds: Number(form.beds),
        area: form.area ? Number(form.area) : undefined,
        pricePerNight: Number(form.pricePerNight),
        cleaningFee: Number(form.cleaningFee) || 0,
        securityDeposit: Number(form.securityDeposit) || 0,
        checkInTime: form.checkInTime || '15:00',
        checkOutTime: form.checkOutTime || '11:00',
        minNights: Number(form.minNights) || 1,
        maxNights: Number(form.maxNights) || 365,
        cancellationPolicy: form.cancellationPolicy,
        hasRooms: form.hasRooms,
      }

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : 'Erro ao criar a propriedade. Verifique os dados.'
        setApiError(msg)
        return
      }

      // Redirect to images page so owner can immediately upload photos
      router.push(`/dashboard/properties/${data.data.id}/images`)
    } catch {
      setApiError('Erro de ligação. Por favor tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/properties"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">
            Nova Propriedade
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Preencha os dados da nova propriedade. Pode adicionar imagens no passo seguinte.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Informação básica ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Informação básica
          </h3>

          <Field label="Título" required error={errors.title}>
            <input
              className={INPUT}
              placeholder="Apartamento moderno em Lisboa — Chiado"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>

          <Field label="Slug (URL)" required error={errors.slug}>
            <input
              className={INPUT}
              placeholder="apartamento-moderno-lisboa-chiado"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                set('slug', e.target.value)
              }}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Gerado automaticamente a partir do título. Apenas letras minúsculas, números e hífens.
            </p>
          </Field>

          <Field label="Descrição" required error={errors.description}>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
              rows={4}
              placeholder="Descreva a propriedade em detalhe…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo">
              <select className={SELECT} value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="APARTMENT">Apartamento</option>
                <option value="HOUSE">Casa</option>
                <option value="VILLA">Vila</option>
                <option value="STUDIO">Estúdio</option>
                <option value="ROOM">Quarto</option>
              </select>
            </Field>

            <Field label="Estado">
              <select className={SELECT} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativo</option>
              </select>
            </Field>
          </div>
        </section>

        {/* ── Localização ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Localização
          </h3>

          <Field label="Morada" required error={errors.address}>
            <input
              className={INPUT}
              placeholder="Rua do Carmo 45, 3º Dto"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cidade" required error={errors.city}>
              <input
                className={INPUT}
                placeholder="Lisboa"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </Field>

            <Field label="Código postal">
              <input
                className={INPUT}
                placeholder="1200-094"
                value={form.zipCode}
                onChange={(e) => set('zipCode', e.target.value)}
              />
            </Field>
          </div>

          <Field label="País">
            <input
              className={INPUT}
              placeholder="PT"
              maxLength={2}
              value={form.country}
              onChange={(e) => set('country', e.target.value.toUpperCase())}
            />
          </Field>
        </section>

        {/* ── Detalhes ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Detalhes
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Hóspedes máx." required error={errors.maxGuests}>
              <input
                className={INPUT}
                type="number"
                min={1}
                max={50}
                value={form.maxGuests}
                onChange={(e) => set('maxGuests', e.target.value)}
              />
            </Field>

            <Field label="Quartos">
              <input
                className={INPUT}
                type="number"
                min={0}
                max={50}
                value={form.bedrooms}
                onChange={(e) => set('bedrooms', e.target.value)}
              />
            </Field>

            <Field label="Casas de banho">
              <input
                className={INPUT}
                type="number"
                min={0}
                max={50}
                value={form.bathrooms}
                onChange={(e) => set('bathrooms', e.target.value)}
              />
            </Field>

            <Field label="Camas">
              <input
                className={INPUT}
                type="number"
                min={1}
                max={50}
                value={form.beds}
                onChange={(e) => set('beds', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Área (m²)">
            <input
              className={INPUT}
              type="number"
              min={1}
              placeholder="75"
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
            />
          </Field>
        </section>

        {/* ── Preços ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Preços
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Preço por noite (€)" required error={errors.pricePerNight}>
              <input
                className={INPUT}
                type="number"
                min={0}
                step="0.01"
                placeholder="120"
                value={form.pricePerNight}
                onChange={(e) => set('pricePerNight', e.target.value)}
              />
            </Field>

            <Field label="Taxa de limpeza (€)">
              <input
                className={INPUT}
                type="number"
                min={0}
                step="0.01"
                value={form.cleaningFee}
                onChange={(e) => set('cleaningFee', e.target.value)}
              />
            </Field>

            <Field label="Depósito segurança (€)">
              <input
                className={INPUT}
                type="number"
                min={0}
                step="0.01"
                value={form.securityDeposit}
                onChange={(e) => set('securityDeposit', e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* ── Políticas ── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Políticas
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Check-in">
              <input
                className={INPUT}
                type="time"
                value={form.checkInTime}
                onChange={(e) => set('checkInTime', e.target.value)}
              />
            </Field>

            <Field label="Check-out">
              <input
                className={INPUT}
                type="time"
                value={form.checkOutTime}
                onChange={(e) => set('checkOutTime', e.target.value)}
              />
            </Field>

            <Field label="Noites mínimas">
              <input
                className={INPUT}
                type="number"
                min={1}
                value={form.minNights}
                onChange={(e) => set('minNights', e.target.value)}
              />
            </Field>

            <Field label="Noites máximas">
              <input
                className={INPUT}
                type="number"
                min={1}
                value={form.maxNights}
                onChange={(e) => set('maxNights', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Política de cancelamento">
            <select
              className={SELECT}
              value={form.cancellationPolicy}
              onChange={(e) => set('cancellationPolicy', e.target.value)}
            >
              <option value="FLEXIBLE">Flexível — cancelamento gratuito até 24h antes</option>
              <option value="MODERATE">Moderada — reembolso parcial até 5 dias antes</option>
              <option value="STRICT">Estrita — não reembolsável</option>
            </select>
          </Field>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-200 text-[#8b1a1a] focus:ring-[#8b1a1a]/30"
              checked={form.hasRooms}
              onChange={(e) => set('hasRooms', e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              Esta propriedade tem quartos individuais (permite reservar quartos separados)
            </span>
          </label>
        </section>

        {/* ── API error ── */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pb-8">
          <Link
            href="/dashboard/properties"
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                A criar…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">add</span>
                Criar Propriedade
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
