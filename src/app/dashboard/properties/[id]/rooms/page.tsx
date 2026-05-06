import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { resolveImageUrl } from '@/shared/lib/cloudinary'
import DeleteRoomButton from '@/components/dashboard/DeleteRoomButton'

interface Props {
  params: Promise<{ id: string }>
}

const ROOM_TYPE_LABEL: Record<string, string> = {
  SINGLE: 'Individual',
  DOUBLE: 'Duplo',
  TWIN: 'Twin',
  SUITE: 'Suite',
  JUNIOR_SUITE: 'Suite Junior',
  FAMILY: 'Familiar',
  STUDIO: 'Estúdio',
  ENTIRE_PLACE: 'Alojamento completo',
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:      { label: 'Ativo',          bg: 'bg-emerald-50', text: 'text-emerald-700' },
  INACTIVE:    { label: 'Inativo',         bg: 'bg-amber-50',   text: 'text-amber-700'   },
  MAINTENANCE: { label: 'Em manutenção',   bg: 'bg-red-50',     text: 'text-red-700'     },
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default async function PropertyRoomsPage({ params }: Props) {
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
      rooms: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          status: true,
          maxGuests: true,
          bedrooms: true,
          bathrooms: true,
          beds: true,
          pricePerNight: true,
          order: true,
          images: {
            where: { isCover: true },
            select: { url: true, publicId: true, alt: true },
            take: 1,
          },
          bookings: {
            where: {
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!property) notFound()
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/properties"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            title="Voltar"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              {property.title}
            </p>
            <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">
              Quartos
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {property.rooms.length} quarto{property.rooms.length !== 1 ? 's' : ''} registado{property.rooms.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/properties/${id}/rooms/new`}
          className="bg-[#8b1a1a] text-white px-5 py-2.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/10 hover:opacity-90 transition-all active:scale-95 text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Novo Quarto
        </Link>
      </div>

      {/* Empty state */}
      {property.rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">bed</span>
          <p className="text-slate-400 mt-2 font-medium">Nenhum quarto registado.</p>
          <p className="text-sm text-slate-400 mt-1">
            Adicione o primeiro quarto para começar a gerir a disponibilidade por tipo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {property.rooms.map((room) => {
            const coverImage = room.images[0]
            const badge = STATUS_BADGE[room.status] ?? STATUS_BADGE.ACTIVE
            const activeBookings = room.bookings.length
            const resolvedUrl = coverImage ? resolveImageUrl(coverImage) : null

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Cover image */}
                <div className="h-40 bg-slate-100 relative overflow-hidden">
                  {resolvedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedUrl}
                      alt={coverImage?.alt ?? room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-300">bed</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#1a1a2e] text-base truncate">{room.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ROOM_TYPE_LABEL[room.type] ?? room.type}
                      </p>
                    </div>
                    <DeleteRoomButton room={{ id: room.id, name: room.name }} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservas</p>
                      <p className="text-sm font-bold text-[#1a1a2e] mt-0.5">{activeBookings}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Noite</p>
                      <p className="text-sm font-bold text-[#1a1a2e] mt-0.5">{fmtCurrency(room.pricePerNight)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hóspedes</p>
                      <p className="text-sm font-bold text-[#1a1a2e] mt-0.5">até {room.maxGuests}</p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bed</span>
                      {room.bedrooms} q.
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bathtub</span>
                      {room.bathrooms} wc
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">king_bed</span>
                      {room.beds} cama{room.beds !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto">
                    <Link
                      href={`/dashboard/properties/${id}/rooms/${room.id}/images`}
                      className="flex-1 text-center text-xs font-bold text-slate-600 border border-slate-200 rounded-lg py-2 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">photo_library</span>
                      Imagens
                    </Link>
                    <Link
                      href={`/dashboard/properties/${id}/rooms/${room.id}/edit`}
                      className="flex-1 text-center text-xs font-bold text-[#8b1a1a] border border-[#8b1a1a]/30 rounded-lg py-2 hover:bg-[#8b1a1a]/5 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Editar Quarto
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
