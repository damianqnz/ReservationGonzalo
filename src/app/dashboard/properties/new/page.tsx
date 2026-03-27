'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1State {
  title:              string
  slug:               string
  description:        string
  type:               string
  address:            string
  city:               string
  country:            string
  zipCode:            string
  maxGuests:          string
  bedrooms:           string
  bathrooms:          string
  beds:               string
  area:               string
  pricePerNight:      string
  cleaningFee:        string
  securityDeposit:    string
  checkInTime:        string
  checkOutTime:       string
  minNights:          string
  maxNights:          string
  cancellationPolicy: string
  hasRooms:           boolean
  // space config (only used when hasRooms=false)
  bathroomType:       string
}

interface RoomDraft {
  localId:       string
  id?:           string   // set after API POST
  name:          string
  type:          string
  pricePerNight: number
  maxGuests:     number
  bathroomType:  string
  bedsList:      string[]
  services:      string[]
}

const STEP1_INITIAL: Step1State = {
  title:              '',
  slug:               '',
  description:        '',
  type:               'APARTMENT',
  address:            '',
  city:               '',
  country:            'PT',
  zipCode:            '',
  maxGuests:          '2',
  bedrooms:           '1',
  bathrooms:          '1',
  beds:               '1',
  area:               '',
  pricePerNight:      '',
  cleaningFee:        '0',
  securityDeposit:    '0',
  checkInTime:        '15:00',
  checkOutTime:       '11:00',
  minNights:          '1',
  maxNights:          '365',
  cancellationPolicy: 'FLEXIBLE',
  hasRooms:           false,
  bathroomType:       'private',
}

// ─── Shared field styling ─────────────────────────────────────────────────────

const INPUT =
  'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition'
