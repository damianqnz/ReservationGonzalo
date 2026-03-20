'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Ticket, Mail, ArrowRight, AlertCircle } from 'lucide-react'

type Tab = 'owner' | 'guest'
type GuestSubTab = 'code' | 'email'

export default function LoginScreen() {
  const router = useRouter()

  // Main tabs
  const [activeTab, setActiveTab] = useState<Tab>('owner')

  // Tab 1 — owner login
  const [googleLoading, setGoogleLoading] = useState(false)

  // Tab 2 — guest booking search
  const [guestSubTab, setGuestSubTab] = useState<GuestSubTab>('code')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestError, setGuestError] = useState('')

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
    setGoogleLoading(false)
  }

  function switchGuestSubTab(tab: GuestSubTab) {
    setGuestSubTab(tab)
    setGuestError('')
  }

  async function handleGuestSearch(e: React.FormEvent) {
    e.preventDefault()
    setGuestError('')
    setGuestLoading(true)

    try {
      const param =
        guestSubTab === 'code'
          ? `code=${encodeURIComponent(code.trim())}`
          : `email=${encodeURIComponent(email.trim())}`

      const res = await fetch(`/api/guest/bookings?${param}`)
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setGuestError('Demasiadas tentativas. Tente mais tarde.')
        } else {
          setGuestError('Nenhuma reserva encontrada. Verifique os dados.')
        }
        return
      }

      const data: { confirmationCode: string }[] = json.data ?? []

      if (data.length === 0) {
        setGuestError('Nenhuma reserva encontrada. Verifique o código.')
        return
      }

      if (data.length === 1) {
        router.push(`/portal/${encodeURIComponent(data[0].confirmationCode)}`)
      } else {
        router.push(`/portal?email=${encodeURIComponent(email.trim())}`)
      }
    } catch {
      setGuestError('Nenhuma reserva encontrada. Verifique os dados.')
    } finally {
      setGuestLoading(false)
    }
  }

  const guestInputReady =
    guestSubTab === 'code' ? code.trim().length > 0 : email.trim().length > 3

  return (
    <div className="bg-white text-text-main antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between">
        <span className="font-display font-bold text-xl tracking-tight">
          ReservationGonzalo
        </span>
        <button className="flex items-center gap-2 border border-gray-200 rounded-full py-1.5 px-3 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-xl">menu</span>
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_circle
          </span>
        </button>
      </header>

      <main className="min-h-screen pt-16 flex flex-col md:flex-row">
        {/* Left: Benefits Panel */}
        <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-surface p-12 items-center justify-center">
          <div className="absolute inset-0 z-0">
            <img
              alt="Luxury property interior"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5BJ29ReJymoGJD4GLMUS06ilJ9XHqehSRU4Z4hdd_1ONhmaYtS0RyxqeEuHu88TKUx4oOL0RfFDL0Heok7OTTuMv8fYIxx-4ZbwUG7HTlII13WGTYV6Kdq1gQ9rDMaCZq27okb3Ms4GNxl1sz9-Cde9noohS_P_XdGlNvysyUIiAu-pFqmoZWvSO8-vSgwIhLsM6TME2n3gTc7a4nKDuk00MykrRRo-Ah9mtVKgSKmFUG57aJ4o6a7R30CZIdyXl-fK7S6avcfRuk"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="relative z-10 max-w-lg">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-xl shadow-2xl">
              <h2 className="font-display text-3xl font-bold mb-6">
                A tua estadia perfeita começa aqui.
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    icon: 'check_circle',
                    title: 'Resumo de todas tus reservas',
                    desc: 'Gestiona a tuas datas e alojamentos num só espacio.',
                  },
                  {
                    icon: 'support_agent',
                    title: 'Soporte 24/7',
                    desc: 'Estou aqui para te-ayudar em cada passo da tua estadia.',
                  },
                  {
                    icon: 'key',
                    title: 'Check-in simples',
                    desc: 'Acede às instruções de entrada ao instante.',
                  },
                ].map((item) => (
                  <li key={item.icon} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary mt-1">
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-lg">{item.title}</p>
                      <p className="text-text-muted text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Right: Login Form */}
        <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">
          <div className="max-w-md w-full mx-auto">
            <h1 className="font-display text-2xl font-semibold mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-text-muted mb-8">
              Inicia sesión para gestionar tus estancias.
            </p>

            {/* Main tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveTab('owner')}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'owner'
                    ? 'border-[#8b1a1a] text-[#8b1a1a] font-semibold'
                    : 'border-transparent text-stone-400 hover:text-text-main'
                }`}
              >
                Iniciar sessão
              </button>
              <button
                onClick={() => {
                  setActiveTab('guest')
                  setGuestError('')
                }}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'guest'
                    ? 'border-[#8b1a1a] text-[#8b1a1a] font-semibold'
                    : 'border-transparent text-stone-400 hover:text-text-main'
                }`}
              >
                ID de reserva
              </button>
            </div>

            {/* ── Tab 1: Owner login ─────────────────────────────────────── */}
            {activeTab === 'owner' && (
              <>
                <form className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider mb-1 px-1"
                      htmlFor="login-email"
                    >
                      Correo electrónico
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                      id="login-email"
                      placeholder="nombre@ejemplo.com"
                      type="email"
                    />
                  </div>
                  <button
                    className="w-full bg-primary text-white font-semibold py-3.5 rounded-lg hover:bg-primary/80 transition-colors shadow-lg mt-2"
                    type="submit"
                  >
                    Continuar con correo electrónico
                  </button>
                </form>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-text-muted uppercase tracking-widest">
                    ou
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-3 rounded-lg text-sm font-medium text-text-main hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                        fill="#EA4335"
                      />
                    </svg>
                    {googleLoading ? 'A redirecionar...' : 'Continuar com Google'}
                  </button>
                </div>

                <p className="mt-10 text-center text-sm text-text-muted">
                  ¿No tienes una cuenta?{' '}
                  <a
                    className="text-text-main font-semibold hover:underline"
                    href="#"
                  >
                    Regístrate
                  </a>
                </p>
              </>
            )}

            {/* ── Tab 2: Guest booking search ────────────────────────────── */}
            {activeTab === 'guest' && (
              <>
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold text-stone-800 mb-1">
                    Encontre a sua reserva
                  </h2>
                  <p className="text-text-muted text-sm">
                    Introduza os detalhes da sua estadia para gerir a sua reserva.
                  </p>
                </div>

                {/* Guest sub-tabs */}
                <div className="flex bg-stone-100 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => switchGuestSubTab('code')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all ${
                      guestSubTab === 'code'
                        ? 'bg-white text-stone-800 shadow-sm font-semibold'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <Ticket size={14} />
                    Código
                  </button>
                  <button
                    onClick={() => switchGuestSubTab('email')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all ${
                      guestSubTab === 'email'
                        ? 'bg-white text-stone-800 shadow-sm font-semibold'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>

                <form onSubmit={handleGuestSearch} className="space-y-5">
                  {guestSubTab === 'code' ? (
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wider mb-1 px-1"
                        htmlFor="confirmation-code"
                      >
                        Código de confirmação
                      </label>
                      <div className="relative">
                        <Ticket
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          size={16}
                        />
                        <input
                          id="confirmation-code"
                          type="text"
                          required
                          value={code}
                          onChange={(e) => {
                            setGuestError('')
                            setCode(e.target.value.toUpperCase())
                          }}
                          placeholder="Ex: RG-XXXXXX"
                          className="w-full pl-9 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition-all outline-none placeholder:text-stone-300 uppercase"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-text-muted px-1">
                        Pode encontrar este código no email de confirmação.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label
                        className="block text-xs font-semibold uppercase tracking-wider mb-1 px-1"
                        htmlFor="guest-email"
                      >
                        Endereço de email
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                          size={16}
                        />
                        <input
                          id="guest-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setGuestError('')
                            setEmail(e.target.value)
                          }}
                          placeholder="o-seu@email.com"
                          className="w-full pl-9 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8b1a1a]/20 focus:border-[#8b1a1a] transition-all outline-none placeholder:text-stone-300"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-text-muted px-1">
                        Introduza o email utilizado na reserva.
                      </p>
                    </div>
                  )}

                  {guestError && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{guestError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={guestLoading || !guestInputReady}
                    className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#6d1414] text-white font-semibold py-3.5 rounded-lg transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{guestLoading ? 'A procurar...' : 'Continuar'}</span>
                    {!guestLoading && <ArrowRight size={15} />}
                  </button>
                </form>

                {/* Help links */}
                <div className="mt-10 pt-8 border-t border-stone-100 flex flex-col items-center gap-3">
                  <p className="text-xs text-text-muted">
                    Precisa de ajuda com a sua reserva?
                  </p>
                  <div className="flex gap-6">
                    <a
                      href="/faq"
                      className="text-xs font-semibold text-stone-700 hover:text-[#8b1a1a] transition-colors"
                    >
                      Centro de ajuda
                    </a>
                    <span className="text-stone-200">|</span>
                    <a
                      href="mailto:reservas@reservationgonzalo.pt"
                      className="text-xs font-semibold text-stone-700 hover:text-[#8b1a1a] transition-colors"
                    >
                      Contactar suporte
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-gray-200 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-text-muted">
            © 2026 ReservationGonzalo. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Privacy', 'Terms', 'Support', 'About'].map((link) => (
              <a
                key={link}
                className="text-sm text-text-muted hover:text-text-main transition-colors"
                href="#"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
