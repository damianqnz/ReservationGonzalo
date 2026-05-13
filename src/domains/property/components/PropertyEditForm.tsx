'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { sileo } from 'sileo'
import BedPicker from '@/domains/room/components/BedPicker'
import ServicesChecklist from '@/domains/room/components/ServicesChecklist'
import ToggleSwitch from '@/shared/components/ui/ToggleSwitch'

const PropertyMapWrapper = dynamic(() => import('@/domains/property/components/PropertyMapWrapper'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] bg-slate-100 rounded-lg animate-pulse" />
  ),
})

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
  hasRooms:           boolean
  bedsConfig:         string | null
  bathroomType:       string | null
  services:           string | null
  accessCode:         string | null
  wifiName:           string | null
  wifiPassword:       string | null
  floor:              string | null
  accessInstructions: string | null
  contactPhone:       string | null
  latitude:           number | null
  longitude:          number | null
  // New fields
  arrivalType:        string | null
  floors:             number | null
  hasElevator:        boolean
  towelsIncluded:     boolean
  petsAllowed:        boolean
  childrenAllowed:    boolean
  smokingAllowed:     boolean
  spaceDescription:   string | null
  accessInfo:         string | null
  interactionInfo:    string | null
  additionalInfo:     string | null
  parkingInfo:        string | null
  extraServices:      string | null
  houseRules:         string | null
  cancellationDays:   number | null
  licenseNumber:      string | null
  hostDescription:    string | null
}

interface Props {
  property: PropertyData
}

// ─── Component ────────────────────────────────────────────────────────────────

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

