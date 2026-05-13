'use client'

import { useState } from 'react'
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2, X, Check } from 'lucide-react'
import { sileo } from 'sileo'

// ─── Types ────────────────────────────────────────────────────────────────────

type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FIRST_BOOKING' | 'MULTIPLE_USE'

interface Coupon {
  id: string
  code: string
  type: CouponType
  discountValue: number
  description: string | null
  maxUses: number | null
  minNights: number | null
  minOrderAmount: number | null
  expiresAt: string | null
  isActive: boolean
  currentUses: number
  createdAt: string
  totalDiscount: number
}

interface CreateForm {
  code: string
  type: CouponType
  discountValue: string
  description: string
  maxUses: string
  minNights: string
  minOrderAmount: string
  expiresAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<CouponType, string> = {
  PERCENTAGE: 'Percentagem',
  FIXED_AMOUNT: 'Valor fixo',
  FIRST_BOOKING: '1ª reserva',
  MULTIPLE_USE: 'Multi-uso',
}

const TYPE_COLORS: Record<CouponType, string> = {
  PERCENTAGE: 'bg-blue-100 text-blue-700',
  FIXED_AMOUNT: 'bg-purple-100 text-purple-700',
  FIRST_BOOKING: 'bg-amber-100 text-amber-700',
  MULTIPLE_USE: 'bg-teal-100 text-teal-700',
}

function formatDiscount(type: CouponType, value: number): string {
  if (type === 'FIXED_AMOUNT') return `€${value.toFixed(0)}`
  if (type === 'MULTIPLE_USE') return value < 100 ? `${value}%` : `€${value.toFixed(0)}`
  return `${value}%`
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const BLANK_FORM: CreateForm = {
  code: '',
  type: 'PERCENTAGE',
  discountValue: '',
  description: '',
  maxUses: '',
  minNights: '',
  minOrderAmount: '',
  expiresAt: '',
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (coupon: Coupon) => void
}) {
  const [form, setForm] = useState<CreateForm>(BLANK_FORM)
  const [saving, setSaving] = useState(false)

  function set(key: keyof CreateForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const createPromise = async () => {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        discountValue: parseFloat(form.discountValue),
        description: form.description.trim() || undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        minNights: form.minNights ? parseInt(form.minNights) : undefined,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
        expiresAt: form.expiresAt || undefined,
      }

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const json = await res.json() as { data: { coupon: Coupon } | null; error: unknown }
      
      if (!res.ok || json.error || !json.data) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Erro ao criar cupão')
      }

      const newCoupon: Coupon = {
        ...json.data.coupon,
        totalDiscount: 0,
        discountValue: Number(json.data.coupon.discountValue),
        minOrderAmount: json.data.coupon.minOrderAmount ? Number(json.data.coupon.minOrderAmount) : null,
      }

      onCreated(newCoupon)
      return newCoupon
    }

