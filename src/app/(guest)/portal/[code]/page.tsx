import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, Download } from 'lucide-react'
import { findGuestBookingByCode } from '@/domains/booking/services/guestService'
import type { GuestBooking } from '@/domains/booking/types'
import { resolveImageUrl } from '@/shared/lib/cloudinary'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDatePT(date: Date) {
  return new Date(date).toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatEUR(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(value)
}

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: 'Confirmada', className: 'bg-green-100 text-green-800' },
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-800' },
  COMPLETED: { label: 'Concluída', className: 'bg-stone-100 text-stone-600' },
  NO_SHOW: {
    label: 'Não compareceu',
    className: 'bg-stone-100 text-stone-600',
  },
}

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  UNPAID: { label: 'Por pagar', className: 'bg-red-100 text-red-800' },
  PARTIAL: { label: 'Parcialmente pago', className: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Pago', className: 'bg-green-100 text-green-800' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-blue-100 text-blue-800' },
}

const POLICY_LABEL: Record<string, string> = {
  FLEXIBLE: 'Flexível',
  MODERATE: 'Moderada',
  STRICT: 'Estrita',
}

const ROOM_TYPE_LABEL: Record<string, string> = {
  SINGLE: 'Individual',
  DOUBLE: 'Duplo',
  TWIN: 'Twin',
  SUITE: 'Suite',
  JUNIOR_SUITE: 'Suite Junior',
  FAMILY: 'Familiar',
  STUDIO: 'Estúdio',
  ENTIRE_PLACE: 'Alojamento completo',
}

function Badge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}

// ── Price row ─────────────────────────────────────────────────────────────────

function PriceRow({
  label,
  value,
  bold = false,
  negative = false,
}: {
  label: string
  value: string
  bold?: boolean
  negative?: boolean
}) {
  return (
    <div
      className={`flex justify-between items-center text-sm ${bold ? 'font-semibold text-stone-800' : 'text-stone-600'}`}
    >
      <span>{label}</span>
      <span className={negative ? 'text-green-700' : ''}>{value}</span>
    </div>
  )
}

// ── Not found ─────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h1 className="font-display text-xl font-semibold text-stone-800 mb-2">
        Reserva não encontrada
      </h1>
      <p className="text-sm text-stone-500 mb-6">
        O código que introduziu não corresponde a nenhuma reserva.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8b1a1a] hover:underline"
      >
        <ArrowLeft size={14} />
        Tentar novamente
      </Link>
    </div>
  )
}

// ── Booking detail ─────────────────────────────────────────────────────────────

function BookingDetail({ booking }: { booking: GuestBooking }) {
  const coverImage = booking.property.images[0]
  const statusCfg = STATUS_CONFIG[booking.status] ?? {
    label: booking.status,
    className: 'bg-stone-100 text-stone-600',
  }
  const paymentCfg = PAYMENT_STATUS_CONFIG[booking.paymentStatus] ?? {
    label: booking.paymentStatus,
    className: 'bg-stone-100 text-stone-600',
  }
  const subtotal = booking.pricePerNight * booking.nights
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    `${booking.property.address}, ${booking.property.city}`
  )}`

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

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b1a1a] mb-1">
              {booking.confirmationCode}
            </p>
            <h1 className="font-display text-2xl font-semibold text-stone-800">
              {booking.property.title}
            </h1>
            {booking.room && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-stone-500 text-sm">
                  {booking.room.name}
                </span>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                  {ROOM_TYPE_LABEL[booking.room.type] ?? booking.room.type}
                </span>
              </div>
            )}
          </div>
          <Badge label={statusCfg.label} className={statusCfg.className} />
        </div>

        {/* Cover image */}
        {coverImage && (
          <div className="aspect-video w-full overflow-hidden rounded-xl mb-6">
            <img
              src={resolveImageUrl(coverImage, { width: 900 })}
              alt={coverImage.alt ?? booking.property.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Info cards */}
        <div className="space-y-4">
          {/* Dates */}
          <section className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-display font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-[#8b1a1a]" />
              Datas da estadia
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Check-in
                </p>
                <p className="text-sm font-medium text-stone-800 capitalize">
                  {formatDatePT(booking.checkIn)}
                </p>
                <p className="text-xs text-stone-500">
                  A partir das {booking.property.checkInTime}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Check-out
                </p>
                <p className="text-sm font-medium text-stone-800 capitalize">
                  {formatDatePT(booking.checkOut)}
                </p>
                <p className="text-xs text-stone-500">
                  Até às {booking.property.checkOutTime}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-4 text-sm text-stone-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-stone-400" />
                {booking.nights} noites
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-stone-400" />
                {booking.guestCount}{' '}
                {booking.guestCount === 1 ? 'hóspede' : 'hóspedes'}
              </span>
            </div>
          </section>

          {/* Price breakdown */}
          <section className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-display font-semibold text-stone-800 mb-4">
              Resumo de preços
            </h2>
            <div className="space-y-2.5">
              <PriceRow
                label={`${formatEUR(booking.pricePerNight)} × ${booking.nights} noites`}
                value={formatEUR(subtotal)}
              />
              {booking.cleaningFee > 0 && (
                <PriceRow
                  label="Limpeza"
                  value={formatEUR(booking.cleaningFee)}
                />
              )}
              {booking.securityDeposit > 0 && (
                <PriceRow
                  label="Depósito de segurança"
                  value={formatEUR(booking.securityDeposit)}
                />
              )}
              {booking.discountAmount && booking.discountAmount > 0 && (
                <PriceRow
                  label="Desconto"
                  value={`-${formatEUR(booking.discountAmount)}`}
                  negative
                />
              )}
              <div className="pt-2 border-t border-stone-200">
                <PriceRow
                  label="Total pago"
                  value={`${formatEUR(booking.totalPrice)} ${booking.currency}`}
                  bold
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-stone-500">
                  Estado do pagamento
                </span>
                <Badge
                  label={paymentCfg.label}
                  className={paymentCfg.className}
                />
              </div>
            </div>
          </section>

          {/* Cancellation policy */}
          <section className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-display font-semibold text-stone-800 mb-2">
              Política de cancelamento
            </h2>
            <p className="text-sm text-stone-600">
              {POLICY_LABEL[booking.property.cancellationPolicy] ??
                booking.property.cancellationPolicy}
            </p>
          </section>

          {/* Como chegar */}
          <section className="bg-white rounded-xl border border-stone-200 p-5">
            <h2 className="font-display font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-[#8b1a1a]" />
              Como chegar
            </h2>
            <p className="text-sm text-stone-600 mb-3">
              {booking.property.address}
              <br />
              {booking.property.city}, {booking.property.country}
            </p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8b1a1a] hover:underline"
            >
              <MapPin size={14} />
              Abrir no Google Maps
            </a>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`/api/guest/bookings/${booking.id}/pdf?code=${encodeURIComponent(booking.confirmationCode)}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#6d1414] text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              <Download size={15} />
              Descarregar confirmação PDF
            </a>
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center gap-2 border border-stone-200 text-stone-700 font-semibold py-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
            >
              <ArrowLeft size={15} />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page export ──────────────────────────────────────────────────────────────

export default async function PortalCodePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const booking = await findGuestBookingByCode(decodeURIComponent(code))

  if (!booking) return <NotFound />
  return <BookingDetail booking={booking} />
}
