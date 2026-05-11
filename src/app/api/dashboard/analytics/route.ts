import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/shared/lib/auth'
import { computeAnalytics } from '@/domains/analytics/services/analyticsService'
import { analyticsQuerySchema } from '@/domains/analytics/validations/analyticsSchema'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Não autorizado' }, { status: 401 })
    }
    const role = session.user.role
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Acesso negado' }, { status: 403 })
    }

    const parsed = analyticsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const { year, propertyId } = parsed.data
    const currentYear = new Date().getFullYear()
    const isAdmin = role === 'ADMIN'

    const data = await computeAnalytics(
      isAdmin ? null : session.user.id,
      year ?? currentYear,
      propertyId,
    )

    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('[analytics]', error)
    return NextResponse.json({ data: null, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
