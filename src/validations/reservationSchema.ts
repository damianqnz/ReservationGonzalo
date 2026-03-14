import { z } from 'zod'

export const reservationSchema = z
  .object({
    roomId: z.string().min(1, 'roomId is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    guests: z.number().int().min(1, 'At least 1 guest required'),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  })

export type ReservationInput = z.infer<typeof reservationSchema>