export default function PropertyEditForm({ property: initial }: Props) {
  const router  = useRouter()
  const [form,  setForm]  = useState(initial)
  const [saving, setSaving] = useState(false)
  const [showWifiPass, setShowWifiPass] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [bedsList,  setBedsList]  = useState<string[]>(() => parseJsonArray(initial.bedsConfig))
  const [services,  setServices]  = useState<string[]>(() => parseJsonArray(initial.services))
  const [bathroomType, setBathroomType] = useState(initial.bathroomType ?? 'private')

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
    
    const savePromise = async () => {
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
          ...(!form.hasRooms && {
            bedsConfig:   JSON.stringify(bedsList),
            bathroomType,
            services:     JSON.stringify(services),
          }),
          accessCode:         form.accessCode         || null,
          wifiName:           form.wifiName           || null,
          wifiPassword:       form.wifiPassword       || null,
          floor:              form.floor              || null,
          accessInstructions: form.accessInstructions || null,
          contactPhone:       form.contactPhone       || null,
          latitude:           form.latitude  ?? null,
          longitude:          form.longitude ?? null,
          // New fields
          arrivalType:        form.arrivalType || null,
          floors:             form.floors ? Number(form.floors) : null,
          hasElevator:        form.hasElevator,
          towelsIncluded:     form.towelsIncluded,
          petsAllowed:        form.petsAllowed,
          childrenAllowed:    form.childrenAllowed,
          smokingAllowed:     form.smokingAllowed,
          spaceDescription:   form.spaceDescription || null,
          accessInfo:         form.accessInfo || null,
          interactionInfo:    form.interactionInfo || null,
          additionalInfo:     form.additionalInfo || null,
          parkingInfo:        form.parkingInfo || null,
          extraServices:      form.extraServices || null,
          houseRules:         form.houseRules || null,
          cancellationDays:   form.cancellationDays ? Number(form.cancellationDays) : 0,
          licenseNumber:      form.licenseNumber || null,
          hostDescription:    form.hostDescription || null,
        }),
      })

      if (!res.ok) throw new Error('Erro ao guardar')
      router.refresh()
      return res
    }

    sileo.promise(savePromise(), {
      loading: { title: 'A guardar...' },
      success: { 
        title: 'Guardado!', 
        description: 'Propriedade atualizada com sucesso' 
      },
      error: { 
        title: 'Erro', 
        description: 'Não foi possível guardar as alterações' 
      }
    })
    .finally(() => setSaving(false))
  }

  async function handleGeocode() {
    setGeocoding(true)
    
    const geocodePromise = async () => {
      const params = new URLSearchParams({
        address: form.address,
        city: form.city,
      })
      const res = await fetch(`/api/geocode?${params.toString()}`)
      const json = await res.json()
      
      if (!res.ok || !json.data) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Endereço não encontrado.')
      }
      
      setForm((prev) => ({ ...prev, latitude: json.data.lat, longitude: json.data.lng }))
      return json.data
    }

    sileo.promise(geocodePromise(), {
      loading: { title: 'A geocodificar...' },
      success: { 
        title: 'Localização encontrada!', 
        description: 'Coordenadas atualizadas no mapa' 
      },
      error: (err) => ({
        title: 'Erro na localização',
        description: err instanceof Error ? err.message : 'Não foi possível encontrar o endereço'
      })
    })
    .finally(() => setGeocoding(false))
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">

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

      {/* ── Detalhes do espaço ───────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-[#1a1a2e]">Detalhes do espaço</h2>
        
        <div className="space-y-4">
          <Label>Tipo de chegada</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex-1 min-w-[200px] cursor-pointer group">
              <input
                type="radio"
                name="arrivalType"
                className="sr-only"
                checked={form.arrivalType === 'autonomous'}
                onChange={() => setForm(prev => ({ ...prev, arrivalType: 'autonomous' }))}
              />
              <div className={`p-4 rounded-xl border-2 transition-all ${
                form.arrivalType === 'autonomous' 
                ? 'border-[#8b1a1a] bg-[#8b1a1a]/5' 
                : 'border-slate-100 hover:border-slate-200'
              }`}>
                <p className="font-bold text-sm text-[#1a1a2e]">Chegada autónoma</p>
                <p className="text-xs text-slate-500 mt-1">O hóspede recebe instruções e acede sozinho</p>
              </div>
            </label>
            <label className="flex-1 min-w-[200px] cursor-pointer group">
              <input
                type="radio"
                name="arrivalType"
                className="sr-only"
                checked={form.arrivalType === 'guided'}
                onChange={() => setForm(prev => ({ ...prev, arrivalType: 'guided' }))}
              />
              <div className={`p-4 rounded-xl border-2 transition-all ${
                form.arrivalType === 'guided' 
                ? 'border-[#8b1a1a] bg-[#8b1a1a]/5' 
                : 'border-slate-100 hover:border-slate-200'
              }`}>
                <p className="font-bold text-sm text-[#1a1a2e]">Chegada acompanhada</p>
                <p className="text-xs text-slate-500 mt-1">O anfitrião recebe o hóspede pessoalmente</p>
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <Label>Número de pisos</Label>
            <input
              {...field('floors')}
              type="number"
              min="1"
              max="20"
              placeholder="1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Pisos totais do alojamento</p>
          </div>
          
          <div className="flex items-center">
            {Number(form.floors) > 1 && (
              <ToggleSwitch
                checked={form.hasElevator}
                onChange={(v) => setForm(prev => ({ ...prev, hasElevator: v }))}
                label="Tem elevador?"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-2">
          <ToggleSwitch
            checked={form.towelsIncluded}
            onChange={(v) => setForm(prev => ({ ...prev, towelsIncluded: v }))}
            label="Toalhas e lençóis incluídos"
            helper="Inclui toalhas de banho e roupa de cama"
          />
          <ToggleSwitch
            checked={form.petsAllowed}
            onChange={(v) => setForm(prev => ({ ...prev, petsAllowed: v }))}
            label="Animais de estimação"
          />
          <ToggleSwitch
            checked={form.childrenAllowed}
            onChange={(v) => setForm(prev => ({ ...prev, childrenAllowed: v }))}
            label="Apto para crianças"
            helper="Crianças a partir de 2 anos"
          />
          <ToggleSwitch
            checked={form.smokingAllowed}
            onChange={(v) => setForm(prev => ({ ...prev, smokingAllowed: v }))}
            label="Permitido fumar"
          />
        </div>
      </section>

      {/* ── Informação para hóspedes ──────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-[#1a1a2e]">Informação para hóspedes</h2>
        
        <div className="space-y-4">
          <div>
            <Label>Descrição do espaço</Label>
            <textarea
              {...field('spaceDescription')}
              rows={4}
              placeholder="Descreva como está organizado o espaço, os quartos, casas de banho, áreas comuns..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Aparece na secção &quot;Espaço&quot; da página pública</p>
          </div>
          
          <div>
            <Label>Informação de acceso</Label>
            <textarea
              {...field('accessInfo')}
              rows={3}
              placeholder="Como funciona o processo de entrada, localização das chaves, códigos de acesso..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Aparece na secção &quot;Acesso&quot; da página pública</p>
          </div>
          
          <div>
            <Label>Interação com hóspedes</Label>
            <textarea
              {...field('interactionInfo')}
              rows={3}
              placeholder="Descreva a sua disponibilidade para ajudar os hóspedes durante a estadia..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Aparece na secção &quot;Interação&quot; da página pública</p>
          </div>
          
          <div>
            <Label>Informação adicional (opcional)</Label>
            <textarea
              {...field('additionalInfo')}
              rows={3}
              placeholder="Qualquer informação extra relevante para os hóspedes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Aparece na secção &quot;Informação adicional&quot; apenas se preenchida</p>
          </div>
        </div>
      </section>

      {/* ── Regras da casa ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-[#1a1a2e]">Regras da casa</h2>
        
        <div className="space-y-4">
          <div>
            <Label>Estacionamento</Label>
            <textarea
              {...field('parkingInfo')}
              rows={2}
              placeholder="Informação sobre estacionamento disponível, preço, localização..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
          </div>
          
          <div>
            <Label>Serviços extra disponíveis</Label>
            <textarea
              {...field('extraServices')}
              rows={2}
              placeholder="Serviços adicionales que pode oferecer (transfer, pequeno-almoço, etc.)..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
          </div>
          
          <div>
            <Label>Normas específicas da casa</Label>
            <textarea
              {...field('houseRules')}
              rows={3}
              placeholder="Regras específicas do seu alojamento (horário de silêncio, uso das instalações, etc.)..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
          </div>
          
          <div className="max-w-[300px]">
            <Label>Dias de cancelamento gratuito</Label>
            <input
              {...field('cancellationDays')}
              type="number"
              min="0"
              max="365"
              placeholder="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Dias antes da chegada para cancelar (0 = sem cancelamento gratuito)</p>
          </div>
        </div>
      </section>

      {/* ── Sobre el anfitrión ────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-[#1a1a2e]">Sobre o anfitrião</h2>
        
        <div className="space-y-4">
          <div>
            <Label>Número de licença AL</Label>
            <input
              {...field('licenseNumber')}
              type="text"
              placeholder="AL-XXXXX/XXXX"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Número de registo de Alojamento Local</p>
          </div>
          
          <div>
            <Label>Sobre mim</Label>
            <textarea
              {...field('hostDescription')}
              rows={4}
              placeholder="Apresente-se aos seus hóspedes. Fale sobre si, os seus intereses, porque aluga o seu espaço..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">Aparece na secção &quot;Gerido por&quot; da página pública</p>
          </div>
        </div>
      </section>

      {/* ── Configuração do espaço ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#8b1a1a]">bed</span>
          <h2 className="text-lg font-bold text-[#1a1a2e]">Configuração do espaço</h2>
        </div>

        {form.hasRooms ? (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            Os detalhes de camas e serviços são configurados individualmente em cada quarto.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <Label>Tipo de casa de banho</Label>
              <select
                value={bathroomType}
                onChange={(e) => setBathroomType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] outline-none bg-white"
              >
                <option value="private">Casa de banho privada</option>
                <option value="shared">Casa de banho partilhada</option>
                <option value="ensuite">En-suite</option>
              </select>
            </div>

            <div>
              <Label>Tipo de camas</Label>
              <BedPicker value={bedsList} onChange={setBedsList} />
            </div>

            <div>
              <Label>Serviços incluídos</Label>
              <ServicesChecklist value={services} onChange={setServices} />
            </div>
          </div>
        )}
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

      {/* ── Localização ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#8b1a1a]">location_on</span>
          <h2 className="text-lg font-bold text-[#1a1a2e]">Localização no Mapa</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          As coordenadas são usadas para mostrar a localização aproximada aos hóspedes.
          A morada exata nunca é revelada publicamente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Latitude</Label>
            <input
              type="number"
              step="any"
              readOnly
              value={form.latitude ?? ''}
              placeholder="Ex: 38.7169"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <input
              type="number"
              step="any"
              readOnly
              value={form.longitude ?? ''}
              placeholder="Ex: -9.1399"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocoding || !form.city}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <span className="material-symbols-outlined text-base">my_location</span>
          {geocoding ? 'A geocodificar...' : 'Geocodificar endereço'}
        </button>
        {form.latitude && form.longitude && (
          <PropertyMapWrapper
            lat={form.latitude}
            lng={form.longitude}
            propertyTitle={form.title}
            radius={300}
          />
        )}
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
