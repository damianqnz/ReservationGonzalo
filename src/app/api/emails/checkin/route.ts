import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { checkinReminderSchema } from '@/domains/notification/validations/notificationSchema'

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildEmailHtml(params: {
  guestName:          string
  propertyTitle:      string
  checkIn:            string
  checkOut:           string
  unitName:           string
  accessCode:         string | null
  wifiName:           string | null
  wifiPassword:       string | null
  floor:              string | null
  accessInstructions: string | null
  contactPhone:       string | null
}): string {
  const {
    guestName, propertyTitle, checkIn, checkOut, unitName,
    accessCode, wifiName, wifiPassword, floor, accessInstructions, contactPhone,
  } = params

  const row = (icon: string, label: string, value: string | null) =>
    value
      ? `<tr>
          <td style="padding:8px 12px;color:#64748b;font-size:13px;width:120px;">${icon} ${label}</td>
          <td style="padding:8px 12px;color:#1a1a2e;font-size:13px;font-weight:600;">${value}</td>
         </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#8b1a1a;padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Bem-vindo/a ao ${propertyTitle}! 🏠</h1>
            <p style="margin:8px 0 0;color:#e8c4c4;font-size:14px;">${unitName} · ${checkIn} → ${checkOut}</p>
          </td>
        </tr>
        <!-- Greeting -->
        <tr>
          <td style="padding:28px 32px 16px;">
            <p style="margin:0;color:#1a1a2e;font-size:16px;">Olá <strong>${guestName}</strong>! 👋</p>
            <p style="margin:12px 0 0;color:#64748b;font-size:14px;line-height:1.6;">
              Estamos muito contentes por tê-lo/a connosco. Aqui estão todos os dados de que vai precisar para uma estadia perfeita.
            </p>
          </td>
        </tr>
        <!-- Access data -->
        <tr>
          <td style="padding:0 32px 24px;">
            <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Dados de Acesso</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
              ${row('🔑', 'Código', accessCode)}
              ${row('📶', 'WiFi', wifiName ? `${wifiName}${wifiPassword ? ` / ${wifiPassword}` : ''}` : null)}
              ${row('🏠', 'Localização', floor)}
              ${row('📞', 'Contacto', contactPhone)}
            </table>
            ${accessInstructions
              ? `<div style="margin-top:16px;padding:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;">
                   <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:.05em;">📋 Instruções de chegada</p>
                   <p style="margin:0;font-size:14px;color:#1a1a2e;white-space:pre-wrap;line-height:1.6;">${accessInstructions}</p>
                 </div>`
              : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#64748b;font-size:13px;">Boa estadia! 😊</p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">ReservationGonzalo · Lisboa, Portugal</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * POST /api/emails/checkin
 * Sends check-in instructions email to the guest via Resend.
 * Auth: OWNER or ADMIN required.
 */
export async function POST(req: NextRequest) {
  // Auth
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  // Validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = checkinReminderSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Fetch booking with property
  const booking = await db.booking.findUnique({
    where: { id: result.data.bookingId },
    select: {
      id:         true,
      guestName:  true,
      guestEmail: true,
      checkIn:    true,
      checkOut:   true,
      property: {
        select: {
          id:                 true,
          title:              true,
          ownerId:            true,
          accessCode:         true,
          wifiName:           true,
          wifiPassword:       true,
          floor:              true,
          accessInstructions: true,
          contactPhone:       true,
        },
      },
      room: { select: { name: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ data: null, error: 'Booking not found.' }, { status: 404 })
  }

  // OWNER: verify ownership
  if (session.user.role === 'OWNER' && booking.property.ownerId !== session.user.id) {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const RESEND_API_KEY   = process.env.RESEND_API_KEY
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@reservationgonzalo.com'

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { data: null, error: 'Email service not configured. Set RESEND_API_KEY.' },
      { status: 503 },
    )
  }

  const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const fmtD = (d: Date) => `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  const p = booking.property
  const unitName = booking.room?.name ?? p.title

  const html = buildEmailHtml({
    guestName:          booking.guestName,
    propertyTitle:      p.title,
    checkIn:            fmtD(booking.checkIn),
    checkOut:           fmtD(booking.checkOut),
    unitName,
    accessCode:         p.accessCode,
    wifiName:           p.wifiName,
    wifiPassword:       p.wifiPassword,
    floor:              p.floor,
    accessInstructions: p.accessInstructions,
    contactPhone:       p.contactPhone,
  })

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    RESEND_FROM_EMAIL,
        to:      booking.guestEmail,
        subject: `Bem-vindo/a ao ${p.title}! 🏠 Dados de acesso`,
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('[emails/checkin/POST] Resend error', err)
      return NextResponse.json(
        { data: null, error: 'Failed to send email.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ data: { sent: true }, error: null })
  } catch (error) {
    console.error('[emails/checkin/POST]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
