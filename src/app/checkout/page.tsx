'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// ─── Stripe ───────────────────────────────────────────────────────────────────

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingSummary {
  id: string
  confirmationCode: string
  guestName: string
  checkIn: string
  checkOut: string
  nights: number
  pricePerNight: number
  cleaningFee: number
  totalPrice: number
  currency: string
  property: {
    title: string
    address: string
    city: string
  } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ─── Payment form (inside Elements context) ───────────────────────────────────

const CARD_ELEMENT_OPTIONS: React.ComponentProps<typeof CardElement>['options'] = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
}

function PaymentForm({
  clientSecret,
  successUrl,
}: {
  clientSecret: string
  successUrl: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardComplete, setCardComplete] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !cardComplete) return

    setPaying(true)
    setPayError(null)

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

    // Success — Stripe will fire the webhook; redirect to confirmation page
    window.location.href = successUrl
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Dados do cartão</label>
        <div className="rounded-2xl border border-gray-200 px-4 py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardComplete(e.complete)
              if (e.error) setPayError(e.error.message ?? null)
              else setPayError(null)
            }}
          />
        </div>
      </div>

      {payError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
          {payError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !cardComplete || paying}
        className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/80 disabled:opacity-60"
      >
        {paying ? 'A processar pagamento...' : 'Confirmar pagamento'}
      </button>
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <span className="material-symbols-outlined text-sm">lock</span>
        <span>Pagamento seguro encriptado de 256 bits</span>
      </div>
    </form>
  )
}

// ─── Booking summary card ─────────────────────────────────────────────────────

function SummaryCard({ booking }: { booking: BookingSummary }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-200/50">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Resumo da reserva
        </span>
        <h3 className="mt-1 text-lg font-bold font-display leading-tight">
          {booking.property?.title ?? 'Propriedade'}
        </h3>
        {booking.property && (
          <p className="text-sm text-gray-500">
            {booking.property.address}, {booking.property.city}
          </p>
        )}
      </div>

      <hr className="border-gray-100 mb-6" />

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Check-in</span>
          <span className="font-medium">{formatDate(booking.checkIn)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Check-out</span>
          <span className="font-medium">{formatDate(booking.checkOut)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Noites</span>
          <span className="font-medium">{booking.nights}</span>
        </div>
      </div>

      <hr className="border-gray-100 mb-6" />

      <div className="space-y-3">
        <h4 className="text-sm font-bold">Detalhe do preço</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {formatCurrency(booking.pricePerNight)} × {booking.nights} noite
              {booking.nights !== 1 ? 's' : ''}
            </span>
            <span>{formatCurrency(booking.pricePerNight * booking.nights)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Limpeza</span>
            <span>{formatCurrency(booking.cleaningFee)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-100 font-bold text-base">
            <span>Total (EUR)</span>
            <span>{formatCurrency(booking.totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId') ?? ''

  const [booking, setBooking] = useState<BookingSummary | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(true)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null)

  // Load booking summary
  useEffect(() => {
    if (!bookingId) {
      setBookingError('ID de reserva em falta.')
      setLoadingBooking(false)
      return
    }

    fetch(`/api/reservations/${bookingId}`)
      .then((r) => r.json())
      .then((json: { data: BookingSummary | null; error: string | null }) => {
        if (json.error || !json.data) {
          setBookingError(json.error ?? 'Reserva não encontrada.')
        } else {
          setBooking(json.data)
        }
      })
      .catch(() => setBookingError('Erro ao carregar reserva.'))
      .finally(() => setLoadingBooking(false))
  }, [bookingId])

  const successUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/confirmacion?bookingId=${bookingId}`
      : `/confirmacion?bookingId=${bookingId}`

  const cancelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/confirmacion?error=cancelled`
      : `/confirmacion?error=cancelled`

  const initPayment = useCallback(async () => {
    setInitiatingPayment(true)
    setPaymentInitError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, successUrl, cancelUrl }),
      })
      const json: { data: { clientSecret: string } | null; error: string | null } =
        await res.json()

      if (!res.ok || json.error || !json.data) {
        setPaymentInitError(
          typeof json.error === 'string'
            ? json.error
            : 'Erro ao iniciar pagamento.',
        )
        return
      }

      setClientSecret(json.data.clientSecret)
    } catch {
      setPaymentInitError('Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setInitiatingPayment(false)
    }
  }, [bookingId, successUrl, cancelUrl])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white text-text-main antialiased min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold tracking-tight font-display">ReservationGonzalo</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </Link>
          <h1 className="text-3xl font-bold font-display">Confirmar e pagar</h1>
        </div>

        {/* Loading booking */}
        {loadingBooking && (
          <div className="flex items-center justify-center py-24">
            <svg
              className="h-8 w-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="ml-3 text-gray-500">A carregar reserva...</span>
          </div>
        )}

        {/* Booking load error */}
        {!loadingBooking && bookingError && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-6 py-8 text-center max-w-md mx-auto">
            <p className="text-red-700 font-medium mb-4">{bookingError}</p>
            <Link href="/" className="text-sm font-bold underline">Voltar ao início</Link>
          </div>
        )}

        {/* Main content */}
        {!loadingBooking && booking && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* Left: payment */}
            <div className="lg:col-span-7 space-y-8">
              {!clientSecret ? (
                <div className="space-y-6">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-4">
                    <p className="text-sm text-amber-800 font-medium">
                      A sua reserva está reservada por 15 minutos. Complete o pagamento para confirmar.
                    </p>
                  </div>

                  {paymentInitError && (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
                      {paymentInitError}
                      <button
                        onClick={() => setPaymentInitError(null)}
                        className="ml-2 underline font-semibold"
                      >
                        Tentar novamente
                      </button>
                    </p>
                  )}

                  <button
                    onClick={initPayment}
                    disabled={initiatingPayment}
                    className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/80 disabled:opacity-60"
                  >
                    {initiatingPayment ? 'A preparar pagamento...' : 'Pagar agora'}
                  </button>
                </div>
              ) : (
                <Elements stripe={stripePromise}>
                  <PaymentForm clientSecret={clientSecret} successUrl={successUrl} />
                </Elements>
              )}
            </div>

            {/* Right: summary */}
            <div className="lg:col-span-5">
              <SummaryCard booking={booking} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
