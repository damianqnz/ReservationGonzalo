import * as React from 'react'
import { Resend } from 'resend'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Heading,
} from '@react-email/components'

// ─── Resend singleton ─────────────────────────────────────────────────────────

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
  return new Resend(process.env.RESEND_API_KEY)
}

function getFrom(): string {
  if (!process.env.RESEND_FROM_EMAIL) throw new Error('RESEND_FROM_EMAIL is not set')
  return process.env.RESEND_FROM_EMAIL
}

import type { BookingWithProperty, EmailResult } from '@/domains/notification/types'

export type { BookingWithProperty, EmailResult }

/** Prisma select shape that satisfies BookingWithProperty */
export const EMAIL_BOOKING_SELECT = {
  id: true,
  confirmationCode: true,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  pricePerNight: true,
  cleaningFee: true,
  securityDeposit: true,
  totalPrice: true,
  currency: true,
  property: {
    select: {
      title: true,
      address: true,
      city: true,
      country: true,
      checkInTime: true,
      checkOutTime: true,
    },
  },
} as const

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(date: Date): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const styles = {
  body: { backgroundColor: '#f5f5f0', fontFamily: 'Arial, sans-serif' },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden' as const,
  },
  header: {
    backgroundColor: '#1a1a2e',
    padding: '24px 32px',
  },
  headerText: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
  },
  body_section: { padding: '32px' },
  heading: { color: '#1a1a2e', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' },
  text: { color: '#444444', fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' },
  textSmall: { color: '#666666', fontSize: '13px', lineHeight: '20px', margin: '0 0 8px' },
  codeBox: {
    backgroundColor: '#f5f5f0',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px 24px',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  codeText: {
    color: '#1a1a2e',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    margin: 0,
  },
  label: { color: '#888888', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 2px' },
  value: { color: '#1a1a2e', fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px' },
  button: {
    backgroundColor: '#8b1a1a',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 'bold',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  hr: { borderColor: '#eeeeee', margin: '24px 0' },
  footer: { padding: '16px 32px', backgroundColor: '#f5f5f0' },
  footerText: { color: '#999999', fontSize: '12px', textAlign: 'center' as const, margin: 0 },
}

// ─── Email templates ──────────────────────────────────────────────────────────

function EmailHeader() {
  return (
    <Section style={styles.header}>
      <Text style={styles.headerText}>ReservationGonzalo</Text>
    </Section>
  )
}

function EmailFooter({ note = 'Obrigado pela sua reserva' }: { note?: string }) {
  return (
    <Section style={styles.footer}>
      <Text style={styles.footerText}>ReservationGonzalo — {note}</Text>
    </Section>
  )
}

// ── 1. Booking confirmation to guest ─────────────────────────────────────────

function BookingConfirmationEmail({ booking }: { booking: BookingWithProperty }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Text style={{ fontSize: '36px', textAlign: 'center', margin: '0 0 8px' }}>✅</Text>
            <Heading style={{ ...styles.heading, textAlign: 'center' }}>Reserva Confirmada!</Heading>
            <Text style={{ ...styles.text, textAlign: 'center', marginBottom: '24px' }}>
              O seu pagamento foi processado com sucesso.
            </Text>

            <div style={styles.codeBox}>
              <Text style={styles.label}>Código de confirmação</Text>
              <Text style={styles.codeText}>{booking.confirmationCode}</Text>
            </div>

            <Text style={{ ...styles.text, color: '#666666', textAlign: 'center', marginBottom: '24px' }}>
              Guarde este código para consultar a sua reserva.
            </Text>

            <Hr style={styles.hr} />

            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
                <Text style={styles.label}>Endereço</Text>
                <Text style={styles.value}>
                  {booking.property.address}, {booking.property.city}
                </Text>
              </>
            )}

            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>
              {fmtDate(booking.checkIn)}{booking.property ? ` às ${booking.property.checkInTime}` : ''}
            </Text>

            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>
              {fmtDate(booking.checkOut)}{booking.property ? ` às ${booking.property.checkOutTime}` : ''}
            </Text>

            <Text style={styles.label}>Noites</Text>
            <Text style={styles.value}>{booking.nights} noite{booking.nights !== 1 ? 's' : ''}</Text>

            <Hr style={styles.hr} />

            <Text style={{ ...styles.text, fontWeight: 'bold', marginBottom: '8px' }}>Detalhe do preço</Text>
            <Text style={styles.textSmall}>
              {fmtCurrency(booking.pricePerNight)} × {booking.nights} noite{booking.nights !== 1 ? 's' : ''}: {fmtCurrency(booking.pricePerNight * booking.nights)}
            </Text>
            {booking.cleaningFee > 0 && (
              <Text style={styles.textSmall}>Limpeza: {fmtCurrency(booking.cleaningFee)}</Text>
            )}
            {booking.securityDeposit > 0 && (
              <Text style={styles.textSmall}>Depósito de segurança: {fmtCurrency(booking.securityDeposit)}</Text>
            )}
            <Text style={{ ...styles.textSmall, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '4px' }}>
              Total: {fmtCurrency(booking.totalPrice)}
            </Text>

            <Hr style={styles.hr} />

            <Section style={{ textAlign: 'center' }}>
              <Button href={`${appUrl}/confirmacion?bookingId=${booking.id}`} style={styles.button}>
                Ver detalhes da reserva
              </Button>
            </Section>
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}

// ── 2. New booking notification to owner ─────────────────────────────────────

function NewBookingNotificationEmail({ booking }: { booking: BookingWithProperty }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Heading style={styles.heading}>Nova reserva recebida!</Heading>
            <Text style={styles.text}>
              Recebeu uma nova reserva com o código <strong>{booking.confirmationCode}</strong>.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.label}>Hóspede</Text>
            <Text style={styles.value}>{booking.guestName}</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{booking.guestEmail}</Text>
            {booking.guestPhone && (
              <>
                <Text style={styles.label}>Telefone</Text>
                <Text style={styles.value}>{booking.guestPhone}</Text>
              </>
            )}

            <Hr style={styles.hr} />

            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
              </>
            )}
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>{fmtDate(booking.checkIn)}</Text>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>{fmtDate(booking.checkOut)}</Text>
            <Text style={styles.label}>Noites</Text>
            <Text style={styles.value}>{booking.nights}</Text>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>{fmtCurrency(booking.totalPrice)}</Text>

            <Hr style={styles.hr} />

            <Section style={{ textAlign: 'center' }}>
              <Button href={`${appUrl}/dashboard/reservations/${booking.id}`} style={styles.button}>
                Ver reserva no dashboard
              </Button>
            </Section>
          </Section>
          <EmailFooter note="ReservationGonzalo — Painel do proprietário" />
        </Container>
      </Body>
    </Html>
  )
}

