import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAvailability } from '@/services/availabilityService'

const querySchema = z.object({
  roomId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const result = querySchema.safeParse(params)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { roomId, startDate, endDate } = result.data

  if (endDate <= startDate) {
    return NextResponse.json(
      { error: { endDate: ['endDate must be after startDate'] } },
      { status: 400 },
    )
  }

  const available = await checkAvailability(roomId, startDate, endDate)

  return NextResponse.json({ available })
}
