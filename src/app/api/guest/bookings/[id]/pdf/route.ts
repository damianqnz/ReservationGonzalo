import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rateLimiter'
import { findGuestBookingById } from '@/lib/services/guestService'

const querySchema = z.object({
  code: z.string().min(1).max(32),
})

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 2)}***@${domain}`
}

function formatDatePT(date: Date): string {
  return date.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: 'Por pagar',
  PARTIAL: 'Parcialmente pago',
  PAID: 'Pago',
  REFUNDED: 'Reembolsado',
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (!checkRateLimit(`guest-pdf:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests' },
      { status: 429 }
    )
  }

  const { id } = await params

  const parsed = querySchema.safeParse({
    code: req.nextUrl.searchParams.get('code') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: 'code param is required' },
      { status: 400 }
    )
  }

  try {
    const booking = await findGuestBookingById(id)

    if (!booking) {
      return NextResponse.json(
        { data: null, error: 'Not found' },
        { status: 404 }
      )
    }

    if (booking.confirmationCode !== parsed.data.code) {
      return NextResponse.json(
        { data: null, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Build PDF with jsPDF
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const W = 210 // A4 width mm
    const margin = 20
    let y = 20

    const line = () => {
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, W - margin, y)
      y += 6
    }

    const text = (
      str: string,
      x: number,
      size = 10,
      style: 'normal' | 'bold' = 'normal',
      color: [number, number, number] = [30, 30, 30]
    ) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', style)
      doc.setTextColor(...color)
      doc.text(str, x, y)
    }

    // ── Header ──────────────────────────────────────────────────────────────
    text('ReservationGonzalo', W / 2, 18, 'bold', [139, 26, 26])
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 26, 26)
    doc.text('ReservationGonzalo', W / 2, y, { align: 'center' })
    y += 7

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Confirmação de Reserva', W / 2, y, { align: 'center' })
    y += 10

    line()

    // ── Confirmation code ────────────────────────────────────────────────────
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text(booking.confirmationCode, W / 2, y, { align: 'center' })
    y += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Estado: ${BOOKING_STATUS_LABEL[booking.status] ?? booking.status}`,
      W / 2,
      y,
      { align: 'center' }
    )
    y += 10
    line()

    // ── Guest info ───────────────────────────────────────────────────────────
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Hóspede', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Nome: ${booking.guestName}`, margin, y)
    y += 5
    doc.text(`Email: ${maskEmail(booking.guestEmail)}`, margin, y)
    y += 5
    doc.text(`Hóspedes: ${booking.guestCount}`, margin, y)
    y += 10
    line()

    // ── Property / Room ──────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.text('Alojamento', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(`Propriedade: ${booking.property.title}`, margin, y)
    y += 5
    if (booking.room) {
      doc.text(`Quarto: ${booking.room.name}`, margin, y)
      y += 5
    }
    doc.text(
      `Endereço: ${booking.property.address}, ${booking.property.city}, ${booking.property.country}`,
      margin,
      y
    )
    y += 10
    line()

    // ── Dates ────────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.text('Datas da Estadia', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Check-in:  ${formatDatePT(booking.checkIn)} às ${booking.property.checkInTime}`,
      margin,
      y
    )
    y += 5
    doc.text(
      `Check-out: ${formatDatePT(booking.checkOut)} às ${booking.property.checkOutTime}`,
      margin,
      y
    )
    y += 5
    doc.text(`Noites: ${booking.nights}`, margin, y)
    y += 10
    line()

    // ── Price breakdown ──────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo de Preços', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')

    const subtotal = booking.pricePerNight * booking.nights
    doc.text(
      `${formatEUR(booking.pricePerNight)} × ${booking.nights} noites`,
      margin,
      y
    )
    doc.text(formatEUR(subtotal), W - margin, y, { align: 'right' })
    y += 5

    if (booking.cleaningFee > 0) {
      doc.text('Limpeza', margin, y)
      doc.text(formatEUR(booking.cleaningFee), W - margin, y, { align: 'right' })
      y += 5
    }

    if (booking.securityDeposit > 0) {
      doc.text('Depósito de segurança', margin, y)
      doc.text(formatEUR(booking.securityDeposit), W - margin, y, {
        align: 'right',
      })
      y += 5
    }

    if (booking.discountAmount && booking.discountAmount > 0) {
      doc.text('Desconto', margin, y)
      doc.setTextColor(0, 150, 0)
      doc.text(`-${formatEUR(booking.discountAmount)}`, W - margin, y, {
        align: 'right',
      })
      doc.setTextColor(30, 30, 30)
      y += 5
    }

    y += 2
    line()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total pago', margin, y)
    doc.text(
      `${formatEUR(booking.totalPrice)} ${booking.currency}`,
      W - margin,
      y,
      { align: 'right' }
    )
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Estado do pagamento: ${PAYMENT_STATUS_LABEL[booking.paymentStatus] ?? booking.paymentStatus}`,
      margin,
      y
    )
    y += 14
    line()

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(139, 26, 26)
    doc.text('Obrigado pela sua reserva.', W / 2, y, { align: 'center' })
    y += 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(
      'ReservationGonzalo — reservas@reservationgonzalo.pt',
      W / 2,
      y,
      { align: 'center' }
    )

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reserva-${booking.confirmationCode}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/guest/bookings/[id]/pdf]', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
