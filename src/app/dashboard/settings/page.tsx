'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Configurações</h2>
        <p className="text-slate-500 mt-1">Gerencie as preferências da sua plataforma e configurações de segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="font-bold text-[#1a1a2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b1a1a]">language</span>
                Configurações Gerais
              </h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Título do Site</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0 transition-all" 
                  type="text" 
                  defaultValue="ReservationGonzalo" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Idioma Padrão</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0 transition-all">
                    <option>Português (PT)</option>
                    <option>Inglês (US)</option>
                    <option>Espanhol</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fuso Horário</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0 transition-all">
                    <option>UTC+0 (Europa Ocidental)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+1 (Centro-Europeu)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

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
                <button 
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${emailNotifications ? 'bg-[#8b1a1a]' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-4 last:pb-0">
                <div>
                  <p className="font-bold text-[#1a1a2e] text-sm">Alertas SMS</p>
                  <p className="text-xs text-slate-500">Receba alertas críticos do sistema no seu dispositivo móvel.</p>
                </div>
                <button 
                  onClick={() => setSmsAlerts(!smsAlerts)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${smsAlerts ? 'bg-[#8b1a1a]' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

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
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#8b1a1a] rounded-lg p-8 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-bold tracking-tight">Status de Admin</h4>
              <p className="text-white/70 text-sm mt-1">Privilégios administrativos totais ativos.</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                  <span className="text-white/60">Último Login</span>
                  <span className="font-bold">Há 2 horas</span>
                </div>
                <div className="flex items-center justify-between text-sm border-b border-white/10 pb-2">
                  <span className="text-white/60">Sessões Ativas</span>
                  <span className="font-bold">1 Sessão</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h4 className="font-bold text-[#1a1a2e] text-sm mb-4 uppercase tracking-wider">Ações Rápidas</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <span className="material-symbols-outlined text-slate-500 group-hover:text-[#8b1a1a]">backup</span>
                <span className="text-sm font-medium text-slate-500 group-hover:text-[#1a1a2e]">Exportar Logs do Site</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <span className="material-symbols-outlined text-slate-500 group-hover:text-[#8b1a1a]">database</span>
                <span className="text-sm font-medium text-slate-500 group-hover:text-[#1a1a2e]">Limpar Cache</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 px-8 py-4 flex items-center justify-end gap-4 z-20">
        <button className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95">Descartar Alterações</button>
        <button className="px-8 py-2.5 rounded-lg bg-[#8b1a1a] text-white font-bold text-sm shadow-lg shadow-red-900/10 hover:opacity-90 transition-all active:scale-95">Guardar Configurações</button>
      </div>
    </div>
  )
}
