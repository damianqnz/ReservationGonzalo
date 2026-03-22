'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Room { id: string; name: string }

interface SeasonalPrice {
  id: string
  name: string
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  pricePerNight: number
  minNights: number | null
  roomId: string | null
}

interface PricingRule {
  id: string
  type: 'WEEKEND_MARKUP' | 'LONG_STAY_DISCOUNT' | 'MINIMUM_PRICE'
  value: number
  isPercentage: boolean
}

interface PriceBreakdown {
  nights: number
  baseSubtotal: number
  weekendNights: number
  weekendMarkup: number
  subtotal: number
  longStayDiscount: number
  totalPrice: number
  pricePerNight: number
}

interface Props {
  propertyId: string
  propertyTitle: string
  basePrice: number
  initialRooms: Room[]
  initialSeasonalPrices: SeasonalPrice[]
  initialPricingRules: PricingRule[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

const RULE_META = {
  WEEKEND_MARKUP:     { label: 'Suplemento fim de semana',         hint: '% ou € adicionada por noite de sexta/sábado' },
  LONG_STAY_DISCOUNT: { label: 'Desconto estadia longa (7+ noites)', hint: '% ou € descontados do total' },
  MINIMUM_PRICE:      { label: 'Preço mínimo por noite',            hint: 'Preço mínimo em € por noite (isPercentage ignorado)' },
}

// ─── Seasonal Price Form ───────────────────────────────────────────────────────

type SeasonalForm = {
  name: string; startDate: string; endDate: string
  pricePerNight: string; minNights: string; roomId: string
}

const EMPTY_SEASONAL: SeasonalForm = {
  name: '', startDate: '', endDate: '', pricePerNight: '', minNights: '', roomId: '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingClient({
  propertyId, propertyTitle, basePrice,
  initialRooms, initialSeasonalPrices, initialPricingRules,
}: Props) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>(initialSeasonalPrices)
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(initialPricingRules)
  const [rooms] = useState<Room[]>(initialRooms)

  // Seasonal form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SeasonalForm>(EMPTY_SEASONAL)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Rule editing
  const [ruleValues, setRuleValues] = useState<Record<string, { value: string; isPercentage: boolean }>>(() => {
    const init: Record<string, { value: string; isPercentage: boolean }> = {}
    for (const rule of initialPricingRules) {
      init[rule.type] = { value: String(rule.value), isPercentage: rule.isPercentage }
    }
    return init
  })
  const [ruleLoading, setRuleLoading] = useState<string | null>(null)
  const [ruleError, setRuleError] = useState<string | null>(null)

  // Simulator
  const [simCheckIn, setSimCheckIn] = useState('')
  const [simCheckOut, setSimCheckOut] = useState('')
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState<PriceBreakdown | null>(null)
  const [simError, setSimError] = useState<string | null>(null)