// ── 3. Check-in reminder to guest ────────────────────────────────────────────

function CheckInReminderGuestEmail({ booking }: { booking: BookingWithProperty }) {
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Text style={{ fontSize: '36px', textAlign: 'center', margin: '0 0 8px' }}>🔑</Text>
            <Heading style={{ ...styles.heading, textAlign: 'center' }}>
              O seu check-in é amanhã!
            </Heading>
            <Text style={{ ...styles.text, textAlign: 'center' }}>
              Estamos à sua espera. Aqui estão os detalhes para a sua chegada.
            </Text>

            <Hr style={styles.hr} />

            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
                <Text style={styles.label}>Endereço</Text>
                <Text style={styles.value}>
                  {booking.property.address}, {booking.property.city}
                </Text>
                <Text style={styles.label}>Hora de check-in</Text>
                <Text style={styles.value}>{booking.property.checkInTime}</Text>
              </>
            )}

            <Text style={styles.label}>Data de check-in</Text>
            <Text style={styles.value}>{fmtDate(booking.checkIn)}</Text>

            <Hr style={styles.hr} />

            <div style={styles.codeBox}>
              <Text style={styles.label}>O seu código de confirmação</Text>
              <Text style={styles.codeText}>{booking.confirmationCode}</Text>
            </div>

            <Text style={{ ...styles.textSmall, textAlign: 'center' }}>
              Em caso de dúvidas, contacte-nos respondendo a este email.
            </Text>
          </Section>
          <EmailFooter note="Boa estadia!" />
        </Container>
      </Body>
    </Html>
  )
}

// ── 4. Check-in reminder to owner ────────────────────────────────────────────

function CheckInReminderOwnerEmail({ booking }: { booking: BookingWithProperty }) {
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Heading style={styles.heading}>Check-in amanhã</Heading>
            <Text style={styles.text}>
              O hóspede <strong>{booking.guestName}</strong> faz check-in amanhã.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.label}>Hóspede</Text>
            <Text style={styles.value}>{booking.guestName}</Text>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{booking.guestEmail}</Text>
            {booking.guestPhone && (
              <>
                <Text style={styles.label}>Telefone</Text>
                <Text style={styles.value}>{booking.guestPhone}</Text>
              </>
            )}

            <Hr style={styles.hr} />

            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
                <Text style={styles.label}>Hora de check-in</Text>
                <Text style={styles.value}>{booking.property.checkInTime}</Text>
              </>
            )}
            <Text style={styles.label}>Data de check-in</Text>
            <Text style={styles.value}>{fmtDate(booking.checkIn)}</Text>
            <Text style={styles.label}>Noites</Text>
            <Text style={styles.value}>{booking.nights}</Text>
            <Text style={styles.label}>Total pago</Text>
            <Text style={styles.value}>{fmtCurrency(booking.totalPrice)}</Text>
          </Section>
          <EmailFooter note="ReservationGonzalo — Painel do proprietário" />
        </Container>
      </Body>
    </Html>
  )
}

