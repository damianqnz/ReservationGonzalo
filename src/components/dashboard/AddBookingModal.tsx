'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espanha' },
  { value: 'FR', label: 'França' },
  { value: 'DE', label: 'Alemanha' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'IT', label: 'Itália' },
  { value: 'NL', label: 'Países Baixos' },
  { value: 'BE', label: 'Bélgica' },
  { value: 'CH', label: 'Suíça' },
  { value: 'AT', label: 'Áustria' },
  { value: 'SE', label: 'Suécia' },
  { value: 'NO', label: 'Noruega' },
  { value: 'DK', label: 'Dinamarca' },
  { value: 'PL', label: 'Polónia' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'CA', label: 'Canadá' },
  { value: 'BR', label: 'Brasil' },
  { value: 'AU', label: 'Austrália' },
  { value: 'JP', label: 'Japão' },
  { value: 'CN', label: 'China' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyOption {
  id:              string
  title:           string
  hasRooms:        boolean
  pricePerNight:   number
  cleaningFee:     number
  securityDeposit: number
  rooms:           { id: string; name: string; type: string; pricePerNight: number }[]
}

interface Props {
  isOpen:     boolean
  onClose:    () => void
  onCreated:  () => void
  properties: PropertyOption[]
}

interface FormState {
  propertyId:      string
  roomId:          string
  guestName:       string
  guestEmail:      string
  guestPhone:      string
  guestCountry:    string
  guestCount:      number
  checkIn:         string
  checkOut:        string
  pricePerNight:   number
  cleaningFee:     number
  securityDeposit: number
  paymentStatus:   'PAID' | 'UNPAID'
  guestMessage:    string
  ownerNotes:      string
}

const EMPTY_FORM: FormState = {
  propertyId:      '',
  roomId:          '',
  guestName:       '',
  guestEmail:      '',
  guestPhone:      '',
  guestCountry:    '',
  guestCount:      1,
  checkIn:         '',
  checkOut:        '',
  pricePerNight:   0,
  cleaningFee:     0,
  securityDeposit: 0,
  paymentStatus:   'PAID',
  guestMessage:    '',
  ownerNotes:      '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddBookingModal({ isOpen, onClose, onCreated, properties }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [availability, setAvailability] = useState<'available' | 'unavailable' | 'unknown'>('unknown')
  const [checking,    setChecking]    = useState(false)

  const selectedProperty = properties.find((p) => p.id === form.propertyId) ?? null
  const nights           = calcNights(form.checkIn, form.checkOut)
  const total            = form.pricePerNight * nights + form.cleaningFee + form.securityDeposit
  const minCheckOut      = form.checkIn
    ? new Date(new Date(form.checkIn).getTime() + 86400000).toISOString().split('T')[0]
    : todayISO()

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM)
      setError(null)
      setAvailability('unknown')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  // Auto-fill price when property/room changes
  useEffect(() => {
    if (!selectedProperty) return
    const room = selectedProperty.rooms.find((r) => r.id === form.roomId)
    setForm((prev) => ({
      ...prev,
      pricePerNight:   room ? room.pricePerNight : selectedProperty.pricePerNight,
      cleaningFee:     selectedProperty.cleaningFee,
      securityDeposit: selectedProperty.securityDeposit,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.propertyId, form.roomId])

  // Check availability when dates + property are set
  useEffect(() => {
    if (!form.propertyId || !form.checkIn || !form.checkOut || nights <= 0) {
      setAvailability('unknown')
      return
    }

    const target = form.roomId || form.propertyId
    const isRoom = !!form.roomId

    setChecking(true)
    const params = new URLSearchParams({
      ...(isRoom ? { roomId: target } : { propertyId: target }),
      startDate: form.checkIn,
      endDate:   form.checkOut,
    })

    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setAvailability(json.data?.available === true ? 'available' : 'unavailable')
      })
      .catch(() => setAvailability('unknown'))
      .finally(() => setChecking(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.propertyId, form.roomId, form.checkIn, form.checkOut])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nights <= 0) { setError('As datas são inválidas.'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/reservations/manual', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId:      form.propertyId,
          roomId:          form.roomId   || undefined,
          guestName:       form.guestName,
          guestEmail:      form.guestEmail,
          guestPhone:      form.guestPhone      || undefined,
          guestCountry:    form.guestCountry    || undefined,
          guestCount:      form.guestCount,
          checkIn:         form.checkIn,
          checkOut:        form.checkOut,
          pricePerNight:   form.pricePerNight,
          cleaningFee:     form.cleaningFee,
          securityDeposit: form.securityDeposit,
          paymentStatus:   form.paymentStatus,
          guestMessage:    form.guestMessage    || undefined,
          ownerNotes:      form.ownerNotes      || undefined,
        }),
      })

      const json = await res.json() as { data: unknown; error: string | null }

      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erro ao criar reserva.')
        return
      }

      onCreated()
      onClose()
    } catch {
      setError('Erro de ligação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-extrabold text-[#1a1a2e] tracking-tight flex items-center gap-2">
            <Plus size={18} className="text-[#8b1a1a]" />
            Nova Reserva Manual
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-6">

            {/* ── Unidade ─────────────────────────────────────────────── */}
            <Section title="Unidade" icon="home_work">
              <div>
                <Label required>Propriedade</Label>
                <select
                  required
                  value={form.propertyId}
                  onChange={(e) => setForm((p) => ({ ...p, propertyId: e.target.value, roomId: '' }))}
                  className={selectCls}
                >
                  <option value="">Selecionar propriedade...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {selectedProperty?.hasRooms && selectedProperty.rooms.length > 0 && (
                <div>
                  <Label>Quarto</Label>
                  <select
                    value={form.roomId}
                    onChange={(e) => set('roomId', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Selecionar quarto...</option>
                    {selectedProperty.rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.type === 'ENTIRE_PLACE' ? '(Alojamento completo)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </Section>

            {/* ── Datas ───────────────────────────────────────────────── */}
            <Section title="Datas" icon="calendar_month">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Check-in</Label>
                  <input
                    type="date"
                    required
                    min={todayISO()}
                    value={form.checkIn}
                    onChange={(e) => {
                      const ci = e.target.value
                      setForm((p) => ({
                        ...p,
                        checkIn:  ci,
                        checkOut: p.checkOut && p.checkOut <= ci ? '' : p.checkOut,
                      }))
                    }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label required>Check-out</Label>
                  <input
                    type="date"
                    required
                    min={minCheckOut}
                    value={form.checkOut}
                    onChange={(e) => set('checkOut', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {nights > 0 && (
                <p className="text-xs font-semibold text-slate-500">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">nights_stay</span>
                  {nights} noite{nights !== 1 ? 's' : ''}
                </p>
              )}

              {/* Availability indicator */}
              {checking && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  A verificar disponibilidade...
                </p>
              )}
              {!checking && availability === 'unavailable' && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-xs font-semibold">
                  <span className="material-symbols-outlined text-base">warning</span>
                  Existem reservas nestas datas
                </div>
              )}
              {!checking && availability === 'available' && nights > 0 && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Datas disponíveis
                </p>
              )}
            </Section>

            {/* ── Hóspede ─────────────────────────────────────────────── */}
            <Section title="Hóspede" icon="person">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label required>Nome completo</Label>
                  <input
                    type="text"
                    required
                    value={form.guestName}
                    onChange={(e) => set('guestName', e.target.value)}
                    placeholder="ex: João Silva"
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label required>Email</Label>
                  <input
                    type="email"
                    required
                    value={form.guestEmail}
                    onChange={(e) => set('guestEmail', e.target.value)}
                    placeholder="joao@email.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <input
                    type="tel"
                    value={form.guestPhone}
                    onChange={(e) => set('guestPhone', e.target.value)}
                    placeholder="+351 912 345 678"
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label required>Nº de hóspedes</Label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={form.guestCount}
                    onChange={(e) => set('guestCount', Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label>País</Label>
                  <select
                    value={form.guestCountry}
                    onChange={(e) => set('guestCountry', e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Selecionar país...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label>Mensagem / Notas</Label>
                  <textarea
                    rows={3}
                    value={form.guestMessage}
                    onChange={(e) => set('guestMessage', e.target.value)}
                    placeholder="Notas internas sobre esta reserva..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </Section>

            {/* ── Pagamento ───────────────────────────────────────────── */}
            <Section title="Pagamento" icon="payments">
              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <Label>Taxa de limpeza (€)</Label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.cleaningFee}
                    onChange={(e) => set('cleaningFee', Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label>Depósito de segurança (€)</Label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.securityDeposit}
                    onChange={(e) => set('securityDeposit', Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label required>Estado de pagamento</Label>
                  <select
                    required
                    value={form.paymentStatus}
                    onChange={(e) => set('paymentStatus', e.target.value as 'PAID' | 'UNPAID')}
                    className={selectCls}
                  >
                    <option value="PAID">Pago</option>
                    <option value="UNPAID">Sem pagamento</option>
                  </select>
                </div>
              </div>

              {/* Total */}
              {nights > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Total calculado</span>
                  <span className="text-base font-extrabold text-[#1a1a2e]">
                    {fmtCurrency(total)}
                  </span>
                </div>
              )}

              <div>
                <Label>Notas do proprietário</Label>
                <textarea
                  rows={2}
                  value={form.ownerNotes}
                  onChange={(e) => set('ownerNotes', e.target.value)}
                  placeholder="Notas privadas sobre esta reserva..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </Section>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                {error}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-booking-form"
            disabled={loading || !form.propertyId || !form.checkIn || !form.checkOut || nights <= 0}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-[#8b1a1a] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                A criar...
              </>
            ) : (
              <>
                <Plus size={15} />
                Criar Reserva
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]'

const selectCls =
  'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] bg-white'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
    <div className="space-y-3">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
        <span className="material-symbols-outlined text-[#8b1a1a] text-base">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}