  // ── Seasonal price CRUD ────────────────────────────────────────────────────

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_SEASONAL)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(s: SeasonalPrice) {
    setEditingId(s.id)
    setForm({
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      pricePerNight: String(s.pricePerNight),
      minNights: s.minNights ? String(s.minNights) : '',
      roomId: s.roomId ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSeasonalSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    const payload = {
      kind: 'seasonal',
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      pricePerNight: parseFloat(form.pricePerNight),
      ...(form.minNights ? { minNights: parseInt(form.minNights) } : {}),
      ...(form.roomId ? { roomId: form.roomId } : {}),
    }

    try {
      const isEdit = Boolean(editingId)
      const url = isEdit
        ? `/api/properties/${propertyId}/pricing/${editingId}`
        : `/api/properties/${propertyId}/pricing`
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        setFormError(typeof json.error === 'string' ? json.error : 'Erro ao guardar temporada.')
        return
      }

      if (isEdit) {
        setSeasonalPrices((prev) => prev.map((s) => (s.id === editingId ? json.data : s)))
      } else {
        setSeasonalPrices((prev) => [...prev, json.data])
      }
      closeForm()
    } catch {
      setFormError('Erro de ligação.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleSeasonalDelete(id: string) {
    if (!confirm('Eliminar esta temporada?')) return
    try {
      const res = await fetch(`/api/properties/${propertyId}/pricing/${id}?kind=seasonal`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSeasonalPrices((prev) => prev.filter((s) => s.id !== id))
      }
    } catch {
      // silent
    }
  }

  // ── Pricing rules ──────────────────────────────────────────────────────────

  function getRuleValue(type: string) {
    return ruleValues[type] ?? { value: '', isPercentage: true }
  }

  function isRuleActive(type: string) {
    return pricingRules.some((r) => r.type === type)
  }

  async function handleRuleToggle(type: PricingRule['type']) {
    if (isRuleActive(type)) {
      // Delete rule
      const rule = pricingRules.find((r) => r.type === type)
      if (!rule) return
      setRuleLoading(type)
      try {
        const res = await fetch(`/api/properties/${propertyId}/pricing/${rule.id}?kind=rule`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setPricingRules((prev) => prev.filter((r) => r.type !== type))
          setRuleValues((prev) => { const n = { ...prev }; delete n[type]; return n })
        }
      } catch { /* silent */ }
      setRuleLoading(null)
    } else {
      // Activate with default values
      setRuleValues((prev) => ({
        ...prev,
        [type]: prev[type] ?? {
          value: type === 'MINIMUM_PRICE' ? '50' : '10',
          isPercentage: type !== 'MINIMUM_PRICE',
        },
      }))
      // Just show the fields — user saves explicitly
    }
  }

  async function handleRuleSave(type: PricingRule['type']) {
    const rv = ruleValues[type]
    if (!rv) return
    const value = parseFloat(rv.value)
    if (isNaN(value) || value < 0) return

    setRuleLoading(type)
    setRuleError(null)
    try {
      const res = await fetch(`/api/properties/${propertyId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'rule',
          type,
          value,
          isPercentage: type === 'MINIMUM_PRICE' ? false : rv.isPercentage,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setRuleError(typeof json.error === 'string' ? json.error : 'Erro ao guardar regra.')
      } else {
        setPricingRules((prev) => {
          const without = prev.filter((r) => r.type !== type)
          return [...without, json.data]
        })
      }
    } catch {
      setRuleError('Erro de ligação.')
    }
    setRuleLoading(null)
  }

  // ── Simulator ──────────────────────────────────────────────────────────────

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault()
    if (!simCheckIn || !simCheckOut) return
    setSimLoading(true)
    setSimError(null)
    setSimResult(null)
    try {
      const params = new URLSearchParams({ propertyId, checkIn: simCheckIn, checkOut: simCheckOut })
      const res = await fetch(`/api/pricing?${params.toString()}`)
      const json = await res.json()
      if (!res.ok || !json.data) {
        setSimError(typeof json.error === 'string' ? json.error : 'Erro no simulador.')
      } else {
        setSimResult(json.data)
      }
    } catch {
      setSimError('Erro de ligação.')
    }
    setSimLoading(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/properties"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {propertyTitle}
          </p>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Gestão de Preços</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Preço base: {fmtCurrency(basePrice)}/noite
          </p>
        </div>
      </div>

      {/* ── Section 1: Seasonal Prices ───────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1a1a2e]">Preços por temporada</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina preços especiais para períodos específicos (ex: verão, natal).
            </p>
          </div>
          {!showForm && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#8b1a1a] border border-[#8b1a1a]/30 rounded-lg px-4 py-2 hover:bg-[#8b1a1a]/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Adicionar temporada
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSeasonalSubmit}
            className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50"
          >
            <h4 className="text-sm font-bold text-[#1a1a2e]">
              {editingId ? 'Editar temporada' : 'Nova temporada'}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="ex: Verão 2026"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Data de início <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Data de fim <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Preço/noite (€) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.pricePerNight}
                  onChange={(e) => setForm((p) => ({ ...p, pricePerNight: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mín. noites (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.minNights}
                  onChange={(e) => setForm((p) => ({ ...p, minNights: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
                />
              </div>
            </div>

            {rooms.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Aplicar a
                </label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] bg-white"
                >
                  <option value="">Toda a propriedade</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {formError && (
              <p className="text-xs text-red-600">{formError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={formLoading}
                className="bg-[#8b1a1a] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {formLoading ? 'A guardar…' : editingId ? 'Guardar alterações' : 'Criar temporada'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* List */}
        {seasonalPrices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhuma temporada configurada.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {seasonalPrices.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a2e] truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmtDate(s.startDate)} — {fmtDate(s.endDate)}
                    {s.minNights ? ` · mín. ${s.minNights} noite${s.minNights !== 1 ? 's' : ''}` : ''}
                    {s.roomId ? ` · ${rooms.find((r) => r.id === s.roomId)?.name ?? 'Quarto'}` : ' · Toda a propriedade'}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#1a1a2e] shrink-0">
                  {fmtCurrency(s.pricePerNight)}/noite
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleSeasonalDelete(s.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition text-slate-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Pricing Rules ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#1a1a2e]">Regras de preço</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ative e configure suplementos e descontos automáticos.
          </p>
        </div>

        {ruleError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {ruleError}
          </p>
        )}

        <div className="space-y-4">
          {(['WEEKEND_MARKUP', 'LONG_STAY_DISCOUNT', 'MINIMUM_PRICE'] as const).map((type) => {
            const meta = RULE_META[type]
            const active = isRuleActive(type)
            const rv = getRuleValue(type)
            const showFields = active || ruleValues[type] !== undefined
            const isMin = type === 'MINIMUM_PRICE'

            return (
              <div
                key={type}
                className={`border rounded-xl p-4 transition-colors ${active ? 'border-[#8b1a1a]/30 bg-red-50/30' : 'border-slate-200'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a1a2e]">{meta.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{meta.hint}</p>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleRuleToggle(type)}
                    disabled={ruleLoading === type}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                      active ? 'bg-[#8b1a1a]' : 'bg-slate-200'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {showFields && (
                  <div className="mt-3 flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {isMin ? 'Valor mínimo (€)' : rv.isPercentage ? 'Percentagem (%)' : 'Valor fixo (€)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={isMin ? 1 : 0.1}
                        value={rv.value}
                        onChange={(e) =>
                          setRuleValues((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], value: e.target.value },
                          }))
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
                      />
                    </div>

                    {!isMin && (
                      <div className="flex items-center gap-2 pb-0.5">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rv.isPercentage}
                            onChange={(e) =>
                              setRuleValues((prev) => ({
                                ...prev,
                                [type]: { ...prev[type], isPercentage: e.target.checked },
                              }))
                            }
                            className="accent-[#8b1a1a] w-4 h-4"
                          />
                          <span className="text-xs text-slate-600">%</span>
                        </label>
                      </div>
                    )}

                    <button
                      onClick={() => handleRuleSave(type)}
                      disabled={ruleLoading === type}
                      className="shrink-0 bg-[#8b1a1a] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {ruleLoading === type ? '…' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 3: Price Simulator ───────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#1a1a2e]">Simulador de preço</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calcule o preço final para um período de datas com as regras atuais.
          </p>
        </div>

        <form onSubmit={handleSimulate} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Check-in</label>
            <input
              required
              type="date"
              value={simCheckIn}
              onChange={(e) => { setSimCheckIn(e.target.value); setSimResult(null) }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Check-out</label>
            <input
              required
              type="date"
              value={simCheckOut}
              onChange={(e) => { setSimCheckOut(e.target.value); setSimResult(null) }}
              min={simCheckIn}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a]"
            />
          </div>
          <button
            type="submit"
            disabled={simLoading}
            className="bg-[#8b1a1a] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {simLoading ? 'A calcular…' : 'Calcular'}
          </button>
        </form>

        {simError && (
          <p className="text-xs text-red-600">{simError}</p>
        )}

        {simResult && (
          <div className="border border-slate-200 rounded-xl p-5 space-y-2.5 bg-slate-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Detalhes do preço — {simResult.nights} noite{simResult.nights !== 1 ? 's' : ''}
            </h4>

            <div className="flex justify-between text-sm text-slate-600">
              <span>
                {fmtCurrency(simResult.baseSubtotal / simResult.nights)} × {simResult.nights} noite{simResult.nights !== 1 ? 's' : ''}
              </span>
              <span>{fmtCurrency(simResult.baseSubtotal)}</span>
            </div>

            {simResult.weekendMarkup > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Suplemento fim de semana ({simResult.weekendNights} noite{simResult.weekendNights !== 1 ? 's' : ''})</span>
                <span>+{fmtCurrency(simResult.weekendMarkup)}</span>
              </div>
            )}

            {simResult.longStayDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Desconto estadia longa</span>
                <span>−{fmtCurrency(simResult.longStayDiscount)}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2.5 flex justify-between">
              <span className="text-sm font-bold text-[#1a1a2e]">
                Total alojamento
              </span>
              <span className="text-sm font-bold text-[#1a1a2e]">
                {fmtCurrency(simResult.totalPrice)}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Média: {fmtCurrency(simResult.pricePerNight)}/noite
              {' · '}Taxa de limpeza e depósito adicionados na reserva.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
