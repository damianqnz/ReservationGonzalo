'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sileo } from 'sileo'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccessData {
  id:                 string
  title:              string
  accessCode:         string | null
  wifiName:           string | null
  wifiPassword:       string | null
  floor:              string | null
  accessInstructions: string | null
  contactPhone:       string | null
}

interface Props {
  property: AccessData
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccessForm({ property: initial }: Props) {
  const router = useRouter()

  const [form, setForm] = useState({
    accessCode:         initial.accessCode         ?? '',
    wifiName:           initial.wifiName           ?? '',
    wifiPassword:       initial.wifiPassword       ?? '',
    floor:              initial.floor              ?? '',
    accessInstructions: initial.accessInstructions ?? '',
    contactPhone:       initial.contactPhone       ?? '',
  })
  const [saving,       setSaving]       = useState(false)
  const [showWifiPass, setShowWifiPass] = useState(false)

  function field(name: keyof typeof form) {
    return {
      name,
      value:    form[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [name]: e.target.value })),
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const savePromise = async () => {
      const res = await fetch(`/api/properties/${initial.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode:         form.accessCode         || null,
          wifiName:           form.wifiName           || null,
          wifiPassword:       form.wifiPassword       || null,
          floor:              form.floor              || null,
          accessInstructions: form.accessInstructions || null,
          contactPhone:       form.contactPhone       || null,
        }),
      })

      if (!res.ok) throw new Error('Erro ao guardar')
      router.refresh()
      return res
    }

    sileo.promise(savePromise(), {
      loading: { title: 'A guardar...' },
      success: { 
        title: 'Dados guardados!', 
        description: 'Informações de acesso atualizadas' 
      },
      error: { 
        title: 'Erro', 
        description: 'Não foi possível guardar os dados de acesso' 
      }
    })
    .finally(() => setSaving(false))
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Access code */}
        <div>
          <Label>Código da caixa de chaves</Label>
          <Input {...field('accessCode')} placeholder="Ex: 1234#" />
        </div>

        {/* WiFi name */}
        <div>
          <Label>Nome da rede WiFi</Label>
          <Input {...field('wifiName')} placeholder="Ex: Casa_Chiado_5G" />
        </div>

        {/* WiFi password */}
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
              onClick={() => setShowWifiPass((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-lg">
                {showWifiPass ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Floor */}
        <div>
          <Label>Piso e porta</Label>
          <Input {...field('floor')} placeholder="Ex: 3º Dto" />
        </div>

        {/* Contact phone */}
        <div>
          <Label>Telefone de contacto</Label>
          <Input {...field('contactPhone')} type="tel" placeholder="Ex: +351 912 345 678" />
        </div>

        {/* Instructions — full width */}
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

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push('/dashboard/properties')}
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
