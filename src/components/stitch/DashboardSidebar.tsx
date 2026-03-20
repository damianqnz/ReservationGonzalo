'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { name: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { name: 'Reservas', icon: 'calendar_month', href: '/dashboard/reservations' },
  { name: 'Calendário', icon: 'calendar_today', href: '/dashboard/calendar' },
  { name: 'Propriedades', icon: 'domain', href: '/dashboard/properties' },
  { name: 'Clientes', icon: 'group', href: '/dashboard/customers' },
  { name: 'Análises', icon: 'leaderboard', href: '/dashboard/analytics' },
  { name: 'Cupões', icon: 'local_offer', href: '/dashboard/coupons' },
]

const bottomNavItems = [
  { name: 'Configurações', icon: 'settings', href: '/dashboard/settings' },
  { name: 'Suporte', icon: 'help_center', href: '/dashboard/support' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col py-6 font-sans antialiased text-sm font-medium z-30">
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a1a2e] flex items-center justify-center rounded-lg">
            <span className="material-symbols-outlined text-white">apartment</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1a1a2e] leading-tight">ReservationGonzalo</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Portal do Administrador</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#1a1a2e] bg-slate-100 border-r-4 border-[#1a1a2e]'
                  : 'text-slate-500 hover:text-[#1a1a2e] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 mt-auto space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-white bg-[#8b1a1a] rounded-lg shadow-md'
                  : 'text-slate-500 hover:text-[#1a1a2e] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#8b1a1a] hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>{signingOut ? 'A sair...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  )
}