    sileo.promise(createPromise(), {
      loading: { title: 'A criar cupão...' },
      success: { 
        title: 'Cupão criado!', 
        description: `O código ${form.code.toUpperCase()} já está ativo` 
      },
      error: (err: unknown) => ({
        title: 'Erro ao criar',
        description: err instanceof Error ? err.message : 'Tente novamente'
      })
    })
    .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[17px] font-bold text-[#1a1a2e]">Criar cupão</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Code */}
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              Código *
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="Ex: VERAO25"
              required
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] font-mono focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              Tipo *
            </label>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value as CouponType)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] bg-white focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
            >
              <option value="PERCENTAGE">Percentagem (%)</option>
              <option value="FIXED_AMOUNT">Valor fixo (€)</option>
              <option value="FIRST_BOOKING">Primeira reserva (%)</option>
              <option value="MULTIPLE_USE">Multi-uso (% ou €)</option>
            </select>
          </div>

          {/* Discount value */}
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              Valor do desconto *
              {(form.type === 'PERCENTAGE' || form.type === 'FIRST_BOOKING') && ' (%)'}
              {form.type === 'FIXED_AMOUNT' && ' (€)'}
              {form.type === 'MULTIPLE_USE' && ' (% se < 100, € se ≥ 100)'}
            </label>
            <input
              type="number"
              value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              placeholder="Ex: 10"
              required
              min="0.01"
              step="0.01"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Ex: Desconto de verão"
              maxLength={200}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
            />
          </div>

          {/* Optional fields row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Máx. utilizações
              </label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => set('maxUses', e.target.value)}
                placeholder="Ilimitado"
                min="1"
                step="1"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Mín. noites
              </label>
              <input
                type="number"
                value={form.minNights}
                onChange={(e) => set('minNights', e.target.value)}
                placeholder="Sem mínimo"
                min="1"
                step="1"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Valor mínimo (€)
              </label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => set('minOrderAmount', e.target.value)}
                placeholder="Sem mínimo"
                min="0.01"
                step="0.01"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Expira em
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => set('expiresAt', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-[14px] bg-white focus:outline-none focus:border-[#8b1a1a] focus:ring-2 focus:ring-[#8b1a1a]/20 transition"
              />
            </div>
          </div>

          {/* error box removed — replaced by sileo */}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-300 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-[#8b1a1a] text-white text-[14px] font-bold hover:bg-[#6d1414] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={16} />
                  Criar cupão
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Client Component ─────────────────────────────────────────────────────

export default function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [showModal, setShowModal] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleToggle(id: string) {
    setToggling(id)
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'PATCH' })
      const json = await res.json() as { data: { coupon: Coupon } | null; error: string | null }
      if (json.data?.coupon) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: json.data!.coupon.isActive } : c)),
        )
      }
    } catch {
      // silently fail — UI stays consistent
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Eliminar cupão "${code}"? Esta ação é irreversível.`)) return
    const deletePromise = async () => {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' })
      const json = await res.json() as { data: unknown; error: string | null }
      
      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Não foi possível eliminar o cupão')
      }
      
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      return true
    }

    sileo.promise(deletePromise(), {
      loading: { title: 'A eliminar cupão...' },
      success: { 
        title: 'Cupão eliminado', 
        description: `O código ${code} foi removido com sucesso` 
      },
      error: (err: unknown) => ({
        title: 'Erro ao eliminar',
        description: err instanceof Error ? err.message : 'Tente novamente'
      })
    })
    .finally(() => setDeleting(null))
  }

  function handleCreated(coupon: Coupon) {
    setCoupons((prev) => [coupon, ...prev])
    setShowModal(false)
  }

  const totalDiscountGenerated = coupons.reduce((sum, c) => sum + c.totalDiscount, 0)
  const activeCoupons = coupons.filter((c) => c.isActive).length

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag size={22} className="text-[#8b1a1a]" />
            <h1 className="text-[24px] font-bold text-[#1a1a2e]">Cupões de desconto</h1>
          </div>
          <p className="text-[14px] text-slate-500">Gerir códigos promocionais para as suas reservas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#8b1a1a] text-white text-[14px] font-semibold hover:bg-[#6d1414] transition shadow-sm"
        >
          <Plus size={16} />
          Criar cupão
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Total de cupões</p>
          <p className="text-[28px] font-bold text-[#1a1a2e]">{coupons.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Cupões ativos</p>
          <p className="text-[28px] font-bold text-emerald-600">{activeCoupons}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Desconto total gerado</p>
          <p className="text-[28px] font-bold text-[#8b1a1a]">{formatCurrency(totalDiscountGenerated)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tag size={40} className="text-slate-300 mb-3" />
            <p className="text-[15px] font-medium text-slate-500">Ainda não existem cupões</p>
            <p className="text-[13px] text-slate-400 mt-1">Clique em "Criar cupão" para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Desconto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Utilizações</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Desconto total</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Expira</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {coupons.map((c) => {
                  const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false
                  const isExhausted = c.maxUses !== null && c.currentUses >= c.maxUses
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      {/* Code */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-[#1a1a2e] tracking-wide">{c.code}</span>
                        {c.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{c.description}</p>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${TYPE_COLORS[c.type]}`}>
                          {TYPE_LABELS[c.type]}
                        </span>
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-4 font-semibold text-[#1a1a2e]">
                        {formatDiscount(c.type, c.discountValue)}
                      </td>

                      {/* Uses */}
                      <td className="px-4 py-4 text-slate-600">
                        {c.currentUses}
                        {c.maxUses !== null && (
                          <span className="text-slate-400"> / {c.maxUses}</span>
                        )}
                      </td>

                      {/* Total discount */}
                      <td className="px-4 py-4 text-slate-600">
                        {formatCurrency(c.totalDiscount)}
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-4">
                        {c.expiresAt ? (
                          <span className={isExpired ? 'text-red-500 font-medium' : 'text-slate-600'}>
                            {formatDate(c.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(c.id)}
                            disabled={toggling === c.id}
                            className="flex items-center gap-1.5 transition-opacity disabled:opacity-50"
                            title={c.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {c.isActive ? (
                              <ToggleRight size={22} className="text-emerald-500" />
                            ) : (
                              <ToggleLeft size={22} className="text-slate-400" />
                            )}
                          </button>
                          {(isExpired || isExhausted) && (
                            <span className="text-[10px] font-semibold text-red-500 uppercase">
                              {isExpired ? 'Expirado' : 'Esgotado'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          disabled={deleting === c.id}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Eliminar cupão"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <CreateModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
