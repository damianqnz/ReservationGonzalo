'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

interface DashboardTopbarProps {
  unreadCount?: number
  collapsed?:   boolean
}

export default function DashboardTopbar({ unreadCount = 0, collapsed = false }: DashboardTopbarProps) {
  const { data: session } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userName = session?.user?.name ?? 'Utilizador'
  const userEmail = session?.user?.email ?? ''
  const userImage = session?.user?.image ?? null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    setDropdownOpen(false)
    await signOut({ callbackUrl: '/login' })
  }

  const initial = userName.charAt(0).toUpperCase()

  return (
    <header className={`fixed top-0 right-0 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 z-20 transition-all duration-300 ${collapsed ? 'left-16' : 'left-64'}`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-[#1a1a2e]/20 rounded-lg transition-all">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-0"
            placeholder="Pesquisar análises, reservas ou propriedades..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-slate-100 rounded-full transition-all">
            <span className="material-symbols-outlined text-slate-500">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[9px] font-bold text-white px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </span>
            )}
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <span className="material-symbols-outlined text-slate-500">chat_bubble</span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-slate-200" />

        {/* Profile dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#1a1a2e]">{userName}</p>
              <p className="text-[10px] text-slate-500">Gerente de Propriedade</p>
            </div>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-[#1a1a2e]">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-white text-sm font-bold">{initial}</span>
              )}
            </div>
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {/* User info — non-clickable */}
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-[#1a1a2e] truncate">{userName}</p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>

              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">manage_accounts</span>
                O meu perfil
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#8b1a1a] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                {signingOut ? 'A terminar sessão...' : 'Terminar sessão'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
