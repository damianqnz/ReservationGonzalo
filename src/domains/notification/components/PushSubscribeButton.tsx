'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  const output  = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setStatus('subscribed')
      })
      .catch(() => {/* ignore */})
  }, [])

  async function handleSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('VAPID public key not configured')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription: sub.toJSON() }),
      })

      if (!res.ok) throw new Error('Failed to save subscription')

      setStatus('subscribed')
    } catch (err) {
      console.error('[PushSubscribeButton]', err)
      setStatus('idle')
    }
  }

  async function handleUnsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch {
      setStatus('subscribed')
    }
  }

  if (status === 'unsupported') {
    return (
      <p className="text-xs text-slate-400">
        O seu browser não suporta notificações push.
      </p>
    )
  }

  if (status === 'subscribed') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <Bell size={15} />
          Notificações ativas
        </div>
        <button
          onClick={handleUnsubscribe}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#8b1a1a] transition-colors"
        >
          <BellOff size={13} />
          Desativar
        </button>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-xs text-amber-600">
        Permissão negada. Ative nas definições do browser.
      </p>
    )
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={status === 'loading'}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium bg-[#1a1a2e] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {status === 'loading' ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Bell size={15} />
      )}
      {status === 'loading' ? 'A ativar...' : 'Ativar notificações no browser'}
    </button>
  )
}