const SELECT = INPUT + ' cursor-pointer'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, required, error, hint, children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-[#8b1a1a] ml-0.5">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider flex items-center gap-2">
        <span className="material-symbols-outlined text-[#8b1a1a] text-base">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Informação básica' },
    { n: 2, label: 'Quartos'           },
    { n: 3, label: 'Revisão'           },
  ]

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done   = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done   ? 'bg-emerald-500 text-white'
                  : active ? 'bg-[#8b1a1a] text-white'
                  : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done
                  ? <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  : s.n}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${active ? 'text-[#1a1a2e]' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Basic info form ─────────────────────────────────────────────────

function Step1({
  form,
  setForm,
  slugManual,
  setSlugManual,
  errors,
  spaceConfig,
  setSpaceConfig,
  apiError,
  isSubmitting,
  onContinue,
  onSaveDirect,
}: {
  form:            Step1State
  setForm:         React.Dispatch<React.SetStateAction<Step1State>>
  slugManual:      boolean
  setSlugManual:   React.Dispatch<React.SetStateAction<boolean>>
  errors:          Partial<Record<keyof Step1State, string>>
  spaceConfig:     { bedsList: string[]; services: string[] }
  setSpaceConfig:  React.Dispatch<React.SetStateAction<{ bedsList: string[]; services: string[] }>>
  apiError:        string | null
  isSubmitting:    boolean
  onContinue:      () => void   // hasRooms=true: save DRAFT → step 2
  onSaveDirect:    () => void   // hasRooms=false: save → redirect
}) {
  function set(field: keyof Step1State, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !slugManual) {
        next.slug = toSlug(value as string)
      }
      return next
    })
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); form.hasRooms ? onContinue() : onSaveDirect() }}
      className="space-y-6"
    >
      {/* ── Informação básica ── */}
      <Card title="Informação básica" icon="home">
        <Field label="Título" required error={errors.title}>
          <input
            className={INPUT}
            placeholder="Apartamento moderno em Lisboa — Chiado"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>

        <Field
          label="Slug (URL)"
          required
          error={errors.slug}
          hint="Gerado automaticamente. Apenas letras minúsculas, números e hífens."
        >
          <input
            className={INPUT}
            placeholder="apartamento-moderno-lisboa-chiado"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }}
          />
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
      </Card>

      {/* ── Localização ── */}
      <Card title="Localização" icon="location_on">
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
      </Card>

      {/* ── Detalhes ── */}
      <Card title="Detalhes" icon="info">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Hóspedes máx." required error={errors.maxGuests}>
            <input className={INPUT} type="number" min={1} max={50} value={form.maxGuests}
              onChange={(e) => set('maxGuests', e.target.value)} />
          </Field>
          <Field label="Quartos">
            <input className={INPUT} type="number" min={0} max={50} value={form.bedrooms}
              onChange={(e) => set('bedrooms', e.target.value)} />
          </Field>
          <Field label="Casas de banho">
            <input className={INPUT} type="number" min={0} max={50} value={form.bathrooms}
              onChange={(e) => set('bathrooms', e.target.value)} />
          </Field>
          <Field label="Camas">
            <input className={INPUT} type="number" min={1} max={50} value={form.beds}
              onChange={(e) => set('beds', e.target.value)} />
          </Field>
        </div>
        <Field label="Área (m²)">
          <input className={INPUT} type="number" min={1} placeholder="75" value={form.area}
            onChange={(e) => set('area', e.target.value)} />
        </Field>
      </Card>

      {/* ── Preços ── */}
      <Card title="Preços" icon="euro">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Preço por noite (€)" required error={errors.pricePerNight}>
            <input className={INPUT} type="number" min={0} step="0.01" placeholder="120"
              value={form.pricePerNight} onChange={(e) => set('pricePerNight', e.target.value)} />
          </Field>
          <Field label="Taxa de limpeza (€)">
            <input className={INPUT} type="number" min={0} step="0.01" value={form.cleaningFee}
              onChange={(e) => set('cleaningFee', e.target.value)} />
          </Field>
          <Field label="Depósito segurança (€)">
            <input className={INPUT} type="number" min={0} step="0.01" value={form.securityDeposit}
              onChange={(e) => set('securityDeposit', e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* ── Políticas ── */}
      <Card title="Políticas" icon="policy">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in">
            <input className={INPUT} type="time" value={form.checkInTime}
              onChange={(e) => set('checkInTime', e.target.value)} />
          </Field>
          <Field label="Check-out">
            <input className={INPUT} type="time" value={form.checkOutTime}
              onChange={(e) => set('checkOutTime', e.target.value)} />
          </Field>
          <Field label="Noites mínimas">
            <input className={INPUT} type="number" min={1} value={form.minNights}
              onChange={(e) => set('minNights', e.target.value)} />
          </Field>
          <Field label="Noites máximas">
            <input className={INPUT} type="number" min={1} value={form.maxNights}
              onChange={(e) => set('maxNights', e.target.value)} />
          </Field>
        </div>
        <Field label="Política de cancelamento">
          <select className={SELECT} value={form.cancellationPolicy}
            onChange={(e) => set('cancellationPolicy', e.target.value)}>
            <option value="FLEXIBLE">Flexível — cancelamento gratuito até 24h antes</option>
            <option value="MODERATE">Moderada — reembolso parcial até 5 dias antes</option>
            <option value="STRICT">Estrita — não reembolsável</option>
          </select>
        </Field>

        {/* hasRooms toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
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
      </Card>

      {/* ── hasRooms=true notice ── */}
      {form.hasRooms && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Propriedade com quartos individuais</p>
          <p className="text-blue-700">
            Os detalhes de camas e serviços serão configurados em cada quarto individualmente.
            Clique em <strong>Continuar →</strong> para adicionar os quartos.
          </p>
        </div>
      )}

      {/* ── Configuração do espaço (only when hasRooms=false) ── */}
      {!form.hasRooms && (
        <>
          <Card title="Casa de banho" icon="bathtub">
            <Field label="Tipo de casa de banho">
              <select className={SELECT} value={form.bathroomType}
                onChange={(e) => set('bathroomType', e.target.value)}>
                <option value="private">Casa de banho privada</option>
                <option value="shared">Casa de banho partilhada</option>
              </select>
            </Field>
          </Card>

          <Card title="Tipo de camas" icon="bed">
            <BedPicker
              value={spaceConfig.bedsList}
              onChange={(v) => setSpaceConfig((p) => ({ ...p, bedsList: v }))}
            />
          </Card>

          <Card title="Serviços incluídos" icon="check_circle">
            <ServicesChecklist
              value={spaceConfig.services}
              onChange={(v) => setSpaceConfig((p) => ({ ...p, services: v }))}
            />
          </Card>
        </>
      )}

      {/* ── Error ── */}
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
          className="ml-auto px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              A guardar…
            </>
          ) : form.hasRooms ? (
            <>Continuar <span className="material-symbols-outlined text-base">arrow_forward</span></>
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

// ─── Inline room form ─────────────────────────────────────────────────────────

interface InlineRoomFormProps {
  propertyId:  string
  onAdded:     (room: RoomDraft) => void
  onCancel:    () => void
  nextOrder:   number
}

function InlineRoomForm({ propertyId, onAdded, onCancel, nextOrder }: InlineRoomFormProps) {
  const [name,          setName]          = useState('')
  const [type,          setType]          = useState('DOUBLE')
  const [price,         setPrice]         = useState('')
  const [maxGuests,     setMaxGuests]     = useState('2')
  const [bathroomType,  setBathroomType]  = useState('private')
  const [bedsList,      setBedsList]      = useState<string[]>([])
  const [services,      setServices]      = useState<string[]>([])
  const [servicesOpen,  setServicesOpen]  = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim()) { setError('Nome do quarto é obrigatório.'); return }
    if (!price || Number(price) <= 0) { setError('Preço por noite é obrigatório.'); return }
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          name.trim(),
          type,
          pricePerNight: Number(price),
          maxGuests:     Number(maxGuests),
          bathroomType,
          bathrooms:     1,
          bedrooms:      1,
          beds:          Math.max(1, bedsList.length),
          bedsList:      bedsList.length > 0 ? JSON.stringify(bedsList) : undefined,
          services:      services.length  > 0 ? JSON.stringify(services) : undefined,
          order:         nextOrder,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erro ao criar quarto.')
        return
      }
      const localId = crypto.randomUUID()
      onAdded({
        localId,
        id:            json.data.id,
        name:          name.trim(),
        type,
        pricePerNight: Number(price),
        maxGuests:     Number(maxGuests),
        bathroomType,
        bedsList,
        services,
      })
    } catch {
      setError('Erro de ligação. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const roomTypeLabel = ROOM_TYPES.find((t) => t.value === type)?.label ?? type

  return (
    <div className="border-2 border-[#8b1a1a]/20 rounded-2xl bg-white p-5 space-y-4">
      <h4 className="text-sm font-bold text-[#1a1a2e] flex items-center gap-2">
        <span className="material-symbols-outlined text-[#8b1a1a] text-base">add_box</span>
        Novo quarto
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome do quarto" required>
          <input
            className={INPUT}
            placeholder="ex: Quarto Duplo Vista Mar"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Tipo">
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value)}>
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Preço por noite (€)" required>
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
            max={20}
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Casa de banho">
        <select className={SELECT} value={bathroomType} onChange={(e) => setBathroomType(e.target.value)}>
          <option value="private">Casa de banho privada</option>
          <option value="shared">Casa de banho partilhada</option>
        </select>
      </Field>

      {/* Beds */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Camas</p>
        <BedPicker value={bedsList} onChange={setBedsList} />
      </div>

      {/* Services accordion */}
      <div>
        <button
          type="button"
          onClick={() => setServicesOpen((o) => !o)}
          className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-slate-500 py-2 hover:text-slate-700 transition-colors"
        >
          <span>Serviços incluídos {services.length > 0 && `(${services.length} selecionados)`}</span>
          <span
            className="material-symbols-outlined text-base transition-transform duration-200"
            style={{ transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </button>
        {servicesOpen && (
          <div className="mt-2">
            <ServicesChecklist value={services} onChange={setServices} />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="ml-auto px-6 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A guardar…</>
          ) : (
            <><span className="material-symbols-outlined text-base">add</span> Adicionar quarto — {roomTypeLabel}</>
          )}
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
  rooms:       RoomDraft[]
  setRooms:    React.Dispatch<React.SetStateAction<RoomDraft[]>>
  onBack:      () => void
  onContinue:  () => void
}) {
  const [showForm, setShowForm] = useState(false)

  const ROOM_TYPE_LABELS: Record<string, string> = Object.fromEntries(
    ROOM_TYPES.map((t) => [t.value, t.label])
  )

  function removeRoom(localId: string) {
    setRooms((prev) => prev.filter((r) => r.localId !== localId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-[#1a1a2e] tracking-tight">
          Adicione os quartos da sua propriedade
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Mínimo 1 quarto necessário para continuar.
        </p>
      </div>

      {/* Room list */}
      {rooms.length > 0 && (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.localId}
              className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#1a1a2e] text-sm truncate">{room.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full whitespace-nowrap">
                    {ROOM_TYPE_LABELS[room.type] ?? room.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  €{room.pricePerNight}/noite · até {room.maxGuests} hóspede{room.maxGuests !== 1 ? 's' : ''}
                  {room.bedsList.length > 0 && ` · ${room.bedsList.length} cama${room.bedsList.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={() => removeRoom(room.localId)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0"
                title="Remover quarto"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add room button / inline form */}
      {showForm ? (
        <InlineRoomForm
          propertyId={propertyId}
          nextOrder={rooms.length}
          onAdded={(room) => {
            setRooms((prev) => [...prev, room])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:border-[#8b1a1a] hover:text-[#8b1a1a] hover:bg-[#8b1a1a]/5 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Adicionar quarto
        </button>
      )}

      {rooms.length === 0 && !showForm && (
        <p className="text-center text-sm text-slate-400 italic">Nenhum quarto adicionado ainda.</p>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pb-8 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={rooms.length === 0}
          className="ml-auto px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuar
          <span className="material-symbols-outlined text-base">arrow_forward</span>
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
  form:       Step1State
  rooms:      RoomDraft[]
  propertyId: string
  onBack:     () => void
}) {
  const router      = useRouter()
  const [saving,    setSaving]   = useState(false)
  const [apiError,  setApiError] = useState<string | null>(null)

  const ROOM_TYPE_LABELS: Record<string, string> = Object.fromEntries(
    ROOM_TYPES.map((t) => [t.value, t.label])
  )

  const TYPE_LABELS: Record<string, string> = {
    APARTMENT: 'Apartamento', HOUSE: 'Casa', VILLA: 'Vila',
    STUDIO: 'Estúdio', ROOM: 'Quarto',
  }

  async function handleCreate() {
    setSaving(true)
    setApiError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      const json = await res.json()
      if (!res.ok) {
        setApiError(typeof json.error === 'string' ? json.error : 'Erro ao publicar propriedade.')
        return
      }
      router.push(`/dashboard/properties/${propertyId}/images?created=1`)
    } catch {
      setApiError('Erro de ligação. Por favor tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-[#1a1a2e] tracking-tight">
          Revisão final
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Confirme os dados antes de criar a propriedade.
        </p>
      </div>

      {/* Property summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Propriedade</h4>
        <p className="font-bold text-[#1a1a2e] text-lg">{form.title}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>{TYPE_LABELS[form.type] ?? form.type}</span>
          <span>{form.city}, {form.country}</span>
          <span className="font-semibold text-[#1a1a2e]">€{form.pricePerNight}/noite</span>
          <span>até {form.maxGuests} hóspede{Number(form.maxGuests) !== 1 ? 's' : ''}</span>
        </div>
        {form.cancellationPolicy && (
          <p className="text-xs text-slate-400">{
            form.cancellationPolicy === 'FLEXIBLE' ? 'Política Flexível' :
            form.cancellationPolicy === 'MODERATE' ? 'Política Moderada' :
            'Política Estrita'
          }</p>
        )}
      </div>

      {/* Rooms summary */}
      {rooms.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quartos ({rooms.length})
          </h4>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div key={room.localId} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">bed</span>
                  <span className="text-sm font-semibold text-[#1a1a2e]">{room.name}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {ROOM_TYPE_LABELS[room.type] ?? room.type}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#1a1a2e]">€{room.pricePerNight}/noite</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pb-8 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Voltar
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="ml-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A publicar…</>
          ) : (
            <><span className="material-symbols-outlined text-base">check</span> Criar Propriedade</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter()

  // Wizard state
  const [step,         setStep]         = useState<1 | 2 | 3>(1)
  const [propertyId,   setPropertyId]   = useState<string | null>(null)

  // Step 1
  const [form,         setForm]         = useState<Step1State>(STEP1_INITIAL)
  const [slugManual,   setSlugManual]   = useState(false)
  const [errors,       setErrors]       = useState<Partial<Record<keyof Step1State, string>>>({})
  const [apiError,     setApiError]     = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [spaceConfig,  setSpaceConfig]  = useState<{ bedsList: string[]; services: string[] }>({
    bedsList: [],
    services: [],
  })

  // Step 2
  const [rooms, setRooms] = useState<RoomDraft[]>([])

  // ── Validate step 1 ────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const e: Partial<Record<keyof Step1State, string>> = {}
    if (!form.title.trim())        e.title       = 'Título é obrigatório'
    if (!form.slug.trim())         e.slug        = 'Slug é obrigatório'
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug  = 'Slug: apenas letras minúsculas, números e hífens'
    if (!form.description.trim() || form.description.length < 10)
      e.description = 'Descrição deve ter pelo menos 10 caracteres'
    if (!form.address.trim())      e.address     = 'Morada é obrigatória'
    if (!form.city.trim())         e.city        = 'Cidade é obrigatória'
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0)
      e.pricePerNight = 'Preço por noite é obrigatório'
    if (!form.maxGuests || Number(form.maxGuests) < 1)
      e.maxGuests = 'Mínimo 1 hóspede'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Build POST payload ─────────────────────────────────────────────────────

  function buildPayload(status: 'DRAFT' | 'ACTIVE') {
    return {
      title:              form.title.trim(),
      slug:               form.slug.trim(),
      description:        form.description.trim(),
      type:               form.type,
      status,
      address:            form.address.trim(),
      city:               form.city.trim(),
      country:            form.country || 'PT',
      zipCode:            form.zipCode.trim() || undefined,
      maxGuests:          Number(form.maxGuests),
      bedrooms:           Number(form.bedrooms),
      bathrooms:          Number(form.bathrooms),
      beds:               Number(form.beds),
      area:               form.area ? Number(form.area) : undefined,
      pricePerNight:      Number(form.pricePerNight),
      cleaningFee:        Number(form.cleaningFee) || 0,
      securityDeposit:    Number(form.securityDeposit) || 0,
      checkInTime:        form.checkInTime || '15:00',
      checkOutTime:       form.checkOutTime || '11:00',
      minNights:          Number(form.minNights) || 1,
      maxNights:          Number(form.maxNights) || 365,
      cancellationPolicy: form.cancellationPolicy,
      hasRooms:           form.hasRooms,
      // Space config fields (only meaningful when hasRooms=false)
      bathroomType:  !form.hasRooms ? form.bathroomType : undefined,
      bedsConfig:    !form.hasRooms && spaceConfig.bedsList.length > 0
                       ? JSON.stringify(spaceConfig.bedsList) : undefined,
      services:      !form.hasRooms && spaceConfig.services.length > 0
                       ? JSON.stringify(spaceConfig.services) : undefined,
    }
  }

  // ── hasRooms=false: save directly + redirect ──────────────────────────────

  async function handleSaveDirect() {
    if (!validateStep1()) return
    setIsSubmitting(true)
    setApiError(null)
    try {
      const res  = await fetch('/api/properties', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload('DRAFT')),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(typeof data.error === 'string' ? data.error : 'Erro ao criar a propriedade.')
        return
      }
      router.push(`/dashboard/properties/${data.data.id}/images`)
    } catch {
      setApiError('Erro de ligação. Por favor tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── hasRooms=true: save as DRAFT + advance to step 2 ─────────────────────

  async function handleContinueToRooms() {
    if (!validateStep1()) return
    setIsSubmitting(true)
    setApiError(null)
    try {
      const res  = await fetch('/api/properties', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload('DRAFT')),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(typeof data.error === 'string' ? data.error : 'Erro ao guardar propriedade.')
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const showWizardSteps = form.hasRooms || step > 1

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step === 1 ? (
          <Link
            href="/dashboard/properties"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            title="Voltar"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
        ) : (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            title="Voltar"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
        )}
        <div>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">
            Nova Propriedade
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {step === 1 && 'Preencha os dados da nova propriedade.'}
            {step === 2 && 'Adicione os quartos disponíveis.'}
            {step === 3 && 'Reveja e publique a propriedade.'}
          </p>
        </div>
      </div>

      {/* Step indicator — only when hasRooms mode */}
      {showWizardSteps && <StepIndicator current={step} />}

      {/* Steps */}
      {step === 1 && (
        <Step1
          form={form}
          setForm={setForm}
          slugManual={slugManual}
          setSlugManual={setSlugManual}
          errors={errors}
          spaceConfig={spaceConfig}
          setSpaceConfig={setSpaceConfig}
          apiError={apiError}
          isSubmitting={isSubmitting}
          onContinue={handleContinueToRooms}
          onSaveDirect={handleSaveDirect}
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
