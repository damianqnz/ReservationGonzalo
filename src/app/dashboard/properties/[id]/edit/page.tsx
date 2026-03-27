import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import PropertyEditForm from './PropertyEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyEditPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const property = await db.property.findUnique({
    where: { id },
    select: {
      id:                 true,
      ownerId:            true,
      title:              true,
      description:        true,
      address:            true,
      city:               true,
      zipCode:            true,
      pricePerNight:      true,
      cleaningFee:        true,
      maxGuests:          true,
      bedrooms:           true,
      bathrooms:          true,
      beds:               true,
      hasRooms:           true,
      bedsConfig:         true,
      bathroomType:       true,
      services:           true,
      accessCode:         true,
      wifiName:           true,
      wifiPassword:       true,
      floor:              true,
      accessInstructions: true,
      contactPhone:       true,
      latitude:           true,
      longitude:          true,
    },
  })

  if (!property) notFound()

  // OWNER can only edit their own properties
  if (session.user.role === 'OWNER' && property.ownerId !== session.user.id) {
    redirect('/dashboard/properties')
  }

  const { ownerId: _, ...propertyData } = property

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/properties" className="hover:text-[#8b1a1a] transition-colors">
          Propriedades
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#1a1a2e] font-medium">{propertyData.title}</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#1a1a2e] font-medium">Editar</span>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">
          Editar Propriedade
        </h1>
        <p className="text-slate-500 mt-1">
          Actualiza as informações e os dados de acesso para os hóspedes.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <PropertyEditForm property={propertyData} />
      </div>
    </div>
  )
}
