'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyData {
  id:                 string
  title:              string
  description:        string
  address:            string
  city:               string
  zipCode:            string | null
  pricePerNight:      number
  cleaningFee:        number
  maxGuests:          number
  bedrooms:           number
  bathrooms:          number
  beds:               number
  accessCode:         string | null
  wifiName:           string | null
  wifiPassword:       string | null
  floor:              string | null
  accessInstructions: string | null
  contactPhone:       string | null
}

interface Props {
  property: PropertyData
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyEditForm({ property: initial }: Props) {
  const router  = useRouter()
  const [form,  setForm]  = useState(initial)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]  = useState<'success' | 'error' | null>(null)
  const [showWifiPass, setShowWifiPass] = useState(false)

  function field(name: keyof PropertyData) {
    return {
      name,
      value:    (form[name] ?? '') as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [name]: e.target.value })),
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    try {
      const res = await fetch(`/api/properties/${form.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:              form.title,
          description:        form.description,
          address:            form.address,
          city:               form.city,
          zipCode:            form.zipCode || null,
          pricePerNight:      Number(form.pricePerNight),
          cleaningFee:        Number(form.cleaningFee),
          maxGuests:          Number(form.maxGuests),
          bedrooms:           Number(form.bedrooms),
          bathrooms:          Number(form.bathrooms),
          beds:               Number(form.beds),
          accessCode:         form.accessCode         || null,
          wifiName:           form.wifiName           || null,
          wifiPassword:       form.wifiPassword       || null,
          floor:              form.floor              || null,
          accessInstructions: form.accessInstructions || null,
          contactPhone:       form.contactPhone       || null,
        }),
      })

      if (res.ok) {
        setToast('success')
        router.refresh()
      } else {
        setToast('error')
      }
    } catch {
      setToast('error')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
          toast === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <span className="material-symbols-outlined text-base">
            {toast === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast === 'success' ? 'Guardado com sucesso!' : 'Erro ao guardar. Tente novamente.'}
        </div>
      )}

      {/* ── Informações Gerais ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">Informações Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Título</Label>
            <Input {...field('title')} required />
          </div>
          <div className="md:col-span-2">
            <Label>Descrição</Label>
            <textarea
              {...field('description')}
              rows={4}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input {...field('address')} required />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input {...field('city')} required />
          </div>
          <div>
            <Label>Código Postal</Label>
            <Input {...field('zipCode')} />
          </div>
          <div>
            <Label>Preço / Noite (€)</Label>
            <Input {...field('pricePerNight')} type="number" min="0" step="0.01" required />
          </div>
          <div>
            <Label>Taxa de Limpeza (€)</Label>
            <Input {...field('cleaningFee')} type="number" min="0" step="0.01" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Hóspedes máx.</Label>
            <Input {...field('maxGuests')} type="number" min="1" required />
          </div>
          <div>
            <Label>Quartos</Label>
            <Input {...field('bedrooms')} type="number" min="0" required />
          </div>
          <div>
            <Label>Casas de banho</Label>
            <Input {...field('bathrooms')} type="number" min="0" required />
          </div>
        </div>
      </section>

      {/* ── Dados de Acesso ────────────────────────────────────────────────── */}
      <section id="access">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#8b1a1a]">key</span>
          <h2 className="text-lg font-bold text-[#1a1a2e]">Dados de Acesso</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Estes dados são partilhados automaticamente com os hóspedes no check-in.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Código da caixa de chaves</Label>
            <Input {...field('accessCode')} placeholder="Ex: 1234#" />
          </div>
          <div>
            <Label>Nome da rede WiFi</Label>
            <Input {...field('wifiName')} placeholder="Ex: Casa_Chiado_5G" />
          </div>
          <div>
            <Label>Password do WiFi</Label>
            <div className="relative">
              <input
                {...field('wifiPassword')}
                type={showWifiPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowWifiPass(!showWifiPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-lg">
                  {showWifiPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div>
            <Label>Piso e porta</Label>
            <Input {...field('floor')} placeholder="Ex: 3º Dto" />
          </div>
          <div>
            <Label>Telefone de contacto</Label>
            <Input {...field('contactPhone')} type="tel" placeholder="Ex: +351 912 345 678" />
          </div>
          <div className="md:col-span-2">
            <Label>Instruções de chegada</Label>
            <textarea
              {...field('accessInstructions')}
              rows={4}
              placeholder="Ex: Entre pelo portão principal, suba as escadas e é o segundo apartamento à esquerda..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
          </div>
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a2e] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'A guardar...' : 'Guardar alterações'}
          <span className="material-symbols-outlined text-base">save</span>
        </button>
      </div>
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
    />
  )
}
