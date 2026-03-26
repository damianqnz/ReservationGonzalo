'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

// Pre-chat message: "Olá! Posso ajudá-lo com alguma questão? Podemos demorar até 2h a responder."
// Configure this in: Tawk.to > Administration > Chat Widget > Appearance > Welcome Message

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tawk_API: Record<string, any>
    Tawk_LoadStart: Date
  }
}

const HIDDEN_PATHS = ['/dashboard', '/login']

function shouldHide(pathname: string) {
  return HIDDEN_PATHS.some((p) => pathname.startsWith(p))
}

export default function TawkChat() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
  const widgetId   = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID

  // Inject script once on mount
  useEffect(() => {
    if (!propertyId || !widgetId) return
    if (document.getElementById('tawk-script')) return

    window.Tawk_API        = window.Tawk_API ?? {}
    window.Tawk_LoadStart  = new Date()

    const s = document.createElement('script')
    s.id    = 'tawk-script'
    s.async = true
    s.src   = `https://embed.tawk.to/${propertyId}/${widgetId}`
    s.charset = 'UTF-8'
    s.setAttribute('crossorigin', '*')
    document.head.appendChild(s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set visitor name/email when session is available
  useEffect(() => {
    if (!session?.user?.name || !session?.user?.email) return
    window.Tawk_API = window.Tawk_API ?? {}

    const userName  = session.user.name
    const userEmail = session.user.email

    if (typeof window.Tawk_API.setAttributes === 'function') {
      window.Tawk_API.setAttributes({ name: userName, email: userEmail }, function () {})
    } else {
      const prev = window.Tawk_API.onLoad as (() => void) | undefined
      window.Tawk_API.onLoad = function () {
        window.Tawk_API.setAttributes({ name: userName, email: userEmail }, function () {})
        if (typeof prev === 'function') prev()
      }
    }
  }, [session])

  // Show or hide widget on every route change
  useEffect(() => {
    window.Tawk_API = window.Tawk_API ?? {}
    const hide = shouldHide(pathname)

    if (typeof window.Tawk_API.hideWidget === 'function') {
      // API already loaded — act immediately
      hide ? window.Tawk_API.hideWidget() : window.Tawk_API.showWidget()
    } else {
      // API not loaded yet — hook into onLoad
      const prev = window.Tawk_API.onLoad as (() => void) | undefined
      window.Tawk_API.onLoad = function () {
        if (shouldHide(window.location.pathname)) {
          window.Tawk_API.hideWidget()
        }
        if (typeof prev === 'function') prev()
      }
    }
  }, [pathname])

  return null
}
