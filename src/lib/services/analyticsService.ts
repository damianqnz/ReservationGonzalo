/**
 * analyticsService.ts
 * Aggregates booking data for the analytics dashboard.
 * ownerId = null means ADMIN (all data).
 */

import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventorySegment {
  bookings: number
  revenue:  number
  avgValue: number
}

export interface AnalyticsData {
  // ── Existing metrics ──
  bookingsByMonth:   { month: string; bookings: number; revenue: number }[]
  bookingsByYear:    { year: number; bookings: number; revenue: number }[]
  topMonths:         { month: string; bookings: number; avgRevenue: number }[]
  byNationality:     { country: string; countryName: string; bookings: number }[]
  byProperty:        { propertyId: string; propertyTitle: string; bookings: number; revenue: number; occupancyRate: number }[]
  byRoomType:        { type: string; bookings: number; revenue: number }[]
  byStatus:          { status: string; count: number }[]
  bySource:          { source: string; count: number }[]
  avgNights:         number
  avgBookingValue:   number
  cancellationRate:  number
  revenueComparison: { month: string; currentYear: number; previousYear: number }[]
  yearTotals: {
    bookings:     number
    revenue:      number
    prevBookings: number
    prevRevenue:  number
  }
  // ── A: Inventory Efficiency ──
  inventoryComparison: {
    entirePlace:     InventorySegment
    individualRooms: InventorySegment
    directProperty:  InventorySegment
    recommendation:  string
  }
  blockedOpportunities: {
    propertyId:           string
    propertyTitle:        string
    blockedDays:          number
    estimatedLostRevenue: number
  }[]
  // ── B: Time & Anticipation ──
  leadTimeAnalysis: {
    overall:         { avg: number; median: number }
    entirePlace:     { avg: number; median: number }
    individualRooms: { avg: number; median: number }
    insight:         string
  }
  alosAnalysis: {
    overall:         number
    entirePlace:     number
    individualRooms: number
    insight:         string
  }
  // ── C: Financial Health ──
  revparByProperty: {
    propertyId:    string
    propertyTitle: string
    revpar:        number
    occupancyRate: number
    adr:           number
  }[]
  netAdrByChannel: {
    source:        string
    bookings:      number
    grossRevenue:  number
    estimatedFees: number
    netRevenue:    number
    netAdr:        number
    feeRate:       string
    totalNights:   number
  }[]
  cancellationByChannel: {
    source:           string
    totalBookings:    number
    cancelled:        number
    cancellationRate: number
    recommendation:   string
  }[]
  // ── D: Look-to-Book ──
  lookToBook: {
    totalSearches:   number
    totalConversions: number
    conversionRate:  number
    byMonth:         { month: string; searches: number; conversions: number; rate: number }[]
    byProperty:      { propertyId: string; title: string; searches: number; conversions: number; rate: number }[]
    insight:         string
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_PT      = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTHS_FULL_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal',  ES: 'Espanha',      FR: 'França',
  DE: 'Alemanha',  GB: 'Reino Unido',  IT: 'Itália',
  BR: 'Brasil',    NL: 'Países Baixos', BE: 'Bélgica',
  US: 'EUA',       CH: 'Suíça',        AT: 'Áustria',
  SE: 'Suécia',    NO: 'Noruega',      DK: 'Dinamarca',
  PL: 'Polónia',   CN: 'China',        JP: 'Japão',
  AU: 'Austrália', CA: 'Canadá',       RU: 'Rússia',
  AR: 'Argentina', MX: 'México',       IN: 'Índia',
}

const REVENUE_STATUSES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]

