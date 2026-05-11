import { redirect } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { getCoupons } from '@/domains/pricing/services/couponService'
import CouponsClient from './CouponsClient'

export const metadata = { title: 'Cupões — Dashboard' }

export default async function CouponsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER') redirect('/dashboard')

  const coupons = await getCoupons()

  // Serialize for client (Dates → ISO strings, Decimal → number)
  const serialized = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    discountValue: Number(c.discountValue),
    description: c.description,
    maxUses: c.maxUses,
    minNights: c.minNights,
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    currentUses: c.currentUses,
    createdAt: c.createdAt.toISOString(),
    totalDiscount: c.usages.reduce((sum, u) => sum + Number(u.discount), 0),
  }))

  return <CouponsClient initialCoupons={serialized} />
}
