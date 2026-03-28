'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sileo } from 'sileo'
import BedPicker from '@/components/dashboard/BedPicker'
import ServicesChecklist from '@/components/dashboard/ServicesChecklist'

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1State {
  title: string
  slug: string
  description: string
  type: string
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
  bathroomType: string
}

const STEP1_INITIAL: Step1State = {
  title: '',
  slug: '',
  description: '',
  type: 'APARTMENT',
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
  bathroomType: 'private',
}

interface RoomDraft {
  localId: string
  id?: string
  name: string
  type: string
  pricePerNight: string
  maxGuests: string
  bathroomType: string
  bedsList: string[]
  services: string[]
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

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

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Informação', 'Quartos', 'Revisão']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : active
                    ? 'bg-[#8b1a1a] border-[#8b1a1a] text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {done ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  num
                )}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1 ${
                  active ? 'text-[#8b1a1a]' : done ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-14px] rounded transition-colors ${
                  done ? 'bg-green-400' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Property info ───────────────────────────────────────────────────

function Step1({
  form,
  setForm,
  slugManual,
  setSlugManual,
  spaceConfig,
  setSpaceConfig,
  onSaveDirect,
  onContinue,
  isSubmitting,
  apiError,
}: {
  form: Step1State
  setForm: React.Dispatch<React.SetStateAction<Step1State>>
  slugManual: boolean
  setSlugManual: (v: boolean) => void
  spaceConfig: { bedsList: string[]; services: string[] }
  setSpaceConfig: React.Dispatch<React.SetStateAction<{ bedsList: string[]; services: string[] }>>
  onSaveDirect: () => void
  onContinue: () => void
  isSubmitting: boolean
  apiError: string | null
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof Step1State, string>>>({})

  function set(field: keyof Step1State, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !slugManual) {
        next.slug = toSlug(value as string)
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof Step1State, string>> = {}
    if (!form.title.trim()) e.title = 'Título é obrigatório'
    if (!form.slug.trim()) e.slug = 'Slug é obrigatório'
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug: apenas letras minúsculas, números e hífens'
    if (!form.description.trim() || form.description.length < 10)
      e.description = 'Descrição deve ter pelo menos 10 caracteres'
    if (!form.address.trim()) e.address = 'Morada é obrigatória'
    if (!form.city.trim()) e.city = 'Cidade é obrigatória'
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0)
      e.pricePerNight = 'Preço por noite é obrigatório'
    if (!form.maxGuests || Number(form.maxGuests) < 1) e.maxGuests = 'Mínimo 1 hóspede'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (form.hasRooms) {
      onContinue()
    } else {
      onSaveDirect()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Informação básica ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Informação básica</h3>

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
        </div>
      </section>

      {/* ── Localização ── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Localização</h3>

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
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Detalhes</h3>

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
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Preços</h3>
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
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Políticas</h3>
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

        {/* hasRooms toggle */}
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

      {/* ── Space config (only when hasRooms=false) ── */}
      {!form.hasRooms && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Configuração do espaço
          </h3>

          <Field label="Tipo de casa de banho">
            <select
              className={SELECT}
              value={form.bathroomType}
              onChange={(e) => set('bathroomType', e.target.value)}
            >
              <option value="private">Privada</option>
              <option value="shared">Partilhada</option>
              <option value="ensuite">En-suite</option>
            </select>
          </Field>

          <Field label="Camas">
            <BedPicker
              value={spaceConfig.bedsList}
              onChange={(v) => setSpaceConfig((p) => ({ ...p, bedsList: v }))}
            />
          </Field>

          <Field label="Serviços e comodidades">
            <ServicesChecklist
              value={spaceConfig.services}
              onChange={(v) => setSpaceConfig((p) => ({ ...p, services: v }))}
            />
          </Field>
        </section>
      )}

      {form.hasRooms && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          No passo seguinte poderá adicionar os quartos com as suas configurações individuais.
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

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
              A guardar…
            </>
          ) : form.hasRooms ? (
            <>
              Continuar
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
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
  )
}

// ─── InlineRoomForm ───────────────────────────────────────────────────────────

function InlineRoomForm({
  propertyId,
  onSaved,
  onCancel,
  onRequestNew,
}: {
  propertyId: string
  onSaved: (room: RoomDraft) => void
  onCancel: () => void
  onRequestNew: () => void
}) {
  const [name,         setName]         = useState('')
  const [type,         setType]         = useState('DOUBLE')
  const [price,        setPrice]        = useState('')
  const [maxGuests,    setMaxGuests]    = useState('2')
  const [bedrooms,     setBedrooms]     = useState('1')
  const [bathrooms,    setBathrooms]    = useState('1')
  const [bathroomType, setBathroomType] = useState('private')
  const [bedsList,     setBedsList]     = useState<string[]>([])
  const [services,     setServices]     = useState<string[]>([])
  const [saving,       setSaving]       = useState(false)

  function reset() {
    setName(''); setType('DOUBLE'); setPrice(''); setMaxGuests('2')
    setBedrooms('1'); setBathrooms('1'); setBathroomType('private')
    setBedsList([]); setServices([])
  }

  async function handleSave() {
    if (!name.trim()) {
      sileo.error({ title: 'Campo obrigatório', description: 'O nome do quarto é obrigatório' })
      return
    }
    if (!price || Number(price) <= 0) {
      sileo.error({ title: 'Campo obrigatório', description: 'O preço por noite é obrigatório' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          pricePerNight: Number(price),
          maxGuests:     Number(maxGuests),
          bedrooms:      Number(bedrooms),
          bathrooms:     Number(bathrooms),
          beds:          bedsList.length || Number(bedrooms) || 1,
          bathroomType,
          bedsList:  JSON.stringify(bedsList),
          services:  JSON.stringify(services),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        sileo.error({
          title: 'Erro ao guardar quarto',
          description: typeof data.error === 'string'
            ? data.error
            : 'Verifique os campos e tente novamente',
        })
        return
      }
      const saved = name.trim()
      onSaved({
        localId: crypto.randomUUID(),
        id: data.data.id,
        name: saved,
        type,
        pricePerNight: price,
        maxGuests,
        bathroomType,
        bedsList,
        services,
      })
      reset()
      sileo.action({
        title: 'Quarto adicionado!',
        description: `${saved} foi adicionado com sucesso`,
        duration: 6000,
        button: {
          title: 'Adicionar outro quarto',
          onClick: onRequestNew,
        },
      })
    } catch {
      sileo.error({ title: 'Erro de ligação', description: 'Por favor tente novamente' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
      <h4 className="text-sm font-bold text-[#1a1a2e]">Novo quarto</h4>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome" required>
          <input
            className={INPUT}
            placeholder="Quarto Duplo Standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Tipo">
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="SINGLE">Individual</option>
            <option value="DOUBLE">Duplo</option>
            <option value="TWIN">Twin</option>
            <option value="SUITE">Suite</option>
            <option value="FAMILY">Familiar</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Preço/noite (€)" required>
          <input
            className={INPUT}
            type="number"
            min={0}
            step="0.01"
            placeholder="80"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Hóspedes máx.">
          <input
            className={INPUT}
            type="number"
            min={1}
            max={10}
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Quartos">
          <input
            className={INPUT}
            type="number"
            min={0}
            max={20}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </Field>
        <Field label="Casas de banho">
          <input
            className={INPUT}
            type="number"
            min={1}
            max={20}
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Casa de banho">
        <select className={SELECT} value={bathroomType} onChange={(e) => setBathroomType(e.target.value)}>
          <option value="private">Privada</option>
          <option value="shared">Partilhada</option>
          <option value="ensuite">En-suite</option>
        </select>
      </Field>

      <Field label="Camas">
        <BedPicker value={bedsList} onChange={setBedsList} />
      </Field>

      <details className="group">
        <summary className="text-sm font-semibold text-[#1a1a2e] cursor-pointer list-none flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-slate-400 group-open:rotate-90 transition-transform">
            chevron_right
          </span>
          Serviços e comodidades
        </summary>
        <div className="mt-3">
          <ServicesChecklist value={services} onChange={setServices} />
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-60"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-base">save</span>
          )}
          Guardar quarto
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 — Rooms ───────────────────────────────────────────────────────────

function Step2({
  propertyId,
  rooms,
  setRooms,
  onBack,
  onContinue,
}: {
  propertyId: string
  rooms: RoomDraft[]
  setRooms: React.Dispatch<React.SetStateAction<RoomDraft[]>>
  onBack: () => void
  onContinue: () => void
}) {
  const [showForm, setShowForm] = useState(rooms.length === 0)

  const ROOM_TYPE_LABELS: Record<string, string> = {
    SINGLE: 'Individual',
    DOUBLE: 'Duplo',
    TWIN: 'Twin',
    SUITE: 'Suite',
    FAMILY: 'Familiar',
  }

  async function removeRoom(room: RoomDraft) {
    if (room.id) {
      await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' })
    }
    setRooms((prev) => prev.filter((r) => r.localId !== room.localId))
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Quartos ({rooms.length})
          </h3>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Adicionar quarto
            </button>
          )}
        </div>

        {/* Room cards */}
        {rooms.length > 0 && (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.localId}
                className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1a1a2e]">{room.name}</p>
                  <p className="text-xs text-slate-500">
                    {ROOM_TYPE_LABELS[room.type] ?? room.type} · {room.maxGuests} hóspedes · €{room.pricePerNight}/noite
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRoom(room)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Remover"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {rooms.length === 0 && !showForm && (
          <p className="text-sm text-slate-400 italic">Nenhum quarto adicionado ainda.</p>
        )}

        {showForm && (
          <InlineRoomForm
            propertyId={propertyId}
            onSaved={(room) => {
              setRooms((prev) => [...prev, room])
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
            onRequestNew={() => setShowForm(true)}
          />
        )}
      </section>

      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Anterior
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={rooms.length === 0}
          className="px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────

function Step3({
  form,
  rooms,
  propertyId,
  onBack,
}: {
  form: Step1State
  rooms: RoomDraft[]
  propertyId: string
  onBack: () => void
}) {
  const router = useRouter()
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ROOM_TYPE_LABELS: Record<string, string> = {
    SINGLE: 'Individual', DOUBLE: 'Duplo', TWIN: 'Twin', SUITE: 'Suite', FAMILY: 'Familiar',
  }

  async function handleActivate() {
    setIsActivating(true)
    setError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Erro ao ativar propriedade')
        return
      }
      router.push(`/dashboard/properties/${propertyId}/images?created=1`)
    } catch {
      setError('Erro de ligação.')
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Property summary */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Propriedade</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-slate-500">Título:</span> <span className="font-semibold">{form.title}</span></div>
          <div><span className="text-slate-500">Tipo:</span> <span className="font-semibold">{form.type}</span></div>
          <div><span className="text-slate-500">Cidade:</span> <span className="font-semibold">{form.city}</span></div>
          <div><span className="text-slate-500">Preço/noite:</span> <span className="font-semibold">€{form.pricePerNight}</span></div>
          <div><span className="text-slate-500">Hóspedes máx.:</span> <span className="font-semibold">{form.maxGuests}</span></div>
          <div><span className="text-slate-500">Cancelamento:</span> <span className="font-semibold">{form.cancellationPolicy}</span></div>
        </div>
      </section>

      {/* Rooms summary */}
      {rooms.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">
            Quartos ({rooms.length})
          </h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.localId}
                className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1a1a2e]">{room.name}</p>
                  <p className="text-xs text-slate-500">
                    {ROOM_TYPE_LABELS[room.type] ?? room.type} · {room.maxGuests} hóspedes · €{room.pricePerNight}/noite
                  </p>
                </div>
                <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Anterior
        </button>
        <button
          type="button"
          onClick={handleActivate}
          disabled={isActivating}
          className="px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {isActivating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              A ativar…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">check</span>
              Criar Propriedade
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<Step1State>(STEP1_INITIAL)
  const [slugManual, setSlugManual] = useState(false)
  const [spaceConfig, setSpaceConfig] = useState<{ bedsList: string[]; services: string[] }>({
    bedsList: [],
    services: [],
  })
  const [rooms, setRooms] = useState<RoomDraft[]>([])
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  function buildPayload(status = 'DRAFT') {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      type: form.type,
      status,
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
      bathroomType: form.hasRooms ? undefined : form.bathroomType,
      bedsConfig: form.hasRooms ? undefined : JSON.stringify(spaceConfig.bedsList),
      services: form.hasRooms ? undefined : JSON.stringify(spaceConfig.services),
    }
  }

  /** hasRooms=false: create as ACTIVE and go to images */
  async function handleSaveDirect() {
    setIsSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('ACTIVE')),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(typeof data.error === 'string' ? data.error : 'Erro ao criar a propriedade.')
        return
      }
      router.push(`/dashboard/properties/${data.data.id}/images?created=1`)
    } catch {
      setApiError('Erro de ligação. Por favor tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /** hasRooms=true: save as DRAFT, go to step 2 */
  async function handleContinueToRooms() {
    setIsSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('DRAFT')),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(typeof data.error === 'string' ? data.error : 'Erro ao criar a propriedade.')
        return
      }
      setPropertyId(data.data.id)
      setStep(2)
    } catch {
      setApiError('Erro de ligação. Por favor tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showStepIndicator = form.hasRooms || step > 1

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
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Nova Propriedade</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {step === 1
              ? 'Preencha os dados da nova propriedade.'
              : step === 2
              ? 'Adicione os quartos da propriedade.'
              : 'Reveja e confirme a criação.'}
          </p>
        </div>
      </div>

      {showStepIndicator && <StepIndicator current={step} />}

      {step === 1 && (
        <Step1
          form={form}
          setForm={setForm}
          slugManual={slugManual}
          setSlugManual={setSlugManual}
          spaceConfig={spaceConfig}
          setSpaceConfig={setSpaceConfig}
          onSaveDirect={handleSaveDirect}
          onContinue={handleContinueToRooms}
          isSubmitting={isSubmitting}
          apiError={apiError}
        />
      )}

      {step === 2 && propertyId && (
        <Step2
          propertyId={propertyId}
          rooms={rooms}
          setRooms={setRooms}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}

      {step === 3 && propertyId && (
        <Step3
          form={form}
          rooms={rooms}
          propertyId={propertyId}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  )
}
