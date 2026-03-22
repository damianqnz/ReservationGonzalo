'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'rg-cookie-consent'

interface ConsentPayload {
  essential:  boolean
  analytics:  boolean
  marketing:  boolean
  timestamp:  string
}

function saveConsent(analytics: boolean, marketing: boolean) {
  const payload: ConsentPayload = {
    essential: true,
    analytics,
    marketing,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage blocked (private mode, etc.) — don't show
    }
  }, [])

  function acceptAll() {
    saveConsent(true, true)
    setVisible(false)
  }

  function rejectOptional() {
    saveConsent(false, false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Text */}
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Utilizamos cookies para melhorar a sua experiência, analisar o tráfego e personalizar
          conteúdo. Ao continuar a navegar, aceita a nossa{' '}
          <Link href="/cookies" className="underline text-slate-800 hover:text-[#8b1a1a] transition-colors">
            Política de Cookies
          </Link>
          .
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={rejectOptional}
            className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Rejeitar
          </button>
          <button
            onClick={acceptAll}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#8b1a1a] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Aceitar tudo
          </button>
        </div>
      </div>
    </div>
  )
}
