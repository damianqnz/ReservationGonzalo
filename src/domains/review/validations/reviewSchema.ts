import { z } from 'zod'

// ─── Review list ──────────────────────────────────────────────────────────────

export const listReviewsQuerySchema = z.object({
  propertyId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).default('all'),
  source: z.enum(['WEBSITE', 'AIRBNB', 'BOOKING', 'MANUAL', 'all']).default('all'),
})

// ─── Review action (approve / reject / reply / toggle) ────────────────────────

export const reviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'reply', 'toggle']),
  ownerReply: z.string().optional(),
})

// ─── Review import ────────────────────────────────────────────────────────────

export const importReviewSchema = z.object({
  propertyId: z.string().min(1, 'Propriedade é obrigatória'),
  guestName: z.string().min(1, 'Nome do hóspede é obrigatório'),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comentário é obrigatório'),
  source: z.enum(['AIRBNB', 'BOOKING', 'MANUAL']),
  sourceUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  stayDate: z.string().optional().or(z.literal('')),
})
