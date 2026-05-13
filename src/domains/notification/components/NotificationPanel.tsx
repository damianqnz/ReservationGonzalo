'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Settings, ExternalLink } from 'lucide-react'
import NotificationPreferences from './NotificationPreferences'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id:        string
  type:      string
  title:     string
  message:   string
  isRead:    boolean
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins < 1)   return 'agora mesmo'
  if (mins < 60)  return `há ${mins} minuto${mins > 1 ? 's' : ''}`
  if (hours < 24) return `há ${hours} hora${hours > 1 ? 's' : ''}`
  if (days === 1) return 'ontem'
  return `há ${days} dias`
}

function notifIcon(type: string): { emoji: string; color: string } {
  switch (type) {
    case 'NEW_BOOKING':        return { emoji: '📅', color: 'bg-emerald-50' }
    case 'BOOKING_CONFIRMED':  return { emoji: '✅', color: 'bg-emerald-50' }
    case 'PAYMENT_RECEIVED':   return { emoji: '💰', color: 'bg-emerald-50' }
    case 'BOOKING_CANCELLED':  return { emoji: '❌', color: 'bg-red-50' }
    case 'CHECK_IN_REMINDER':  return { emoji: '🏠', color: 'bg-blue-50' }
    case 'CHECK_OUT_REMINDER': return { emoji: '🚪', color: 'bg-blue-50' }
    case 'NEW_REVIEW':         return { emoji: '⭐', color: 'bg-yellow-50' }
    default:                   return { emoji: 'ℹ️', color: 'bg-slate-50' }
  }
}

function notifUrl(type: string): string {
  switch (type) {
    case 'NEW_BOOKING':
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
    case 'PAYMENT_RECEIVED':
    case 'NEW_REVIEW':
      return '/dashboard/reservations'
    case 'CHECK_IN_REMINDER':
    case 'CHECK_OUT_REMINDER':
      return '/dashboard/calendar'
    default:
      return '/dashboard/notifications'
  }
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-2.5 bg-slate-100 rounded w-full" />
        <div className="h-2 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose:          () => void
  onUnreadChange?:  (count: number) => void
}

export default function NotificationPanel({ onClose, onUnreadChange }: Props) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [items,   setItems]   = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [prefOpen, setPrefOpen] = useState(false)

  // Fetch notifications on mount
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/notifications?limit=20')
        const json = await res.json()
        if (json.data?.items) {
          setItems(json.data.items as NotificationItem[])
          onUnreadChange?.(json.data.unreadCount as number)
        }
      } catch {/* ignore */}
      finally { setLoading(false) }
    }
    void load()
  }, [onUnreadChange])

  // Close on click-outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    onUnreadChange?.(0)
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/notifications/${item.id}/read`, { method: 'PATCH' })
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      )
      onUnreadChange?.(Math.max(0, items.filter((n) => !n.isRead).length - 1))
    }
    onClose()
    router.push(notifUrl(item.type))
  }

  const unread = items.filter((n) => !n.isRead).length

  return (
    <>
      <div
        ref={panelRef}
        className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-50
          animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#1a1a2e]">
            Notificações
            {unread > 0 && (
              <span className="ml-2 text-[10px] font-bold bg-[#8b1a1a] text-white px-1.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-slate-500 hover:text-[#1a1a2e] transition-colors font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              onClick={() => setPrefOpen(true)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100"
              title="Preferências"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <span className="text-4xl mb-3">🎉</span>
              <p className="text-sm font-medium">Sem notificações novas</p>
            </div>
          ) : (
            items.map((item) => {
              const { emoji, color } = notifIcon(item.type)
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    !item.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Unread dot */}
                  <div className="shrink-0 pt-1 w-2">
                    {!item.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-base shrink-0`}>
                    {emoji}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-tight truncate ${!item.isRead ? 'font-semibold text-[#1a1a2e]' : 'font-medium text-slate-700'}`}>
                      {item.title}
                    </p>
                    <p className="text-[12px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                      {item.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2.5">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-[#1a1a2e] transition-colors"
          >
            Ver todas as notificações
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {prefOpen && (
        <NotificationPreferences onClose={() => setPrefOpen(false)} />
      )}
    </>
  )
}
