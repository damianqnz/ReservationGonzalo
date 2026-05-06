import { redirect, notFound } from 'next/navigation'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import PricingClient from './PricingClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PropertyPricingPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id } = await params

  const property = await db.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      ownerId: true,
      pricePerNight: true,
      hasRooms: true,
      rooms: {
        where: { status: 'ACTIVE' },
        orderBy: { order: 'asc' },
        select: { id: true, name: true },
      },
      seasonalPrices: {
        orderBy: { startDate: 'asc' },
        select: {
          id: true, name: true, startDate: true, endDate: true,
          pricePerNight: true, minNights: true, roomId: true,
        },
      },
      pricingRules: {
        where: { roomId: null },
        select: { id: true, type: true, value: true, isPercentage: true },
      },
    },
  })

  if (!property) notFound()
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') redirect('/dashboard')

  // Serialize dates (Prisma Date → ISO string)
  const initialSeasonalPrices = property.seasonalPrices.map((s) => ({
    ...s,
    startDate: s.startDate.toISOString().split('T')[0],
    endDate: s.endDate.toISOString().split('T')[0],
  }))

  return (
    <PricingClient
      propertyId={id}
      propertyTitle={property.title}
      basePrice={property.pricePerNight}
      initialRooms={property.rooms}
      initialSeasonalPrices={initialSeasonalPrices}
      initialPricingRules={property.pricingRules}
    />
  )
}
