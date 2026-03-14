/**
 * Returns true when two half-open date intervals [startA, endA) and [startB, endB) overlap.
 * Half-open means back-to-back ranges (endA === startB) do NOT overlap.
 */
export function isDateOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime()
}

/**
 * Returns the number of whole nights (days) between two UTC-normalised dates.
 * Throws if endDate is not after startDate.
 */
export function nightsBetween(startDate: Date, endDate: Date): number {
  const start = normalizeDate(startDate).getTime()
  const end = normalizeDate(endDate).getTime()

  if (end <= start) {
    throw new RangeError('endDate must be after startDate')
  }

  const MS_PER_DAY = 86_400_000
  return Math.round((end - start) / MS_PER_DAY)
}

/**
 * Returns a new Date set to midnight UTC (00:00:00.000Z) on the same calendar day.
 * Does not mutate the input.
 */
export function normalizeDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}