const FEE_RATES: Record<string, number> = {
  DIRECT:  0.03,
  AIRBNB:  0.15,
  BOOKING: 0.15,
  MANUAL:  0.00,
}
const FEE_LABELS: Record<string, string> = {
  DIRECT: '3%', AIRBNB: '15%', BOOKING: '15%', MANUAL: '0%',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcMedian(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function calcAvg(arr: number[]): number {
  if (arr.length === 0) return 0
  return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10
}

function calcSegment(bookings: { totalPrice: number }[]): InventorySegment {
  const revenue = Math.round(bookings.reduce((s, b) => s + b.totalPrice, 0))
  return {
    bookings: bookings.length,
    revenue,
    avgValue: bookings.length > 0 ? Math.round(revenue / bookings.length) : 0,
  }
}

// ─── Service function ─────────────────────────────────────────────────────────

/**
 * Computes all analytics data for the dashboard.
 * @param ownerId - null for ADMIN (all data), string for OWNER filter
 * @param year - selected year for monthly breakdown and comparison
 * @param propertyId - optional property filter
 */
export async function computeAnalytics(
  ownerId: string | null,
  year: number,
  propertyId?: string,
): Promise<AnalyticsData> {
  const bookingWhere = {
    ...(ownerId
      ? { property: { ownerId }, ...(propertyId ? { propertyId } : {}) }
      : propertyId ? { propertyId } : {}),
  }
  const propertyWhere = {
    ...(ownerId ? { ownerId } : {}),
    ...(propertyId ? { id: propertyId } : {}),
  }
  const rbdWhere = {
    room: {
      property: { ...(ownerId ? { ownerId } : {}) },
      ...(propertyId ? { propertyId } : {}),
    },
    OR: [
      { reason: { contains: 'ENTIRE_PLACE' } },
      { reason: { contains: 'Alojamento Completo' } },
    ],
  }

  const [allBookings, roomBlockedDates, propertiesWithRooms] = await Promise.all([
    db.booking.findMany({
      where: bookingWhere,
      select: {
        checkIn:      true,
        nights:       true,
        totalPrice:   true,
        status:       true,
        source:       true,
        guestCountry: true,
        propertyId:   true,
        createdAt:    true,
        room:         { select: { type: true } },
        property:     { select: { title: true } },
      },
    }),
    db.roomBlockedDate.findMany({
      where: rbdWhere,
      select: {
        room: {
          select: {
            propertyId:    true,
            pricePerNight: true,
            property:      { select: { title: true } },
          },
        },
      },
    }),
    db.property.findMany({
      where: propertyWhere,
      select: {
        id:     true,
        title:  true,
        _count: { select: { rooms: true } },
      },
    }),
  ])

  const revenueBookings = allBookings.filter((b) => REVENUE_STATUSES.includes(b.status))

  // ── bookingsByMonth (selected year) ────────────────────────────────────────
  const bookingsByMonth = MONTHS_PT.map((month, i) => {
    const inMonth = revenueBookings.filter(
      (b) => b.checkIn.getFullYear() === year && b.checkIn.getMonth() === i,
    )
    return {
      month,
      bookings: inMonth.length,
      revenue:  Math.round(inMonth.reduce((s, b) => s + b.totalPrice, 0)),
    }
  })

  // ── bookingsByYear (last 3 years) ──────────────────────────────────────────
  const currentYear = new Date().getFullYear()
  const bookingsByYear = [currentYear - 2, currentYear - 1, currentYear].map((y) => {
    const inYear = revenueBookings.filter((b) => b.checkIn.getFullYear() === y)
    return {
      year:     y,
      bookings: inYear.length,
      revenue:  Math.round(inYear.reduce((s, b) => s + b.totalPrice, 0)),
    }
  })

  // ── topMonths all-time ─────────────────────────────────────────────────────
  const monthAcc = Array.from({ length: 12 }, () => ({ bookings: 0, totalRevenue: 0 }))
  for (const b of revenueBookings) {
    const m = b.checkIn.getMonth()
    monthAcc[m].bookings++
    monthAcc[m].totalRevenue += b.totalPrice
  }
  const topMonths = monthAcc
    .map((m, i) => ({
      month:      MONTHS_FULL_PT[i],
      bookings:   m.bookings,
      avgRevenue: m.bookings > 0 ? Math.round(m.totalRevenue / m.bookings) : 0,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6)

  // ── byNationality (top 10) ─────────────────────────────────────────────────
  const natMap = new Map<string, number>()
  for (const b of revenueBookings) {
    const c = b.guestCountry ?? 'XX'
    natMap.set(c, (natMap.get(c) ?? 0) + 1)
  }
  const byNationality = [...natMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, bookings]) => ({
      country,
      countryName: COUNTRY_NAMES[country] ?? country,
      bookings,
    }))

  // ── byProperty ─────────────────────────────────────────────────────────────
  const propMap = new Map<string, { title: string; bookings: number; revenue: number; nights: number }>()
  for (const b of revenueBookings) {
    const e = propMap.get(b.propertyId) ?? {
      title: b.property?.title ?? b.propertyId, bookings: 0, revenue: 0, nights: 0,
    }
    e.bookings++
    e.revenue += b.totalPrice
    e.nights  += b.nights ?? 0
    propMap.set(b.propertyId, e)
  }
  const byProperty = [...propMap.entries()].map(([pid, v]) => ({
    propertyId:    pid,
    propertyTitle: v.title,
    bookings:      v.bookings,
    revenue:       Math.round(v.revenue),
    occupancyRate: Math.min(100, Math.round((v.nights / 365) * 100)),
  }))

  // ── byRoomType ─────────────────────────────────────────────────────────────
  const roomTypeMap = new Map<string, { bookings: number; revenue: number }>()
  for (const b of revenueBookings) {
    const t = b.room?.type ?? 'ENTIRE_PLACE'
    const e = roomTypeMap.get(t) ?? { bookings: 0, revenue: 0 }
    e.bookings++
    e.revenue += b.totalPrice
    roomTypeMap.set(t, e)
  }
  const byRoomType = [...roomTypeMap.entries()].map(([type, v]) => ({
    type, bookings: v.bookings, revenue: Math.round(v.revenue),
  }))

  // ── byStatus (all bookings) ────────────────────────────────────────────────
  const statusMap = new Map<string, number>()
  for (const b of allBookings) statusMap.set(b.status, (statusMap.get(b.status) ?? 0) + 1)
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({ status, count }))

  // ── bySource ───────────────────────────────────────────────────────────────
  const sourceMap = new Map<string, number>()
  for (const b of revenueBookings) {
    const s = b.source ?? 'DIRECT'
    sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1)
  }
  const bySource = [...sourceMap.entries()].map(([source, count]) => ({ source, count }))

  // ── averages & rates ───────────────────────────────────────────────────────
  const avgNights = revenueBookings.length > 0
    ? Math.round((revenueBookings.reduce((s, b) => s + (b.nights ?? 1), 0) / revenueBookings.length) * 10) / 10
    : 0
  const avgBookingValue = revenueBookings.length > 0
    ? Math.round(revenueBookings.reduce((s, b) => s + b.totalPrice, 0) / revenueBookings.length)
    : 0
  const cancellations    = allBookings.filter((b) => b.status === BookingStatus.CANCELLED).length
  const cancellationRate = allBookings.length > 0
    ? Math.round((cancellations / allBookings.length) * 100)
    : 0

  // ── revenueComparison (year vs year-1) ─────────────────────────────────────
  const prevYear = year - 1
  const revenueComparison = MONTHS_PT.map((month, i) => {
    const curr = revenueBookings
      .filter((b) => b.checkIn.getFullYear() === year && b.checkIn.getMonth() === i)
      .reduce((s, b) => s + b.totalPrice, 0)
    const prev = revenueBookings
      .filter((b) => b.checkIn.getFullYear() === prevYear && b.checkIn.getMonth() === i)
      .reduce((s, b) => s + b.totalPrice, 0)
    return { month, currentYear: Math.round(curr), previousYear: Math.round(prev) }
  })

  // ── yearTotals ─────────────────────────────────────────────────────────────
  const yearBk   = revenueBookings.filter((b) => b.checkIn.getFullYear() === year)
  const prevYrBk = revenueBookings.filter((b) => b.checkIn.getFullYear() === prevYear)
  const yearTotals = {
    bookings:     yearBk.length,
    revenue:      Math.round(yearBk.reduce((s, b) => s + b.totalPrice, 0)),
    prevBookings: prevYrBk.length,
    prevRevenue:  Math.round(prevYrBk.reduce((s, b) => s + b.totalPrice, 0)),
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // A — INVENTORY EFFICIENCY
  // ═══════════════════════════════════════════════════════════════════════════

  // ── inventoryComparison ────────────────────────────────────────────────────
  const epBk  = revenueBookings.filter((b) => b.room?.type === 'ENTIRE_PLACE')
  const indBk = revenueBookings.filter((b) => b.room !== null && b.room.type !== 'ENTIRE_PLACE')
  const dirBk = revenueBookings.filter((b) => b.room === null)

  const epSeg  = calcSegment(epBk)
  const indSeg = calcSegment(indBk)
  const dirSeg = calcSegment(dirBk)

  const inventoryComparison = {
    entirePlace:     epSeg,
    individualRooms: indSeg,
    directProperty:  dirSeg,
    recommendation:
      epSeg.avgValue > indSeg.avgValue * 0.8
        ? 'A Casa Completa gera mais receita por reserva'
        : 'Os quartos individuais são mais rentáveis no total',
  }

  // ── blockedOpportunities ───────────────────────────────────────────────────
  const blockedByProp = new Map<string, { title: string; blockedDays: number; estimatedLostRevenue: number }>()
  for (const rbd of roomBlockedDates) {
    const pid = rbd.room.propertyId
    const e   = blockedByProp.get(pid) ?? {
      title: rbd.room.property.title, blockedDays: 0, estimatedLostRevenue: 0,
    }
    e.blockedDays++
    e.estimatedLostRevenue += rbd.room.pricePerNight
    blockedByProp.set(pid, e)
  }
  const blockedOpportunities = [...blockedByProp.entries()].map(([pid, v]) => ({
    propertyId:           pid,
    propertyTitle:        v.title,
    blockedDays:          v.blockedDays,
    estimatedLostRevenue: Math.round(v.estimatedLostRevenue),
  }))

  // ═══════════════════════════════════════════════════════════════════════════
  // B — TIME & ANTICIPATION
  // ═══════════════════════════════════════════════════════════════════════════

  // ── leadTimeAnalysis ───────────────────────────────────────────────────────
  function calcLeadTime(bks: { checkIn: Date; createdAt: Date }[]): { avg: number; median: number } {
    const days = bks.map((b) =>
      Math.max(0, Math.round((b.checkIn.getTime() - b.createdAt.getTime()) / 86_400_000)),
    )
    return { avg: calcAvg(days), median: calcMedian(days) }
  }

  const ltOverall = calcLeadTime(revenueBookings)
  const ltEP      = calcLeadTime(epBk)
  const ltInd     = calcLeadTime(indBk)

  const leadTimeAnalysis = {
    overall:         ltOverall,
    entirePlace:     ltEP,
    individualRooms: ltInd,
    insight:
      ltEP.avg > ltInd.avg * 1.5
        ? 'Casas completas reservadas com muito mais antecedência'
        : 'Padrão de reserva similar entre tipos',
  }

  // ── alosAnalysis ───────────────────────────────────────────────────────────
  function avgNightsOf(bks: { nights: number }[]): number {
    if (bks.length === 0) return 0
    return Math.round((bks.reduce((s, b) => s + (b.nights ?? 0), 0) / bks.length) * 10) / 10
  }

  const alosOverall = avgNightsOf(revenueBookings)
  const alosEP      = avgNightsOf(epBk)
  const alosInd     = avgNightsOf(indBk)

  const alosAnalysis = {
    overall:         alosOverall,
    entirePlace:     alosEP,
    individualRooms: alosInd,
    insight:
      alosInd > 0 && alosInd < 2
        ? '⚠️ Estadias curtas nos quartos aumentam custos de limpeza. Considere mínimo de 2 noites.'
        : 'Duração de estadia saudável',
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // C — FINANCIAL HEALTH
  // ═══════════════════════════════════════════════════════════════════════════

  // ── revparByProperty ───────────────────────────────────────────────────────
  const revparByProperty = propertiesWithRooms.map((prop) => {
    const roomCount = prop._count.rooms
    const propRoomBk = revenueBookings.filter(
      (b) => b.propertyId === prop.id && b.room !== null,
    )
    const totalRevenue = propRoomBk.reduce((s, b) => s + b.totalPrice, 0)
    const totalNights  = propRoomBk.reduce((s, b) => s + (b.nights ?? 0), 0)
    const revpar = roomCount > 0
      ? Math.round((totalRevenue / (roomCount * 365)) * 100) / 100
      : 0
    const adr = totalNights > 0
      ? Math.round((totalRevenue / totalNights) * 100) / 100
      : 0
    const propData = byProperty.find((p) => p.propertyId === prop.id)
    return {
      propertyId:    prop.id,
      propertyTitle: prop.title,
      revpar,
      occupancyRate: propData?.occupancyRate ?? 0,
      adr,
    }
  })

  // ── netAdrByChannel ────────────────────────────────────────────────────────
  const channelMap = new Map<string, { bookings: number; grossRevenue: number; totalNights: number }>()
  for (const b of revenueBookings) {
    const s = b.source ?? 'DIRECT'
    const e = channelMap.get(s) ?? { bookings: 0, grossRevenue: 0, totalNights: 0 }
    e.bookings++
    e.grossRevenue += b.totalPrice
    e.totalNights  += b.nights ?? 0
    channelMap.set(s, e)
  }
  const netAdrByChannel = [...channelMap.entries()].map(([source, v]) => {
    const feeRate      = FEE_RATES[source] ?? 0
    const estimatedFees = Math.round(v.grossRevenue * feeRate)
    const netRevenue   = Math.round(v.grossRevenue - estimatedFees)
    const netAdr       = v.totalNights > 0
      ? Math.round((netRevenue / v.totalNights) * 100) / 100
      : 0
    return {
      source,
      bookings:      v.bookings,
      grossRevenue:  Math.round(v.grossRevenue),
      estimatedFees,
      netRevenue,
      netAdr,
      feeRate:       FEE_LABELS[source] ?? '0%',
      totalNights:   v.totalNights,
    }
  })

  // ── cancellationByChannel ──────────────────────────────────────────────────
  const cancChannelMap = new Map<string, { total: number; cancelled: number }>()
  for (const b of allBookings) {
    const s = b.source ?? 'DIRECT'
    const e = cancChannelMap.get(s) ?? { total: 0, cancelled: 0 }
    e.total++
    if (b.status === BookingStatus.CANCELLED) e.cancelled++
    cancChannelMap.set(s, e)
  }
  const cancellationByChannel = [...cancChannelMap.entries()].map(([source, v]) => {
    const rate = v.total > 0
      ? Math.round((v.cancelled / v.total) * 1000) / 10
      : 0
    let recommendation = 'Taxa normal'
    if      (rate > 30) recommendation = '⚠️ Taxa alta — verificar condições deste canal'
    else if (rate > 15) recommendation = 'Atenção — taxa acima da média'
    else if (rate <  5) recommendation = '✅ Excelente — canal muito fiável'
    return { source, totalBookings: v.total, cancelled: v.cancelled, cancellationRate: rate, recommendation }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // D — LOOK-TO-BOOK
  // ═══════════════════════════════════════════════════════════════════════════

  const periodStart = new Date(year - 1, 0, 1)
  const searchEventWhere = {
    ...(ownerId
      ? { property: { ownerId }, ...(propertyId ? { propertyId } : {}) }
      : propertyId ? { propertyId } : {}),
    createdAt: { gte: periodStart },
  }

  const searchEvents = await db.searchEvent.findMany({
    where: searchEventWhere,
    select: {
      propertyId:          true,
      property:            { select: { title: true } },
      convertedToBooking:  true,
      createdAt:           true,
    },
  })

  const ltbByMonth = MONTHS_PT.map((month, i) => {
    const inMonth    = searchEvents.filter((e) => e.createdAt.getFullYear() === year && e.createdAt.getMonth() === i)
    const conversions = inMonth.filter((e) => e.convertedToBooking).length
    const searches   = inMonth.length
    return { month, searches, conversions, rate: searches > 0 ? Math.round((conversions / searches) * 1000) / 10 : 0 }
  })

  const ltbPropMap = new Map<string, { title: string; searches: number; conversions: number }>()
  for (const e of searchEvents) {
    const pid   = e.propertyId ?? 'unknown'
    const title = e.property?.title ?? 'Desconhecido'
    const entry = ltbPropMap.get(pid) ?? { title, searches: 0, conversions: 0 }
    entry.searches++
    if (e.convertedToBooking) entry.conversions++
    ltbPropMap.set(pid, entry)
  }
  const ltbByProperty = [...ltbPropMap.entries()].map(([pid, v]) => ({
    propertyId:  pid,
    title:       v.title,
    searches:    v.searches,
    conversions: v.conversions,
    rate:        v.searches > 0 ? Math.round((v.conversions / v.searches) * 1000) / 10 : 0,
  }))

  const ltbTotalSearches    = searchEvents.length
  const ltbTotalConversions = searchEvents.filter((e) => e.convertedToBooking).length
  const ltbConversionRate   = ltbTotalSearches > 0
    ? Math.round((ltbTotalConversions / ltbTotalSearches) * 1000) / 10
    : 0
  const ltbInsight = ltbTotalSearches === 0
    ? 'Sem dados de pesquisa ainda'
    : ltbConversionRate >= 20
      ? '✅ Taxa de conversão excelente'
      : ltbConversionRate >= 10
        ? 'Taxa de conversão na média do mercado'
        : '⚠️ Taxa de conversão baixa — considere melhorar preços ou fotos'

  const lookToBook = {
    totalSearches:    ltbTotalSearches,
    totalConversions: ltbTotalConversions,
    conversionRate:   ltbConversionRate,
    byMonth:          ltbByMonth,
    byProperty:       ltbByProperty,
    insight:          ltbInsight,
  }

  return {
    bookingsByMonth,
    bookingsByYear,
    topMonths,
    byNationality,
    byProperty,
    byRoomType,
    byStatus,
    bySource,
    avgNights,
    avgBookingValue,
    cancellationRate,
    revenueComparison,
    yearTotals,
    inventoryComparison,
    blockedOpportunities,
    leadTimeAnalysis,
    alosAnalysis,
    revparByProperty,
    netAdrByChannel,
    cancellationByChannel,
    lookToBook,
  }
}
