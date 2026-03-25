'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const diff  = Date.now() - new Date(dateStr).getTime()
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

type FilterTab = 'all' | 'bookings' | 'payments' | 'reviews' | 'system'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'Todas' },
  { key: 'bookings', label: 'Reservas' },
  { key: 'payments', label: 'Pagamentos' },
  { key: 'reviews',  label: 'Avaliações' },
  { key: 'system',   label: 'Sistema' },
]

function matchesFilter(type: string, tab: FilterTab): boolean {
  if (tab === 'all') return true
  if (tab === 'bookings')  return ['NEW_BOOKING', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'CHECK_IN_REMINDER', 'CHECK_OUT_REMINDER'].includes(type)
  if (tab === 'payments')  return type === 'PAYMENT_RECEIVED'
  if (tab === 'reviews')   return type === 'NEW_REVIEW'
  if (tab === 'system')    return type === 'SYSTEM'
  return true
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialItems:  NotificationItem[]
  initialUnread: number
}

export default function NotificationsClient({ initialItems, initialUnread }: Props) {
  const router = useRouter()
  const [items,     setItems]     = useState(initialItems)
  const [unread,    setUnread]    = useState(initialUnread)
  const [tab,       setTab]       = useState<FilterTab>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const filtered = items.filter((n) => matchesFilter(n.type, tab))

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' })
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnread(0)
      router.refresh()
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/notifications/${item.id}/read`, { method: 'PATCH' })
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)))
      setUnread((c) => Math.max(0, c - 1))
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                tab === t.key
                  ? 'bg-white shadow-sm text-[#1a1a2e]'
                  : 'text-slate-500 hover:text-[#1a1a2e]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Mark all read */}
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="text-sm font-medium text-[#8b1a1a] hover:underline disabled:opacity-50"
          >
            {markingAll ? 'A marcar...' : 'Marcar todas como lidas'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-5xl mb-4">🎉</span>
            <p className="text-sm font-medium">Sem notificações nesta categoria</p>
          </div>
        ) : (
          filtered.map((item) => {
            const { emoji, color } = notifIcon(item.type)
            const date = new Date(item.createdAt)
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                  !item.isRead ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Unread dot */}
                <div className="shrink-0 pt-2 w-2">
                  {!item.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-lg shrink-0`}>
                  {emoji}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] leading-snug ${!item.isRead ? 'font-semibold text-[#1a1a2e]' : 'font-medium text-slate-700'}`}>
                    {item.title}
                  </p>
                  <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {/* Timestamp */}
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
