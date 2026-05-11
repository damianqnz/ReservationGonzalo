// ─── Analytics types ──────────────────────────────────────────────────────────

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
    totalSearches:    number
    totalConversions: number
    conversionRate:   number
    byMonth:          { month: string; searches: number; conversions: number; rate: number }[]
    byProperty:       { propertyId: string; title: string; searches: number; conversions: number; rate: number }[]
    insight:          string
  }
}
