import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import RoomEditForm from './RoomEditForm'

interface Props {
  params: Promise<{ id: string; roomId: string }>
}

export default async function EditRoomPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id, roomId } = await params

  const room = await db.room.findUnique({
    where: { id: roomId, propertyId: id },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      status: true,
      maxGuests: true,
      bedrooms: true,
      bathrooms: true,
      bathroomType: true,
      beds: true,
      bedsList: true,
      services: true,
      pricePerNight: true,
      order: true,
      property: { select: { ownerId: true, title: true } },
    },
  })

  if (!room) notFound()
  if (room.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/properties/${id}/rooms`}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {room.property.title}
          </p>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">Editar Quarto</h2>
          <p className="text-slate-500 text-sm mt-0.5">{room.name}</p>
        </div>
      </div>

      <RoomEditForm propertyId={id} room={room} />
    </div>
  )
}
