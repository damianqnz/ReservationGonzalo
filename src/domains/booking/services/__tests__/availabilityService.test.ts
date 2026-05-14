import { checkAvailability, checkRoomAvailability } from '../availabilityService'
import { db } from '@/shared/lib/db'

jest.mock('@/shared/lib/db', () => ({
  db: {
    property: { findUnique: jest.fn() },
    room: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mockDb = db as jest.Mocked<typeof db>

// Helper: build a $transaction mock that immediately calls the callback with a tx object
function mockTransaction(bookings: { checkIn: Date; checkOut: Date }[], blockedDate: object | null = null) {
  ;(mockDb.$transaction as jest.Mock).mockImplementation((fn: (tx: unknown) => unknown) =>
    fn({
      booking: { findMany: jest.fn().mockResolvedValue(bookings) },
      blockedDate: { findFirst: jest.fn().mockResolvedValue(blockedDate) },
      roomBlockedDate: { findFirst: jest.fn().mockResolvedValue(blockedDate) },
    })
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── checkAvailability ────────────────────────────────────────────────────────

describe('checkAvailability', () => {
  const propId = 'prop-1'
  const jan10 = new Date('2025-01-10T00:00:00.000Z')
  const jan15 = new Date('2025-01-15T00:00:00.000Z')
  const jan20 = new Date('2025-01-20T00:00:00.000Z')

  it('returns false when property not found (inactive or missing)', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue(null)
    expect(await checkAvailability(propId, jan10, jan15)).toBe(false)
  })

  it('returns true when no bookings exist', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: false })
    mockTransaction([])
    expect(await checkAvailability(propId, jan10, jan15)).toBe(true)
  })

  it('returns false when a CONFIRMED booking overlaps', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: false })
    // Existing: Jan 12 – Jan 18, overlaps with Jan 10 – Jan 15
    mockTransaction([
      { checkIn: new Date('2025-01-12T00:00:00.000Z'), checkOut: new Date('2025-01-18T00:00:00.000Z') },
    ])
    expect(await checkAvailability(propId, jan10, jan15)).toBe(false)
  })

  it('returns false when a booking fully contains the requested range', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: false })
    // Existing: Jan 5 – Jan 20, contains Jan 10 – Jan 15
    mockTransaction([
      { checkIn: new Date('2025-01-05T00:00:00.000Z'), checkOut: jan20 },
    ])
    expect(await checkAvailability(propId, jan10, jan15)).toBe(false)
  })

  it('returns true for adjacent dates (back-to-back, checkout = new checkin)', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: false })
    // Existing: Jan 10 – Jan 15, new request: Jan 15 – Jan 20 → no overlap
    mockTransaction([
      { checkIn: jan10, checkOut: jan15 },
    ])
    expect(await checkAvailability(propId, jan15, jan20)).toBe(true)
  })

  it('returns true when existing booking ends before new check-in', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: false })
    // Existing: Jan 5 – Jan 10, new request: Jan 10 – Jan 15 → adjacent, no overlap
    mockTransaction([
      { checkIn: new Date('2025-01-05T00:00:00.000Z'), checkOut: jan10 },
    ])
    expect(await checkAvailability(propId, jan10, jan15)).toBe(true)
  })

  it('returns false when a blocked date falls in the range', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: false })
    mockTransaction([], { id: 'blocked-1' }) // no bookings, but a blocked date
    expect(await checkAvailability(propId, jan10, jan15)).toBe(false)
  })

  it('returns false when hasRooms=true but no active rooms exist', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: true })
    ;(mockDb.room.findMany as jest.Mock).mockResolvedValue([])
    expect(await checkAvailability(propId, jan10, jan15)).toBe(false)
  })

  it('returns true when hasRooms=true and at least one room is available', async () => {
    ;(mockDb.property.findUnique as jest.Mock).mockResolvedValue({ hasRooms: true })
    ;(mockDb.room.findMany as jest.Mock).mockResolvedValue([{ id: 'room-1' }])
    // checkRoomAvailability uses $transaction too — configure it for the room check
    ;(mockDb.$transaction as jest.Mock).mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        booking: { findMany: jest.fn().mockResolvedValue([]) },
        roomBlockedDate: { findFirst: jest.fn().mockResolvedValue(null) },
      })
    )
    expect(await checkAvailability(propId, jan10, jan15)).toBe(true)
  })
})

// ─── checkRoomAvailability ────────────────────────────────────────────────────

describe('checkRoomAvailability', () => {
  const roomId = 'room-1'
  const jan10 = new Date('2025-01-10T00:00:00.000Z')
  const jan15 = new Date('2025-01-15T00:00:00.000Z')
  const jan20 = new Date('2025-01-20T00:00:00.000Z')

  it('returns true when no bookings or blocked dates', async () => {
    ;(mockDb.$transaction as jest.Mock).mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        booking: { findMany: jest.fn().mockResolvedValue([]) },
        roomBlockedDate: { findFirst: jest.fn().mockResolvedValue(null) },
      })
    )
    expect(await checkRoomAvailability(roomId, jan10, jan15)).toBe(true)
  })

  it('returns false when a booking overlaps', async () => {
    ;(mockDb.$transaction as jest.Mock).mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        booking: {
          findMany: jest.fn().mockResolvedValue([
            { checkIn: new Date('2025-01-12T00:00:00.000Z'), checkOut: jan20 },
          ]),
        },
        roomBlockedDate: { findFirst: jest.fn().mockResolvedValue(null) },
      })
    )
    expect(await checkRoomAvailability(roomId, jan10, jan15)).toBe(false)
  })

  it('returns true for adjacent dates (checkout = new checkin)', async () => {
    ;(mockDb.$transaction as jest.Mock).mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
        booking: {
          findMany: jest.fn().mockResolvedValue([
            { checkIn: jan10, checkOut: jan15 },
          ]),
        },
        roomBlockedDate: { findFirst: jest.fn().mockResolvedValue(null) },
      })
    )
    // New request starts exactly when existing ends — should be allowed
    expect(await checkRoomAvailability(roomId, jan15, jan20)).toBe(true)
  })
})
