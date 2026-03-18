'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Lock, Shield, Check, Tag, X } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// ─── Stripe (singleton outside component to avoid re-instantiation) ───────────

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string
  confirmationCode: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  guestCount: number
  checkIn: string
  checkOut: string
  nights: number
  pricePerNight: number
  cleaningFee: number
  securityDeposit: number
  totalPrice: number
  currency: string
  status: string
  paymentStatus: string
  expiresAt: string | null
  property: {
    id: string
    title: string
    slug: string
    address: string
    city: string
    country: string
    checkInTime: string
    checkOutTime: string
    cancellationPolicy: string
    images: { url: string; alt: string | null }[]
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

const CANCELLATION_LABELS: Record<string, string> = {
  FLEXIBLE: 'Política Flexível',
  MODERATE: 'Política Moderada',
  STRICT: 'Política Estrita',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFullDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Countdown Banner ─────────────────────────────────────────────────────────

function CountdownBanner({
  expiresAt,
  redirectUrl,
  onExpire,
}: {
  expiresAt: string
  redirectUrl: string
  onExpire: () => void
}) {
  const router = useRouter()
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  )
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    // Already expired on mount
    if (remaining === 0) {
      setExpired(true)
      onExpire()
      setTimeout(() => router.replace(redirectUrl), 3000)
      return
    }

    const interval = setInterval(() => {
      const left = Math.max(0, new Date(expiresAt).getTime() - Date.now())
      setRemaining(left)
      if (left === 0) {
        clearInterval(interval)
        setExpired(true)
        onExpire()
        setTimeout(() => router.replace(redirectUrl), 3000)
      }
    }, 1000)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt, redirectUrl])

  if (expired) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3">
        <span className="material-symbols-outlined text-red-500 text-[22px]">timer_off</span>
        <p className="text-[14px] font-medium text-red-700">
          O tempo expirou. A sua reserva foi cancelada. A redirecionar…
        </p>
      </div>
    )
  }

  const isUrgent = remaining < 3 * 60 * 1000

  return (
    <div
      className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${
        isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`material-symbols-outlined text-[22px] ${
            isUrgent ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          timer
        </span>
        <p className={`text-[14px] font-medium ${isUrgent ? 'text-amber-800' : 'text-emerald-800'}`}>
          A sua reserva está reservada por
        </p>
      </div>
      <span
        className={`font-mono font-bold text-[24px] tabular-nums shrink-0 ${
          isUrgent ? 'text-amber-700' : 'text-emerald-700'
        }`}
      >
        {formatCountdown(remaining)}
      </span>
    </div>
  )
}

// ─── Payment Form (must be inside <Elements> context) ─────────────────────────

const CARD_ELEMENT_OPTIONS: React.ComponentProps<typeof CardElement>['options'] = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a2e',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

function PaymentForm({
  clientSecret,
  totalPrice,
  bookingId,
  expired,
  onDiscountChange,
}: {
  clientSecret: string
  totalPrice: number
  bookingId: string
  expired: boolean
  onDiscountChange: (discount: number, finalPrice: number) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [cardComplete, setCardComplete] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    finalPrice: number
    description: string
  } | null>(null)

  const finalTotal = appliedCoupon ? appliedCoupon.finalPrice : totalPrice

  async function handleValidateCoupon() {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponValidating(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, bookingId }),
      })
      const json = await res.json() as { data: { valid: boolean; discount?: number; finalPrice?: number; description?: string; error?: string } | null; error: string | null }
      if (!res.ok || json.error || !json.data) {
        setCouponError(typeof json.error === 'string' ? json.error : 'Erro ao validar cupão.')
        return
      }
      const v = json.data
      if (!v.valid) {
        setCouponError((v as { error?: string }).error ?? 'Cupão inválido.')
        return
      }
      const discount = v.discount ?? 0
      const finalPrice = v.finalPrice ?? totalPrice
      const description = v.description ?? code
      setAppliedCoupon({ code, discount, finalPrice, description })
      onDiscountChange(discount, finalPrice)
    } catch {
      setCouponError('Erro de ligação. Tente novamente.')
    } finally {
      setCouponValidating(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError(null)
    onDiscountChange(0, totalPrice)
  }

  async function handlePay() {
    if (!stripe || !elements || !cardComplete || !termsAccepted || expired) return

    setPaying(true)
    setPayError(null)

    // Apply coupon before payment if one is queued
    if (appliedCoupon) {
      try {
        const res = await fetch('/api/coupons/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: appliedCoupon.code, bookingId }),
        })
        const json = await res.json() as { data: unknown; error: string | null }
        if (!res.ok || json.error) {
          setPayError(json.error ?? 'Erro ao aplicar cupão.')
          setPaying(false)
          return
        }
      } catch {
        setPayError('Erro ao aplicar cupão. Tente novamente.')
        setPaying(false)
        return
      }
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPayError('Erro interno: elemento de cartão não encontrado.')
      setPaying(false)
      return
    }

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    })

    if (error) {
      setPayError(error.message ?? 'Erro ao processar o pagamento.')
      setPaying(false)
      return
    }

    // Stripe webhook confirms — redirect to confirmation page
    router.push(`/confirmacion?bookingId=${bookingId}`)
  }

  const canPay = !!(stripe && cardComplete && termsAccepted && !paying && !expired)

  return (
    <div className="space-y-5">
      {/* Card element — always visible once clientSecret is ready */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] font-semibold text-text-main">Dados do cartão</label>
          <span className="text-[11px] font-medium text-text-muted bg-surface px-2 py-0.5 rounded">
            Powered by Stripe
          </span>
        </div>
        <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(e.complete)
              if (e.error) setPayError(e.error.message ?? null)
              else setPayError(null)
            }}
          />
        </div>
        <p className="text-[11px] text-text-muted mt-1.5">
          Cartão de teste: <span className="font-mono">4242 4242 4242 4242</span> · data futura · qualquer CVV
        </p>
      </div>

      {/* Coupon section */}
      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-text-main flex items-center gap-1.5">
          <Tag size={14} />
          Código promocional
        </label>

        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-emerald-800 font-mono">{appliedCoupon.code}</p>
              <p className="text-[12px] text-emerald-700">{appliedCoupon.description} — {formatCurrency(appliedCoupon.discount)} de desconto</p>
            </div>
            <button
              onClick={removeCoupon}
              className="ml-3 text-emerald-600 hover:text-emerald-800 transition-colors"
              aria-label="Remover cupão"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleValidateCoupon() }}
              placeholder="Ex: DESCONTO10"
              className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-[14px] font-mono bg-white placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              disabled={couponValidating}
            />
            <button
              onClick={handleValidateCoupon}
              disabled={!couponCode.trim() || couponValidating}
              className="h-10 px-4 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              {couponValidating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Aplicar'}
            </button>
          </div>
        )}

        {couponError && (
          <p className="text-[12px] text-red-600">{couponError}</p>
        )}
      </div>

      {/* Terms checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
              termsAccepted ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
            }`}
          >
            {termsAccepted && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
        </div>
        <span className="text-[13px] text-text-muted leading-relaxed">
          Aceito os{' '}
          <Link href="/terms" className="text-primary underline hover:no-underline">
            Termos e Condições
          </Link>{' '}
          e a{' '}
          <Link href="/privacy" className="text-primary underline hover:no-underline">
            Política de Privacidade
          </Link>
        </span>
      </label>

      {/* Payment error */}
      {payError && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-700">
          {payError}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handlePay}
        disabled={!canPay}
        className="w-full h-14 rounded-xl bg-primary text-white font-bold text-[16px] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            A processar…
          </>
        ) : (
          <>
            <Lock size={18} />
            Confirmar e pagar — {formatCurrency(finalTotal)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[12px] text-text-muted">
        <Shield size={13} />
        <span>Pagamento 100% seguro e encriptado com SSL</span>
      </div>
    </div>
  )
}

// ─── Summary Panel ────────────────────────────────────────────────────────────

function SummaryPanel({ booking, discount }: { booking: Booking; discount: number }) {
  const { property } = booking
  const coverImage = property?.images[0] ?? null

  return (
    <div className="bg-white rounded-2xl border border-surface overflow-hidden shadow-soft">
      {/* Cover image */}
      {coverImage ? (
        <div className="relative w-full h-44">
          <Image
            src={coverImage.url}
            alt={coverImage.alt ?? property?.title ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
        </div>
      ) : (
        <div className="w-full h-28 bg-surface flex items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-text-muted">apartment</span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Property title + location */}
        <div>
          {property ? (
            <Link
              href={`/property/${property.slug}`}
              className="font-display font-semibold text-[17px] text-text-main hover:text-primary transition-colors line-clamp-2 leading-snug"
            >
              {property.title}
            </Link>
          ) : (
            <p className="font-display font-semibold text-[17px] text-text-main">Propriedade</p>
          )}
          {property && (
            <p className="text-[13px] text-text-muted mt-0.5">
              {property.city}, {property.country}
            </p>
          )}
        </div>

        <hr className="border-surface" />

        {/* Booking dates */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-[14px]">
            <span className="text-text-muted">Check-in</span>
            <span className="font-medium">{formatFullDate(booking.checkIn)}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-text-muted">Check-out</span>
            <span className="font-medium">{formatFullDate(booking.checkOut)}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-text-muted">Duração</span>
            <span className="font-medium">
              {booking.nights} noite{booking.nights !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-text-muted">Hóspedes</span>
            <span className="font-medium">
              {booking.guestCount} pessoa{booking.guestCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <hr className="border-surface" />

        {/* Price breakdown */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-[14px] text-text-muted">
            <span>
              {formatCurrency(booking.pricePerNight)} × {booking.nights} noite
              {booking.nights !== 1 ? 's' : ''}
            </span>
            <span>{formatCurrency(booking.pricePerNight * booking.nights)}</span>
          </div>
          <div className="flex justify-between text-[14px] text-text-muted">
            <span>Gastos de limpeza</span>
            <span>{formatCurrency(booking.cleaningFee)}</span>
          </div>
          {booking.securityDeposit > 0 && (
            <div className="flex justify-between text-[14px] text-text-muted">
              <span>Depósito de segurança</span>
              <span>{formatCurrency(booking.securityDeposit)}</span>
            </div>
          )}
          {property && (
            <div className="flex justify-between text-[14px] text-text-muted">
              <span>Cancelação</span>
              <span className="text-right max-w-[140px]">
                {CANCELLATION_LABELS[property.cancellationPolicy] ?? property.cancellationPolicy}
              </span>
            </div>
          )}
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-[14px] text-emerald-700 font-medium">
            <span className="flex items-center gap-1"><Tag size={13} /> Desconto (cupão)</span>
            <span>−{formatCurrency(discount)}</span>
          </div>
        )}

        <hr className="border-surface" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-[16px] text-text-main">Total</span>
          <div className="text-right">
            {discount > 0 && (
              <p className="text-[13px] text-text-muted line-through">{formatCurrency(booking.totalPrice)}</p>
            )}
            <span className="font-bold text-[22px] text-primary">
              {formatCurrency(Math.max(0, booking.totalPrice - discount))}
            </span>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[12px] text-text-muted bg-surface rounded-lg py-2.5">
          <Lock size={13} />
          <span>Pagamento 100% seguro</span>
        </div>
      </div>
    </div>
  )
}

// ─── Inner page (uses useSearchParams — requires Suspense boundary) ────────────

function CheckoutInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId') ?? ''

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const [expired, setExpired] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState(0)

  // Guard against double-calling the payment init in StrictMode
  const paymentInitRef = useRef(false)

  // ── Load booking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bookingId) {
      setBookingError('ID de reserva em falta.')
      setLoadingBooking(false)
      return
    }

    fetch(`/api/reservations/${bookingId}`)
      .then((r) => r.json())
      .then((json: { data: Booking | null; error: string | null }) => {
        if (json.error || !json.data) {
          setBookingError(json.error ?? 'Reserva não encontrada.')
          return
        }

        const b = json.data

        // Already paid → go to confirmation
        if (b.paymentStatus === 'PAID') {
          router.replace(`/confirmacion?bookingId=${bookingId}`)
          return
        }

        // Terminal statuses
        if (b.status === 'CANCELLED' || b.status === 'COMPLETED') {
          setBookingError('Esta reserva já foi cancelada ou concluída.')
          return
        }

        // Already expired before loading
        if (b.expiresAt && new Date(b.expiresAt).getTime() <= Date.now()) {
          if (b.property?.slug) {
            const p = new URLSearchParams()
            p.set('checkIn', b.checkIn.split('T')[0])
            p.set('checkOut', b.checkOut.split('T')[0])
            p.set('guests', String(b.guestCount))
            router.replace(`/property/${b.property.slug}?${p.toString()}`)
          } else {
            setBookingError('A reserva expirou. Por favor inicie uma nova pesquisa.')
          }
          return
        }

        setBooking(b)
      })
      .catch(() => setBookingError('Erro ao carregar reserva.'))
      .finally(() => setLoadingBooking(false))
  }, [bookingId, router])

  // ── Init Stripe PaymentIntent as soon as booking is ready ────────────────
  useEffect(() => {
    if (!booking || paymentInitRef.current || clientSecret) return
    paymentInitRef.current = true
    setLoadingPayment(true)

    const origin = window.location.origin

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        successUrl: `${origin}/confirmacion?bookingId=${bookingId}`,
        cancelUrl: `${origin}/checkout?bookingId=${bookingId}`,
      }),
    })
      .then((r) => r.json())
      .then((json: { data: { clientSecret: string } | null; error: string | null }) => {
        if (json.error || !json.data) {
          setPaymentError(
            typeof json.error === 'string' ? json.error : 'Erro ao iniciar pagamento.',
          )
          return
        }
        setClientSecret(json.data.clientSecret)
      })
      .catch(() => setPaymentError('Erro de ligação. Por favor tente novamente.'))
      .finally(() => setLoadingPayment(false))
  }, [booking, bookingId, clientSecret])

  // ── Retry payment init ───────────────────────────────────────────────────
  function retryPaymentInit() {
    paymentInitRef.current = false
    setPaymentError(null)
    setClientSecret(null) // triggers the useEffect above
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f9fafb] text-text-main antialiased min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-display font-bold text-[18px] tracking-tight text-text-main"
          >
            ReservationGonzalo
          </Link>
          <div className="flex items-center gap-1.5 text-[13px] text-text-muted">
            <Shield size={14} />
            <span>Checkout seguro</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-surface bg-white hover:bg-surface transition-colors"
            aria-label="Voltar"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </Link>
          <h1 className="text-[22px] font-display font-bold text-text-main">Confirmar e pagar</h1>
        </div>

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loadingBooking && (
          <div className="flex items-center justify-center py-24 gap-3">
            <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-[15px] text-text-muted">A carregar reserva…</span>
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {!loadingBooking && bookingError && (
          <div className="max-w-sm mx-auto rounded-2xl bg-red-50 border border-red-100 px-6 py-10 text-center">
            <span className="material-symbols-outlined text-[52px] text-red-400">error</span>
            <p className="text-red-700 font-medium mt-3 mb-6 text-[15px]">{bookingError}</p>
            <Link
              href="/"
              className="inline-block text-[14px] font-bold text-primary border border-primary rounded-lg px-5 py-2.5 hover:bg-primary/5 transition-colors"
            >
              Voltar ao início
            </Link>
          </div>
        )}

        {/* ── Main layout ────────────────────────────────────────────────── */}
        {!loadingBooking && booking && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

            {/* ── LEFT: form ─────────────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-4">

              {/* Countdown */}
              {booking.expiresAt && (
                <CountdownBanner
                  expiresAt={booking.expiresAt}
                  redirectUrl={(() => {
                    const slug = booking.property?.slug ?? ''
                    const p = new URLSearchParams()
                    p.set('checkIn', booking.checkIn.split('T')[0])
                    p.set('checkOut', booking.checkOut.split('T')[0])
                    p.set('guests', String(booking.guestCount))
                    return `/property/${slug}?${p.toString()}`
                  })()}
                  onExpire={() => setExpired(true)}
                />
              )}

              {/* Section 1 — Guest details (read-only, from booking) */}
              <div className="bg-white rounded-2xl border border-surface p-5 space-y-4">
                <h2 className="font-display font-semibold text-[17px] text-text-main">
                  1. Detalhes do hóspede
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                      Nome
                    </p>
                    <p className="text-[15px] font-medium text-text-main">{booking.guestName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                      Email
                    </p>
                    <p className="text-[15px] font-medium text-text-main">{booking.guestEmail}</p>
                  </div>
                  {booking.guestPhone && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                        Telefone
                      </p>
                      <p className="text-[15px] font-medium text-text-main">
                        {booking.guestPhone}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                      Hóspedes
                    </p>
                    <p className="text-[15px] font-medium text-text-main">
                      {booking.guestCount} pessoa{booking.guestCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2 — Payment */}
              <div className="bg-white rounded-2xl border border-surface p-5 space-y-4">
                <h2 className="font-display font-semibold text-[17px] text-text-main">
                  2. Detalhes do pagamento
                </h2>

                {/* Loading Stripe */}
                {loadingPayment && (
                  <div className="flex items-center gap-2.5 text-[14px] text-text-muted py-6">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                    A preparar pagamento seguro…
                  </div>
                )}

                {/* Stripe init error */}
                {paymentError && !loadingPayment && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 space-y-2">
                    <p className="text-[13px] text-red-700">{paymentError}</p>
                    <button
                      onClick={retryPaymentInit}
                      className="text-[13px] font-semibold text-primary underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* CardElement — rendered immediately once clientSecret is ready */}
                {clientSecret && !loadingPayment && (
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      clientSecret={clientSecret}
                      totalPrice={booking.totalPrice}
                      bookingId={bookingId}
                      expired={expired}
                      onDiscountChange={(discount) => setAppliedDiscount(discount)}
                    />
                  </Elements>
                )}
              </div>
            </div>

            {/* ── RIGHT: sticky summary ──────────────────────────────────── */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <SummaryPanel booking={booking} discount={appliedDiscount} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Page export — Suspense boundary required for useSearchParams ─────────────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen gap-3">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-[15px] text-text-muted">A carregar…</span>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  )
}
