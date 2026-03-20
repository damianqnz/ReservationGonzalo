import { redirect } from 'next/navigation'
import { getReservation } from '@/lib/services/reservationService'
import { BookingStatus } from '@prisma/client'
import PendingPolling from './PendingPolling'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ bookingId?: string; error?: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ─── UI sub-components ────────────────────────────────────────────────────────

function CancelledCard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="material-symbols-outlined text-3xl text-red-500">cancel</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold font-display">Pagamento cancelado</h1>
        <p className="mb-8 text-gray-500">
          O pagamento foi cancelado. A sua reserva ainda está pendente.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar ao início
        </a>
      </div>
    </div>
  )
}

function NotFoundCard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xl">
        <h1 className="mb-3 text-2xl font-bold font-display">Reserva não encontrada</h1>
        <p className="mb-8 text-gray-500">Não foi possível encontrar a sua reserva.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar ao início
        </a>
      </div>
    </div>
  )
}

function ConfirmedCard({
  booking,
}: {
  booking: Awaited<ReturnType<typeof getReservation>>
}) {
  if (!booking) return null
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-10 shadow-xl">
        {/* Success header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span
              className="material-symbols-outlined text-3xl text-green-600"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              check_circle
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold font-display">Reserva Confirmada!</h1>
          <p className="text-gray-500">O seu pagamento foi processado com sucesso.</p>
        </div>

        {/* Confirmation code */}
        <div className="mb-6 rounded-xl bg-green-50 px-6 py-4 text-center border border-green-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-700 mb-1">
            Código de confirmação
          </p>
          <p className="text-3xl font-bold tracking-widest text-green-800 font-display">
            {booking.confirmationCode}
          </p>
        </div>

        {/* Booking summary */}
        <div className="space-y-3 mb-8">
          {booking.property && (
            <SummaryRow
              icon="home"
              label="Propriedade"
              value={booking.property.title}
            />
          )}
          <SummaryRow
            icon="calendar_today"
            label="Check-in"
            value={formatDate(booking.checkIn)}
          />
          <SummaryRow
            icon="calendar_today"
            label="Check-out"
            value={formatDate(booking.checkOut)}
          />
          <SummaryRow
            icon="nights_stay"
            label="Noites"
            value={`${booking.nights} noite${booking.nights !== 1 ? 's' : ''}`}
          />
          <div className="flex justify-between border-t border-gray-100 pt-3 font-bold">
            <span>Total pago</span>
            <span>{formatCurrency(booking.totalPrice)}</span>
          </div>
        </div>

        {/* CTA */}
        <a
          href="/dashboard"
          className="block w-full rounded-2xl bg-primary py-4 text-center text-lg font-bold text-white shadow-lg transition hover:bg-primary/80"
        >
          Ver detalhes da reserva
        </a>
      </div>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
      </div>
      <span className="font-medium">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ConfirmacaoPage({ searchParams }: PageProps) {
  const { bookingId, error } = await searchParams

  if (error) {
    return <CancelledCard />
  }

  if (!bookingId) {
    redirect('/')
  }

  const booking = await getReservation(bookingId)

  if (!booking) {
    return <NotFoundCard />
  }

  if (booking.status === BookingStatus.CONFIRMED) {
    return <ConfirmedCard booking={booking} />
  }

  // PENDING or any other status → show polling UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <PendingPolling bookingId={bookingId} />
    </div>
  )
}
