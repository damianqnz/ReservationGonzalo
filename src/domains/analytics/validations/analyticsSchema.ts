import { z } from 'zod'

// ─── Analytics dashboard ──────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  year:       z.coerce.number().int().min(2020).max(2100).optional(),
  propertyId: z.string().optional(),
})

// ─── Clients list and export (identical schema, distinct names) ───────────────

const clientsFilterSchema = z.object({
  search:     z.string().optional(),
  country:    z.string().optional(),
  marketing:  z.enum(['true', 'false']).optional(),
  propertyId: z.string().optional(),
  period:     z.enum(['30d', '90d', '1y', 'all']).optional().default('all'),
})

export const listClientsQuerySchema = clientsFilterSchema
export const exportClientsQuerySchema = clientsFilterSchema