// ── 5. Check-out reminder to owner ───────────────────────────────────────────

function CheckOutReminderOwnerEmail({ booking }: { booking: BookingWithProperty }) {
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Heading style={styles.heading}>Check-out hoje</Heading>
            <Text style={styles.text}>
              O hóspede <strong>{booking.guestName}</strong> faz check-out hoje.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.label}>Hóspede</Text>
            <Text style={styles.value}>{booking.guestName}</Text>
            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
                <Text style={styles.label}>Hora de check-out</Text>
                <Text style={styles.value}>{booking.property.checkOutTime}</Text>
              </>
            )}
            <Text style={styles.label}>Data de check-out</Text>
            <Text style={styles.value}>{fmtDate(booking.checkOut)}</Text>
          </Section>
          <EmailFooter note="ReservationGonzalo — Painel do proprietário" />
        </Container>
      </Body>
    </Html>
  )
}

// ── 6. Cancellation to guest ──────────────────────────────────────────────────

function CancellationEmail({
  booking,
  reason,
}: {
  booking: BookingWithProperty
  reason?: string
}) {
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Text style={{ fontSize: '36px', textAlign: 'center', margin: '0 0 8px' }}>❌</Text>
            <Heading style={{ ...styles.heading, textAlign: 'center' }}>
              A sua reserva foi cancelada
            </Heading>
            <Text style={{ ...styles.text, textAlign: 'center' }}>
              Lamentamos informar que a sua reserva foi cancelada.
            </Text>

            <Hr style={styles.hr} />

            <div style={styles.codeBox}>
              <Text style={styles.label}>Código de confirmação</Text>
              <Text style={{ ...styles.codeText, fontSize: '22px' }}>{booking.confirmationCode}</Text>
            </div>

            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
              </>
            )}
            <Text style={styles.label}>Check-in original</Text>
            <Text style={styles.value}>{fmtDate(booking.checkIn)}</Text>
            <Text style={styles.label}>Check-out original</Text>
            <Text style={styles.value}>{fmtDate(booking.checkOut)}</Text>

            {reason && (
              <>
                <Hr style={styles.hr} />
                <Text style={styles.label}>Motivo</Text>
                <Text style={styles.value}>{reason}</Text>
              </>
            )}

            <Hr style={styles.hr} />

            <Text style={styles.textSmall}>
              Se o pagamento foi efectuado, o reembolso será processado de acordo com a política de
              cancelamento. Em caso de dúvidas, contacte-nos respondendo a este email.
            </Text>
          </Section>
          <EmailFooter note="Pedimos desculpa pelo incómodo" />
        </Container>
      </Body>
    </Html>
  )
}

// ── 7. Review invitation to guest ────────────────────────────────────────────

