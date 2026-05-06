import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { z } from 'zod'

const bodySchema = z.object({
  enabled: z.boolean(),
})

// ─── POST /api/settings/maintenance ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Full persistence (DB/file) to be implemented after deploy.
  // Client stores state in localStorage in the meantime.
  return NextResponse.json({ data: { enabled: parsed.data.enabled }, error: null })
}
