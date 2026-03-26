'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Nav config ───────────────────────────────────────────────────────────────

const navItems = [
  { name: 'Dashboard',       icon: 'dashboard',      href: '/dashboard'                    },
  { name: 'Reservas',        icon: 'calendar_month', href: '/dashboard/reservations'       },
  { name: 'Calendário',      icon: 'calendar_today', href: '/dashboard/calendar'           },
  { name: 'Propriedades',    icon: 'domain',         href: '/dashboard/properties'         },
  { name: 'Clientes',        icon: 'group',          href: '/dashboard/clients'            },
  { name: 'Análises',        icon: 'leaderboard',    href: '/dashboard/analytics'          },
  { name: 'Cupões',          icon: 'local_offer',    href: '/dashboard/coupons'            },
  { name: 'Notificações',    icon: 'notifications',  href: '/dashboard/notifications'      },
]

const bottomNavItems = [
  { name: 'Configurações', icon: 'settings', href: '/dashboard/settings' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  collapsed:    boolean
  onToggle:     () => void
  unreadCount?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardSidebar({ collapsed, onToggle, unreadCount = 0 }: Props) {
  const pathname   = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen border-r border-slate-200 bg-white flex flex-col py-6 font-sans antialiased text-sm font-medium z-30 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button — right edge of sidebar */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-500 hover:text-[#1a1a2e] hover:border-slate-300 transition-colors z-10"
        title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <div className={`mb-10 ${collapsed ? 'px-3' : 'px-6'}`}>
        {collapsed ? (
          <div className="w-10 h-10 bg-[#1a1a2e] flex items-center justify-center rounded-lg mx-auto">
            <span className="text-white text-xs font-extrabold tracking-tight">RG</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a1a2e] flex items-center justify-center rounded-lg shrink-0">
              <span className="material-symbols-outlined text-white">apartment</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1a1a2e] leading-tight">
                ReservationGonzalo
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Portal do Administrador
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 py-3 transition-colors duration-200 cursor-pointer active:scale-95 ${
                collapsed ? 'justify-center px-3' : 'px-6'
              } ${
                isActive
                  ? 'text-[#1a1a2e] bg-slate-100 border-r-4 border-[#1a1a2e]'
                  : 'text-slate-500 hover:text-[#1a1a2e] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="flex-1 flex items-center justify-between">
                  {item.name}
                  {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                    <span className="text-[9px] font-bold bg-[#8b1a1a] text-white px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className={`mt-auto space-y-1 ${collapsed ? 'px-2' : 'px-4'}`}>
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 py-3 transition-colors duration-200 cursor-pointer ${
                collapsed ? 'justify-center px-1' : 'px-4'
              } ${
                isActive
                  ? 'text-white bg-[#8b1a1a] rounded-lg shadow-md'
                  : 'text-slate-500 hover:text-[#1a1a2e] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? (signingOut ? 'A sair...' : 'Sair') : undefined}
          className={`w-full flex items-center gap-3 py-3 text-slate-500 hover:text-[#8b1a1a] hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            collapsed ? 'justify-center px-1' : 'px-4'
          }`}
        >
          <span className="material-symbols-outlined shrink-0">logout</span>
          {!collapsed && <span>{signingOut ? 'A sair...' : 'Sair'}</span>}
        </button>
      </div>
    </aside>
  )
}
