'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sileo } from 'sileo'
import BedPicker from '@/domains/room/components/BedPicker'
import ServicesChecklist from '@/domains/room/components/ServicesChecklist'
import ToggleSwitch from '@/shared/components/ui/ToggleSwitch'

// ─── Slug helper ──────────────────────────────────────────────────────────────

function generateSlug(val: string): string {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Individual' },
  { value: 'DOUBLE', label: 'Duplo' },
  { value: 'TWIN', label: 'Twin' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'JUNIOR_SUITE', label: 'Suite Junior' },
  { value: 'FAMILY', label: 'Familiar' },
  { value: 'STUDIO', label: 'Estúdio' },
  { value: 'ENTIRE_PLACE', label: 'Alojamento completo' },
]

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
  // New fields from COMMIT 1 (Property Details & Redesign)
  arrivalType: string
  floors: string
  hasElevator: boolean
  towelsIncluded: boolean
  petsAllowed: boolean
  childrenAllowed: boolean
  smokingAllowed: boolean
  spaceDescription: string
  accessInfo: string
  interactionInfo: string
  additionalInfo: string
  parkingInfo: string
  extraServices: string
  houseRules: string
  cancellationDays: string
  licenseNumber: string
  hostDescription: string
}

interface RoomDraft {
  localId: string
  id?: string   // set after API POST
  name: string
  type: string
  pricePerNight: number
  maxGuests: number
  bathroomType: string
  bedsList: string[]
  services: string[]
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
  // New fields from COMMIT 1
  arrivalType: 'autonomous',
  floors: '1',
  hasElevator: false,
  towelsIncluded: false,
  petsAllowed: false,
  childrenAllowed: true,
  smokingAllowed: false,
  spaceDescription: '',
  accessInfo: '',
  interactionInfo: '',
  additionalInfo: '',
  parkingInfo: '',
  extraServices: '',
  houseRules: '',
  cancellationDays: '0',
  licenseNumber: '',
  hostDescription: '',
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const INPUT =
  'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition'
const SELECT = INPUT + ' cursor-pointer'

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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#1a1a2e] uppercase tracking-wider flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-[10px] text-slate-400 font-medium italic">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] font-medium text-red-500 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="material-symbols-outlined text-[#8b1a1a] text-lg">{icon}</span>}
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </section>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Informação básica' },
    { n: 2, label: 'Quartos' },
    { n: 3, label: 'Revisão' },
  ]

  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done ? 'bg-emerald-500 text-white'
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
  form: Step1State
  setForm: React.Dispatch<React.SetStateAction<Step1State>>
  slugManual: boolean
  setSlugManual: React.Dispatch<React.SetStateAction<boolean>>
  errors: Partial<Record<keyof Step1State, string>>
  spaceConfig: { bedsList: string[]; services: string[] }
  setSpaceConfig: React.Dispatch<React.SetStateAction<{ bedsList: string[]; services: string[] }>>
  apiError: string | null
  isSubmitting: boolean
  onContinue: () => void   // hasRooms=true: save DRAFT → step 2
  onSaveDirect: () => void   // hasRooms=false: save → redirect
}) {
  function set(field: keyof Step1State, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'title' && !slugManual) {
        next.slug = generateSlug(value as string)
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.hasRooms) onContinue()
    else onSaveDirect()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Informação básica" icon="info">
        <Field label="Título" required error={errors.title}>
          <input className={INPUT} placeholder="Apartamento moderno em Lisboa"
            value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>

        <Field label="Slug (URL)" required error={errors.slug}>
          <input className={INPUT} placeholder="apartamento-moderno-lisboa"
            value={form.slug} onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }} />
        </Field>

        <Field label="Descrição principal" required error={errors.description}>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition"
            rows={4}
            placeholder="Breve descrição comercial…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de alojamento">
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

      <Card title="Localização" icon="location_on">
        <Field label="Morada" required error={errors.address}>
          <input className={INPUT} placeholder="Rua do Carmo 45"
            value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cidade" required error={errors.city}>
            <input className={INPUT} placeholder="Lisboa"
              value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="Código postal">
            <input className={INPUT} placeholder="1200-011"
              value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Detalhes do alojamento" icon="home">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Hóspedes máx." required error={errors.maxGuests}>
            <input className={INPUT} type="number" min={1} value={form.maxGuests}
              onChange={(e) => set('maxGuests', e.target.value)} />
          </Field>
          <Field label="Quartos">
            <input className={INPUT} type="number" min={0} value={form.bedrooms}
              onChange={(e) => set('bedrooms', e.target.value)} />
          </Field>
          <Field label="Casas de banho">
            <input className={INPUT} type="number" min={0} value={form.bathrooms}
              onChange={(e) => set('bathrooms', e.target.value)} />
          </Field>
          <Field label="Camas">
            <input className={INPUT} type="number" min={1} value={form.beds}
              onChange={(e) => set('beds', e.target.value)} />
          </Field>
        </div>
        <Field label="Área (m²)">
          <input className={INPUT} type="number" min={1} value={form.area}
            onChange={(e) => set('area', e.target.value)} placeholder="0" />
        </Field>
      </Card>

      {/* ── Detalhes do espaço (Modified from HEAD) ── */}
      <Card title="Detalhes do espaço" icon="architecture">
        <Field label="Tipo de chegada">
          <div className="flex flex-wrap gap-4 mt-2">
            <label className="flex-1 min-w-[200px] cursor-pointer group">
              <input type="radio" name="arrivalType" className="sr-only"
                checked={form.arrivalType === 'autonomous'} onChange={() => set('arrivalType', 'autonomous')} />
              <div className={`p-4 rounded-xl border-2 transition-all ${form.arrivalType === 'autonomous' ? 'border-[#8b1a1a] bg-[#8b1a1a]/5' : 'border-slate-100 hover:border-slate-200'}`}>
                <p className="font-bold text-sm text-[#1a1a2e]">Chegada autónoma</p>
                <p className="text-xs text-slate-500 mt-1">O hóspede recebe instruções e acede sozinho</p>
              </div>
            </label>
            <label className="flex-1 min-w-[200px] cursor-pointer group">
              <input type="radio" name="arrivalType" className="sr-only"
                checked={form.arrivalType === 'guided'} onChange={() => set('arrivalType', 'guided')} />
              <div className={`p-4 rounded-xl border-2 transition-all ${form.arrivalType === 'guided' ? 'border-[#8b1a1a] bg-[#8b1a1a]/5' : 'border-slate-100 hover:border-slate-200'}`}>
                <p className="font-bold text-sm text-[#1a1a2e]">Chegada acompanhada</p>
                <p className="text-xs text-slate-500 mt-1">O anfitrião recebe o hóspede pessoalmente</p>
              </div>
            </label>
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Número de pisos">
            <input className={INPUT} type="number" min="1" max="20" value={form.floors}
              onChange={(e) => set('floors', e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1">Pisos totais do alojamento</p>
          </Field>
          <div className="flex items-center">
            {Number(form.floors) > 1 && (
              <ToggleSwitch checked={form.hasElevator} onChange={(v) => set('hasElevator', v)} label="Tem elevador?" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-2">
          <ToggleSwitch checked={form.towelsIncluded} onChange={(v) => set('towelsIncluded', v)} label="Toalhas e lençóis incluídos" helper="Linho de cama e banho" />
          <ToggleSwitch checked={form.petsAllowed} onChange={(v) => set('petsAllowed', v)} label="Animais de estimação" />
          <ToggleSwitch checked={form.childrenAllowed} onChange={(v) => set('childrenAllowed', v)} label="Apto para crianças" helper="A partir de 2 anos" />
          <ToggleSwitch checked={form.smokingAllowed} onChange={(v) => set('smokingAllowed', v)} label="Permitido fumar" />
        </div>
      </Card>

      {/* ── Informação para hóspedes (Modified from HEAD) ── */}
      <Card title="Informação para hóspedes" icon="chat">
        <div className="space-y-5">
          <Field label="Descrição detalhada do espaço">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-32 resize-none"
              placeholder="Como está organizado o espaço, quartos, áreas comuns..."
              value={form.spaceDescription} onChange={(e) => set('spaceDescription', e.target.value)} />
          </Field>
          <Field label="Instruções de acesso">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-24 resize-none"
              placeholder="Como entrar no prédio, códigos, chaves..."
              value={form.accessInfo} onChange={(e) => set('accessInfo', e.target.value)} />
          </Field>
          <Field label="Interação com hóspedes">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-24 resize-none"
              placeholder="Disponibilidade para apoio durante a estadia..."
              value={form.interactionInfo} onChange={(e) => set('interactionInfo', e.target.value)} />
          </Field>
          <Field label="Informação adicional">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-24 resize-none"
              placeholder="Eventos locais, transportes, dicas..."
              value={form.additionalInfo} onChange={(e) => set('additionalInfo', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Regras e Comodidades extra" icon="rule">
        <div className="space-y-5">
          <Field label="Estacionamento">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-20 resize-none"
              placeholder="Informação sobre onde estacionar…"
              value={form.parkingInfo} onChange={(e) => set('parkingInfo', e.target.value)} />
          </Field>
          <Field label="Serviços extra">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-20 resize-none"
              placeholder="Pequeno-almoço, transfer, etc…"
              value={form.extraServices} onChange={(e) => set('extraServices', e.target.value)} />
          </Field>
          <Field label="Normas da casa">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-24 resize-none"
              placeholder="Horário de silêncio, lixo, etc…"
              value={form.houseRules} onChange={(e) => set('houseRules', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Sobre o anfitrião" icon="person">
        <div className="space-y-5">
          <Field label="Número de licença AL">
            <input className={INPUT} placeholder="XXXXX/AL" value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} />
          </Field>
          <Field label="Biografia do anfitrião">
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm h-32 resize-none"
              placeholder="Fale um pouco sobre si…"
              value={form.hostDescription} onChange={(e) => set('hostDescription', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title="Preços e Datas" icon="payments">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Preço / noite (€)" required error={errors.pricePerNight}>
            <input className={INPUT} type="number" min={0} step="0.01" value={form.pricePerNight}
              onChange={(e) => set('pricePerNight', e.target.value)} />
          </Field>
          <Field label="Taxa limpeza (€)">
            <input className={INPUT} type="number" min={0} value={form.cleaningFee}
              onChange={(e) => set('cleaningFee', e.target.value)} />
          </Field>
          <Field label="Depósito (€)">
            <input className={INPUT} type="number" min={0} value={form.securityDeposit}
              onChange={(e) => set('securityDeposit', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in">
            <input className={INPUT} type="time" value={form.checkInTime}
              onChange={(e) => set('checkInTime', e.target.value)} />
          </Field>
          <Field label="Check-out">
            <input className={INPUT} type="time" value={form.checkOutTime}
              onChange={(e) => set('checkOutTime', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
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

        <div className="pt-2">
          <Field label="Dias para cancelamento gratuito">
            <input className={INPUT} type="number" min="0" value={form.cancellationDays}
              onChange={(e) => set('cancellationDays', e.target.value)} />
          </Field>
        </div>

        {/* hasRooms toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none pt-4">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-200 text-[#8b1a1a] focus:ring-[#8b1a1a]/30"
            checked={form.hasRooms}
            onChange={(e) => set('hasRooms', e.target.checked)}
          />
          <span className="text-sm font-semibold text-slate-700">
            Esta propriedade permite reservar quartos individuais separadamente
          </span>
        </label>
      </Card>

      {/* ── hasRooms=true notice ── */}
      {form.hasRooms && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Propriedade com quartos individuais</p>
          <p className="text-blue-700">
            Os detalhes de camas e comodidades serão configurados em cada quarto individualmente no próximo passo.
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

          <Card title="Camas do alojamento" icon="bed">
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
        <Link href="/dashboard/properties"
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-auto px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A guardar…</>
          ) : form.hasRooms ? (
            <>Continuar <span className="material-symbols-outlined text-base">arrow_forward</span></>
          ) : (
            <><span className="material-symbols-outlined text-lg">add</span> Criar Propriedade</>
          )}
        </button>
      </div>
    </form>
  )
}

// ─── InlineRoomForm ───────────────────────────────────────────────────────────

function InlineRoomForm({
  propertyId,
  roomsCount,
  onSaved,
  onCancel,
}: {
  propertyId: string
  roomsCount: number
  onSaved: (room: RoomDraft) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('DOUBLE')
  const [price, setPrice] = useState('')
  const [maxGuests, setMaxGuests] = useState('2')
  const [bedrooms, setBedrooms] = useState('1')
  const [bathrooms, setBathrooms] = useState('1')
  const [bathroomType, setBathroomType] = useState('private')
  const [bedsList, setBedsList] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName(''); setType('DOUBLE'); setPrice(''); setMaxGuests('2')
    setBedrooms('1'); setBathrooms('1'); setBathroomType('private')
    setBedsList([]); setServices([])
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('O nome do quarto é obrigatório')
      return
    }
    if (!price || Number(price) <= 0) {
      setError('O preço por noite é obrigatório')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          pricePerNight: Number(price),
          maxGuests: Number(maxGuests),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          beds: Math.max(1, bedsList.length),
          bathroomType,
          bedsList: bedsList.length > 0 ? JSON.stringify(bedsList) : undefined,
          services: services.length > 0 ? JSON.stringify(services) : undefined,
          order: roomsCount,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao guardar quarto')
        return
      }
      onSaved({
        localId: crypto.randomUUID(),
        id: json.data.id,
        name: name.trim(),
        type,
        pricePerNight: Number(price),
        maxGuests: Number(maxGuests),
        bathroomType,
        bedsList,
        services,
      })
      reset()
      sileo.success({
        title: 'Quarto adicionado!',
        description: `${name.trim()} foi adicionado com sucesso`,
      })
    } catch {
      setError('Erro de ligação. Tente novamente')
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
          <input className={INPUT} placeholder="ex: Quarto Vista Mar" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <select className={SELECT} value={type} onChange={(e) => setType(e.target.value)}>
            {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Preço por noite (€)" required>
          <input className={INPUT} type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Hóspedes máx.">
          <input className={INPUT} type="number" min={1} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
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
          <option value="private">Casa de banho privada</option>
          <option value="shared">Casa de banho partilhada</option>
        </select>
      </Field>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Camas</p>
        <BedPicker value={bedsList} onChange={setBedsList} />
      </div>

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

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
        <button type="button" onClick={handleSave} disabled={saving} className="ml-auto px-6 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A guardar…</> : <><span className="material-symbols-outlined text-base">add</span> Adicionar quarto — {roomTypeLabel}</>}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 — Rooms ───────────────────────────────────────────────────────────

function Step2({
  propertyId, rooms, setRooms, onBack, onContinue,
}: {
  propertyId: string
  rooms: RoomDraft[]
  setRooms: React.Dispatch<React.SetStateAction<RoomDraft[]>>
  onBack: () => void
  onContinue: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const ROOM_TYPE_LABELS: Record<string, string> = Object.fromEntries(ROOM_TYPES.map((t) => [t.value, t.label]))

  function removeRoom(localId: string) {
    setRooms((prev) => prev.filter((r) => r.localId !== localId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-[#1a1a2e] tracking-tight">Adicione os quartos</h3>
        <p className="text-sm text-slate-500 mt-1">Mínimo 1 quarto necessário para continuar.</p>
      </div>

      <section className="space-y-4">
        {rooms.length > 0 && (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.localId} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#1a1a2e] text-sm truncate">{room.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{ROOM_TYPE_LABELS[room.type] ?? room.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">€{room.pricePerNight}/noite · {room.maxGuests} hóspedes</p>
                </div>
                <button onClick={() => removeRoom(room.localId)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"><span className="material-symbols-outlined text-base">delete</span></button>
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
            roomsCount={rooms.length}
            onSaved={(room) => {
              setRooms((prev) => [...prev, room])
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </section>

      <div className="flex items-center gap-3 pb-8 pt-4 border-t border-slate-100">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Voltar
        </button>
        <button type="button" onClick={onContinue} disabled={rooms.length === 0} className="ml-auto px-8 py-2.5 bg-[#8b1a1a] hover:bg-[#6d1414] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-40">
          Continuar <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 — Review ──────────────────────────────────────────────────────────

function Step3({
  form, rooms, propertyId, onBack,
}: {
  form: Step1State
  rooms: RoomDraft[]
  propertyId: string
  onBack: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const ROOMS_LABELS = Object.fromEntries(ROOM_TYPES.map((t) => [t.value, t.label]))

  async function handleFinalize() {
    setSaving(true); setApiError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      if (!res.ok) {
        const json = await res.json()
        setApiError(json.error || 'Erro ao publicar.')
        return
      }
      router.push(`/dashboard/properties/${propertyId}/images?created=1`)
    } catch {
      setApiError('Erro de ligação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Propriedade</h3>
        <p className="font-bold text-lg">{form.title}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
          <p>Localização: <strong>{form.city}, {form.country}</strong></p>
          <p>Preço base: <strong>€{form.pricePerNight}/noite</strong></p>
          <p>Ocupação: <strong>até {form.maxGuests} hóspedes</strong></p>
          <p>Tipo: <strong>{form.type}</strong></p>
        </div>
      </div>

      {rooms.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h3 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-wider">Quartos ({rooms.length})</h3>
          <div className="divide-y divide-slate-100">
            {rooms.map((r) => (
              <div key={r.localId} className="py-2 flex justify-between text-sm">
                <span>{r.name} ({ROOMS_LABELS[r.type] || r.type})</span>
                <span className="font-bold">€{r.pricePerNight}/noite</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {apiError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{apiError}</div>}

      <div className="flex items-center gap-3 pb-8 pt-4 border-t border-slate-100">
        <button type="button" onClick={onBack} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Voltar</button>
        <button type="button" onClick={handleFinalize} disabled={saving} className="ml-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-60">
          {saving ? 'A publicar…' : <><span className="material-symbols-outlined text-base">check</span> Publicar propriedade</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<Step1State>(STEP1_INITIAL)
  const [slugManual, setSlugManual] = useState(false)
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<RoomDraft[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof Step1State, string>>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [spaceConfig, setSpaceConfig] = useState<{ bedsList: string[]; services: string[] }>({ bedsList: [], services: [] })

  function validateStep1(): boolean {
    const e: Partial<Record<keyof Step1State, string>> = {}
    if (!form.title.trim()) e.title = 'Título é obrigatório'
    if (!form.slug.trim()) e.slug = 'Slug é obrigatório'
    if (!form.description.trim()) e.description = 'Descrição é obrigatória'
    if (!form.address.trim()) e.address = 'Morada é obrigatória'
    if (!form.city.trim()) e.city = 'Cidade é obrigatória'
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) e.pricePerNight = 'Preço inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function buildPayload(status: 'DRAFT' | 'ACTIVE') {
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
      bathroomType: !form.hasRooms ? form.bathroomType : undefined,
      bedsConfig: !form.hasRooms && spaceConfig.bedsList.length > 0 ? JSON.stringify(spaceConfig.bedsList) : undefined,
      services: !form.hasRooms && spaceConfig.services.length > 0 ? JSON.stringify(spaceConfig.services) : undefined,
      // New fields from COMMIT 1
      arrivalType: form.arrivalType,
      floors: Number(form.floors) || 1,
      hasElevator: form.hasElevator,
      towelsIncluded: form.towelsIncluded,
      petsAllowed: form.petsAllowed,
      childrenAllowed: form.childrenAllowed,
      smokingAllowed: form.smokingAllowed,
      spaceDescription: form.spaceDescription.trim() || undefined,
      accessInfo: form.accessInfo.trim() || undefined,
      interactionInfo: form.interactionInfo.trim() || undefined,
      additionalInfo: form.additionalInfo.trim() || undefined,
      parkingInfo: form.parkingInfo.trim() || undefined,
      extraServices: form.extraServices.trim() || undefined,
      houseRules: form.houseRules.trim() || undefined,
      cancellationDays: Number(form.cancellationDays) || 0,
      licenseNumber: form.licenseNumber.trim() || undefined,
      hostDescription: form.hostDescription.trim() || undefined,
    }
  }

  async function handleSaveDirect() {
    if (!validateStep1()) return
    setIsSubmitting(true); setApiError(null)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('ACTIVE')),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.error || 'Erro ao criar.'); return }
      router.push(`/dashboard/properties/${data.data.id}/images?created=1`)
    } catch {
      setApiError('Erro de ligação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleContinue() {
    if (!validateStep1()) return
    setIsSubmitting(true); setApiError(null)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('DRAFT')),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.error || 'Erro ao guardar.'); return }
      setPropertyId(data.data.id); setStep(2)
    } catch {
      setApiError('Erro de ligação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showIndicator = form.hasRooms || step > 1

  return (
    <div className="max-w-3xl pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => step > 1 ? setStep((s) => (s - 1) as any) : router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><span className="material-symbols-outlined text-lg">arrow_back</span></button>
        <div>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Nova Propriedade</h2>
          <p className="text-sm text-slate-500">{step === 1 ? 'Configure os dados principais' : step === 2 ? 'Adicione os quartos' : 'Confirmação final'}</p>
        </div>
      </div>

      {showIndicator && <StepIndicator current={step} />}

      {step === 1 && (
        <Step1 form={form} setForm={setForm} slugManual={slugManual} setSlugManual={setSlugManual}
          errors={errors} spaceConfig={spaceConfig} setSpaceConfig={setSpaceConfig}
          apiError={apiError} isSubmitting={isSubmitting} onContinue={handleContinue} onSaveDirect={handleSaveDirect} />
      )}
      {step === 2 && propertyId && (
        <Step2 propertyId={propertyId} rooms={rooms} setRooms={setRooms} onBack={() => setStep(1)} onContinue={() => setStep(3)} />
      )}
      {step === 3 && propertyId && (
        <Step3 form={form} rooms={rooms} propertyId={propertyId} onBack={() => setStep(2)} />
      )}
    </div>
  )
}
