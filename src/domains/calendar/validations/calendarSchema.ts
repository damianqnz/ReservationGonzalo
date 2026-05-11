import { z } from 'zod'

// ─── Calendar blocking ────────────────────────────────────────────────────────

export const blockDatesSchema = z.object({
  propertyId: z.string().min(1),
  startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  reason:     z.string().max(200).optional(),
  roomId:     z.string().optional(),
})

// ─── iCal import ─────────────────────────────────────────────────────────────

export const importICalSchema = z.object({
  propertyId: z.string().min(1),
  roomId: z.string().optional().nullable(),
  source: z.string().min(1).max(100),
  icalUrl: z.string().url(),
})
