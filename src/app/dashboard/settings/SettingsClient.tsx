'use client'

import { useEffect, useState } from 'react'

interface SettingsClientProps {
  user: {
    name:      string | null
    email:     string
    image:     string | null
    createdAt: Date
  }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked:   boolean
  onChange:  () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer'
      } ${checked ? 'bg-[#8b1a1a]' : 'bg-slate-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsClient({ user }: SettingsClientProps) {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsAlerts,          setSmsAlerts]          = useState(false)

  // Preferências — visual-only toggles (localStorage)
  const [darkMode,  setDarkMode]  = useState(false)
  const [pushNotif, setPushNotif] = useState(false)

  // Maintenance mode — functional
  const [maintenance,        setMaintenance]        = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)

  // Init from localStorage on mount
  useEffect(() => {
    setDarkMode(localStorage.getItem('rg-dark-mode') === 'true')
    setMaintenance(localStorage.getItem('rg-maintenance') === 'true')
  }, [])

  async function handleMaintenance(enable: boolean) {
    if (enable) {
      const ok = window.confirm(
        '⚠️ Ativar este modo irá impedir novas reservas no site público.\n\nDeseja continuar?',
      )
      if (!ok) return
    }

    setMaintenanceLoading(true)
    try {
      const res = await fetch('/api/settings/maintenance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled: enable }),
      })
      if (res.ok) {
        setMaintenance(enable)
        localStorage.setItem('rg-maintenance', String(enable))
      }
    } catch {
      // silent — keep current state
    } finally {
      setMaintenanceLoading(false)
    }
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-PT', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Configurações</h2>
        <p className="text-slate-500 mt-1">Gerencie as preferências da sua plataforma e configurações de segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-8 space-y-8">

          {/* ── Informações da Conta ─────────────────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b1a1a]">person</span>
                Informações da Conta
              </h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? 'Avatar'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#8b1a1a]/10 flex items-center justify-center text-[#8b1a1a] font-bold text-xl">
                    {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#1a1a2e]">{user.name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Membro desde {memberSince}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Nome</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0 transition-all"
                    type="text"
                    defaultValue={user.name ?? ''}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">E-mail</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0 transition-all"
                    type="email"
                    defaultValue={user.email}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Preferências de Notificação ──────────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b1a1a]">notifications_active</span>
                Preferências de Notificação
              </h3>
            </div>
            <div className="p-8 divide-y divide-slate-200">
              <div className="flex items-center justify-between py-4 first:pt-0">
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Notificações por E-mail</p>
                  <p className="text-xs text-slate-500">Receba atualizações de reservas e relatórios por e-mail.</p>
                </div>
                <Toggle checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
              </div>
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Alertas SMS</p>
                  <p className="text-xs text-slate-500">Receba alertas críticos do sistema no seu dispositivo móvel.</p>
                </div>
                <Toggle checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} />
              </div>
            </div>
          </section>

          {/* ── Segurança ────────────────────────────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b1a1a]">security</span>
                Segurança
              </h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="p-2 bg-red-50 rounded-lg text-[#8b1a1a]">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Autenticação de Dois Fatores</p>
                  <p className="text-xs text-slate-500 mt-1">Adicione uma camada extra de segurança à sua conta de administrador.</p>
                  <button className="mt-3 text-xs font-bold text-[#8b1a1a] hover:underline flex items-center gap-1">
                    Ativar 2FA <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tempo de Sessão</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0 transition-all">
                  <option>Após 30 minutos de inatividade</option>
                  <option>Após 1 hora de inatividade</option>
                  <option>Nunca (Não recomendado)</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── Preferências ─────────────────────────────────────────────── */}
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b1a1a]">tune</span>
                Preferências
              </h3>
            </div>
            <div className="p-8 divide-y divide-slate-200">

              {/* Dark Mode */}
              <div className="flex items-start justify-between py-4 first:pt-0 gap-4">
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Modo Escuro</p>
                  <p className="text-xs text-slate-500">Ativar tema escuro no dashboard.</p>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    Em desenvolvimento — disponível em breve
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <Toggle
                    checked={darkMode}
                    onChange={() => {
                      const next = !darkMode
                      setDarkMode(next)
                      localStorage.setItem('rg-dark-mode', String(next))
                    }}
                    disabled
                  />
                </div>
              </div>

              {/* Push Notifications */}
              <div className="flex items-start justify-between py-4 gap-4">
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Notificações Push</p>
                  <p className="text-xs text-slate-500">Receber notificações de novas reservas.</p>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    Em desenvolvimento — disponível em breve
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <Toggle checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} disabled />
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-start justify-between py-4 last:pb-0 gap-4">
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Modo de Manutenção</p>
                  <p className="text-xs text-slate-500">
                    Desativar temporariamente as reservas no site público.
                  </p>
                  {maintenance && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      Ativo — site público em manutenção
                    </span>
                  )}
                </div>
                <div className="shrink-0 pt-0.5">
                  {maintenanceLoading ? (
                    <span className="text-xs text-slate-400">...</span>
                  ) : (
                    <Toggle
                      checked={maintenance}
                      onChange={() => handleMaintenance(!maintenance)}
                    />
                  )}
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-[#8b1a1a] rounded-lg p-8 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-bold tracking-tight">Status de Admin</h4>
              <p className="text-white/70 text-sm mt-1">Privilégios administrativos totais ativos.</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                  <span className="text-white/60">Membro desde</span>
                  <span className="font-bold">{memberSince}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                  <span className="text-white/60">Função</span>
                  <span className="font-bold">Proprietário</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* ── Sticky save bar ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 right-0 left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 px-8 py-4 flex items-center justify-end gap-4 z-20">
        <button className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95">
          Descartar Alterações
        </button>
        <button className="px-8 py-2.5 rounded-lg bg-[#8b1a1a] text-white font-bold text-sm shadow-lg shadow-red-900/10 hover:opacity-90 transition-all active:scale-95">
          Guardar Configurações
        </button>
      </div>

      {/* ── Signature ────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 pt-8 pb-24 text-center space-y-1">
        <p className="font-mono text-sm text-slate-400 tracking-tight">Darkcoder97</p>
        <p className="text-xs text-slate-300">Admin · Versão 1.0.0</p>
        <p className="text-xs text-slate-300">{new Date().getFullYear()} © ReservationGonzalo</p>
      </div>
    </div>
  )
}