function ReviewInvitationEmail({ booking }: { booking: BookingWithProperty }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return (
    <Html lang="pt">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <EmailHeader />
          <Section style={styles.body_section}>
            <Text style={{ fontSize: '36px', textAlign: 'center', margin: '0 0 8px' }}>⭐</Text>
            <Heading style={{ ...styles.heading, textAlign: 'center' }}>
              Como foi a sua estadia?
            </Heading>
            <Text style={{ ...styles.text, textAlign: 'center' }}>
              Esperamos que tenha gostado da sua estadia
              {booking.property ? ` em ${booking.property.title}` : ''}.
            </Text>

            <Hr style={styles.hr} />

            {booking.property && (
              <>
                <Text style={styles.label}>Propriedade</Text>
                <Text style={styles.value}>{booking.property.title}</Text>
              </>
            )}
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>{fmtDate(booking.checkIn)}</Text>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>{fmtDate(booking.checkOut)}</Text>

            <Hr style={styles.hr} />

            <Text style={{ ...styles.text, textAlign: 'center' }}>
              A sua opinião ajuda outros viajantes a escolher o alojamento certo.
              Partilhe a sua experiência — demora apenas 2 minutos!
            </Text>

            <Section style={{ textAlign: 'center', marginTop: '16px' }}>
              <Button href={`${appUrl}/review/${booking.id}`} style={styles.button}>
                Deixar avaliação
              </Button>
            </Section>
          </Section>
          <EmailFooter note="Obrigado por ter ficado connosco" />
        </Container>
      </Body>
    </Html>
  )
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Sends booking confirmation email to the guest after successful payment.
 * Contains confirmation code, property details, dates, and price breakdown.
 */
export async function sendBookingConfirmationToGuest(
  booking: BookingWithProperty,
): Promise<EmailResult> {
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: booking.guestEmail,
      subject: `Reserva Confirmada - ${booking.confirmationCode}`,
      react: <BookingConfirmationEmail booking={booking} />,
    })
    if (error) {
      console.error('[emailService] sendBookingConfirmationToGuest', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendBookingConfirmationToGuest', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Notifies the owner when a new booking is created.
 * Contains guest details, dates, total and a link to the dashboard.
 */
export async function sendNewBookingNotificationToOwner(
  booking: BookingWithProperty,
): Promise<EmailResult> {
  try {
    const ownerEmail = process.env.OWNER_EMAIL
    if (!ownerEmail) {
      console.error('[emailService] OWNER_EMAIL is not set')
      return { success: false, error: 'OWNER_EMAIL is not set' }
    }
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: ownerEmail,
      subject: `Nova reserva recebida - ${booking.confirmationCode}`,
      react: <NewBookingNotificationEmail booking={booking} />,
    })
    if (error) {
      console.error('[emailService] sendNewBookingNotificationToOwner', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendNewBookingNotificationToOwner', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Sends a check-in reminder to the guest the day before their arrival.
 */
export async function sendCheckInReminderToGuest(
  booking: BookingWithProperty,
): Promise<EmailResult> {
  try {
    const resend = getResend()
    const propertyTitle = booking.property?.title ?? 'a sua reserva'
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: booking.guestEmail,
      subject: `Lembrete: Check-in amanhã - ${propertyTitle}`,
      react: <CheckInReminderGuestEmail booking={booking} />,
    })
    if (error) {
      console.error('[emailService] sendCheckInReminderToGuest', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendCheckInReminderToGuest', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Notifies the owner of an upcoming check-in the following day.
 */
export async function sendCheckInReminderToOwner(
  booking: BookingWithProperty,
): Promise<EmailResult> {
  try {
    const ownerEmail = process.env.OWNER_EMAIL
    if (!ownerEmail) {
      console.error('[emailService] OWNER_EMAIL is not set')
      return { success: false, error: 'OWNER_EMAIL is not set' }
    }
    const resend = getResend()
    const propertyTitle = booking.property?.title ?? ''
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: ownerEmail,
      subject: `Check-in amanhã: ${booking.guestName} - ${propertyTitle}`,
      react: <CheckInReminderOwnerEmail booking={booking} />,
    })
    if (error) {
      console.error('[emailService] sendCheckInReminderToOwner', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendCheckInReminderToOwner', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Notifies the owner of a check-out happening today.
 */
export async function sendCheckOutReminderToOwner(
  booking: BookingWithProperty,
): Promise<EmailResult> {
  try {
    const ownerEmail = process.env.OWNER_EMAIL
    if (!ownerEmail) {
      console.error('[emailService] OWNER_EMAIL is not set')
      return { success: false, error: 'OWNER_EMAIL is not set' }
    }
    const resend = getResend()
    const propertyTitle = booking.property?.title ?? ''
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: ownerEmail,
      subject: `Check-out hoje: ${booking.guestName} - ${propertyTitle}`,
      react: <CheckOutReminderOwnerEmail booking={booking} />,
    })
    if (error) {
      console.error('[emailService] sendCheckOutReminderToOwner', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendCheckOutReminderToOwner', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Sends a cancellation confirmation email to the guest.
 * Includes original dates, confirmation code, and reason if provided.
 */
export async function sendCancellationToGuest(
  booking: BookingWithProperty,
  reason?: string,
): Promise<EmailResult> {
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: booking.guestEmail,
      subject: `Reserva Cancelada - ${booking.confirmationCode}`,
      react: <CancellationEmail booking={booking} reason={reason} />,
    })
    if (error) {
      console.error('[emailService] sendCancellationToGuest', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendCancellationToGuest', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Sends a review invitation to the guest 24h after check-out.
 * Includes a link to /review/{bookingId}.
 */
export async function sendReviewInvitationToGuest(
  booking: BookingWithProperty,
): Promise<EmailResult> {
  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: booking.guestEmail,
      subject: 'Como foi a sua estadia? Deixe a sua avaliação',
      react: <ReviewInvitationEmail booking={booking} />,
    })
    if (error) {
      console.error('[emailService] sendReviewInvitationToGuest', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('[emailService] sendReviewInvitationToGuest', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
