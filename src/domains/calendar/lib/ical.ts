// ─── iCal generation and parsing utilities ────────────────────────────────────

export interface BookingForICal {
  confirmationCode: string
  guestName: string
  checkIn: Date
  checkOut: Date
  status: string
}

export interface BlockedDateForICal {
  date: Date
  reason?: string | null
}

export interface ICalEvent {
  uid: string
  summary: string
  startDate: Date
  endDate: Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toICalDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function toICalDateTime(date: Date): string {
  const y = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const h = String(date.getUTCHours()).padStart(2, '0')
  const mi = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  return `${y}${mo}${d}T${h}${mi}${s}Z`
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Folds long lines at 75 octets per RFC 5545.
 * Continuation lines begin with a single space.
 */
function foldLine(line: string): string {
  const MAX = 75
  if (line.length <= MAX) return line

  const out: string[] = [line.substring(0, MAX)]
  let pos = MAX
  while (pos < line.length) {
    out.push(' ' + line.substring(pos, pos + MAX - 1))
    pos += MAX - 1
  }
  return out.join('\r\n')
}

// ─── generateICalFeed ─────────────────────────────────────────────────────────

/**
 * Generates a valid RFC 5545 iCalendar (.ics) string from bookings and
 * blocked dates. Suitable for Airbnb / Booking.com calendar sync.
 */
export function generateICalFeed(
  bookings: BookingForICal[],
  blockedDates: BlockedDateForICal[],
  propertyName: string,
): string {
  const dtstamp = toICalDateTime(new Date())
  const lines: string[] = []

  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//ReservationGonzalo//PT')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:PUBLISH')
  lines.push(foldLine(`X-WR-CALNAME:${escapeText(propertyName)}`))
  lines.push('X-WR-TIMEZONE:Europe/Lisbon')

  // ── Booking events ──────────────────────────────────────────────────────
  for (const booking of bookings) {
    const status = booking.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'

    lines.push('BEGIN:VEVENT')
    lines.push(foldLine(`UID:${booking.confirmationCode}@reservationgonzalo.pt`))
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART;VALUE=DATE:${toICalDate(booking.checkIn)}`)
    lines.push(`DTEND;VALUE=DATE:${toICalDate(booking.checkOut)}`)
    lines.push(foldLine(`SUMMARY:Reservado - ${escapeText(booking.guestName)}`))
    lines.push(`STATUS:${status}`)
    lines.push('END:VEVENT')
  }

  // ── Blocked date events ─────────────────────────────────────────────────
  for (const blocked of blockedDates) {
    const endDate = new Date(blocked.date)
    endDate.setUTCDate(endDate.getUTCDate() + 1)

    const uid = `blocked-${toICalDate(blocked.date)}@reservationgonzalo.pt`

    lines.push('BEGIN:VEVENT')
    lines.push(foldLine(`UID:${uid}`))
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART;VALUE=DATE:${toICalDate(blocked.date)}`)
    lines.push(`DTEND;VALUE=DATE:${toICalDate(endDate)}`)
    lines.push(`SUMMARY:${escapeText(blocked.reason ?? 'Bloqueado')}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  // RFC 5545 requires CRLF line endings
  return lines.join('\r\n') + '\r\n'
}

// ─── parseICalFeed ────────────────────────────────────────────────────────────

/**
 * Parses iCalendar content from Airbnb, Booking.com, or Google Calendar.
 * Handles folded lines, VALUE=DATE, UTC datetime, and local datetime variants.
 */
export function parseICalFeed(icalContent: string): ICalEvent[] {
  // 1. Unfold lines (RFC 5545: continuation lines start with SPACE or HT)
  const unfolded = icalContent
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')

  const events: ICalEvent[] = []
  const rawLines = unfolded.split(/\r?\n/)

  let inEvent = false
  let uid = ''
  let summary = ''
  let dtstart = ''
  let dtend = ''

  for (const raw of rawLines) {
    const line = raw.trim()

    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      uid = ''
      summary = ''
      dtstart = ''
      dtend = ''
      continue
    }

    if (line === 'END:VEVENT') {
      if (inEvent && dtstart) {
        const startDate = parseICalDateString(dtstart)
        // If no DTEND, treat as single day
        const endDate = dtend
          ? parseICalDateString(dtend)
          : (() => {
              const d = startDate ? new Date(startDate) : null
              if (d) d.setUTCDate(d.getUTCDate() + 1)
              return d
            })()

        if (startDate && endDate && endDate > startDate) {
          events.push({ uid, summary, startDate, endDate })
        }
      }
      inEvent = false
      continue
    }

    if (!inEvent) continue

    // Split property name from value (first colon separates them)
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const propFull = line.substring(0, colonIdx)
    const value = line.substring(colonIdx + 1)

    // Property name is before the first semicolon (params follow)
    const propName = propFull.split(';')[0].toUpperCase()

    switch (propName) {
      case 'UID':
        uid = value.trim()
        break
      case 'SUMMARY':
        summary = value
          .replace(/\\n/g, '\n')
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';')
          .replace(/\\\\/g, '\\')
          .trim()
        break
      case 'DTSTART':
        dtstart = value.trim()
        break
      case 'DTEND':
        dtend = value.trim()
        break
    }
  }

  return events
}

/**
 * Parses a DTSTART / DTEND value string into a UTC Date.
 * Handles: YYYYMMDD (date-only), YYYYMMDDTHHMMSSZ (UTC datetime),
 * and YYYYMMDDTHHMMSS (local datetime → treated as UTC date).
 */
function parseICalDateString(value: string): Date | null {
  // Strip timezone parameter suffix if present (e.g. value="20260101" from "DTSTART;TZID=...:20260101")
  const v = value.split(':').pop()?.trim() ?? value

  // DATE only: 20260101
  if (/^\d{8}$/.test(v)) {
    return new Date(Date.UTC(
      parseInt(v.substring(0, 4)),
      parseInt(v.substring(4, 6)) - 1,
      parseInt(v.substring(6, 8)),
    ))
  }

  // DATETIME UTC: 20260101T150000Z
  if (/^\d{8}T\d{6}Z$/i.test(v)) {
    return new Date(
      `${v.substring(0, 4)}-${v.substring(4, 6)}-${v.substring(6, 8)}` +
      `T${v.substring(9, 11)}:${v.substring(11, 13)}:${v.substring(13, 15)}Z`,
    )
  }

  // DATETIME local (no Z, no TZ): 20260101T150000 — use date portion only as UTC
  if (/^\d{8}T\d{6}$/i.test(v)) {
    return new Date(Date.UTC(
      parseInt(v.substring(0, 4)),
      parseInt(v.substring(4, 6)) - 1,
      parseInt(v.substring(6, 8)),
    ))
  }

  return null
}
