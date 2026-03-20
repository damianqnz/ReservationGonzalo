'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Euro } from 'lucide-react'
import type { GuestBooking } from '@/lib/services/guestService'

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: 'Confirmada',
    className: 'bg-green-100 text-green-800',
  },
  PENDING: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-800',
  },
  COMPLETED: {
    label: 'Concluída',
    className: 'bg-stone-100 text-stone-600',
  },
  NO_SHOW: {
    label: 'Não compareceu',
    className: 'bg-stone-100 text-stone-600',
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-stone-100 text-stone-600',
  }
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

// ── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: GuestBooking }) {
  const checkIn = new Date(booking.checkIn).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const checkOut = new Date(booking.checkOut).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const total = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: booking.currency,
  }).format(booking.totalPrice)

  const coverImage = booking.property.images[0]

  return (
    <article className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
      {coverImage && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={coverImage.url}
            alt={coverImage.alt ?? booking.property.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b1a1a] mb-0.5">
              {booking.confirmationCode}
            </p>
            <h2 className="font-display font-semibold text-stone-800 leading-snug">
              {booking.property.title}
            </h2>
            {booking.room && (
              <p className="text-sm text-stone-500 mt-0.5">{booking.room.name}</p>
            )}
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Calendar size={14} className="shrink-0 text-stone-400" />
            <span>
              {checkIn} → {checkOut}
            </span>
            <span className="text-stone-400">· {booking.nights} noites</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <MapPin size={14} className="shrink-0 text-stone-400" />
            <span>
              {booking.property.city}, {booking.property.country}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Euro size={14} className="shrink-0 text-stone-400" />
            <span>{total}</span>
          </div>
        </div>

        <Link
          href={`/portal/${booking.confirmationCode}`}
          className="block w-full text-center bg-[#8b1a1a] hover:bg-[#6d1414] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}

// ── Main content ─────────────────────────────────────────────────────────────

function PortalListContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email')

  const [bookings, setBookings] = useState<GuestBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) {
      router.replace('/login')
      return
    }

    let cancelled = false

    async function load() {
      try {
        const res = await fetch(
          `/api/guest/bookings?email=${encodeURIComponent(email!)}`
        )
        const json = await res.json()

        if (cancelled) return

        if (!res.ok) {
          if (res.status === 429) {
            setError('Demasiadas tentativas. Tente mais tarde.')
          } else {
            setError('Erro ao carregar as reservas.')
          }
          return
        }

        setBookings(json.data ?? [])
      } catch {
        if (!cancelled) setError('Erro ao carregar as reservas.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [email, router])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <h1 className="font-display text-2xl font-semibold text-stone-800 mb-1">
          As minhas reservas
        </h1>
        {email && (
          <p className="text-sm text-stone-500 mb-8">
            Reservas associadas a <span className="font-medium">{email}</span>
          </p>
        )}

        {loading && (
          <div className="text-center py-16 text-stone-400 text-sm">
            A carregar...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-500 text-sm">Nenhuma reserva encontrada.</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-semibold text-[#8b1a1a] hover:underline"
            >
              Tentar com outro email ou código
            </Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="grid gap-5">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page export ──────────────────────────────────────────────────────────────

export default function PortalListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm">
          A carregar...
        </div>
      }
    >
      <PortalListContent />
    </Suspense>
  )
}
