import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus, PropertyStatus } from '@prisma/client'
import Link from 'next/link'
import PropertyManageButton from '@/components/dashboard/PropertyManageButton'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE:   { label: 'Ativa',      bg: 'bg-emerald-50', text: 'text-emerald-700' },
  DRAFT:    { label: 'Rascunho',   bg: 'bg-slate-100',  text: 'text-slate-600'   },
  INACTIVE: { label: 'Inativa',    bg: 'bg-amber-50',   text: 'text-amber-700'   },
  ARCHIVED: { label: 'Arquivada',  bg: 'bg-red-50',     text: 'text-red-700'     },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertiesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isAdmin = session.user.role === 'ADMIN'

  const properties = await db.property.findMany({
    where: {
      status: { not: PropertyStatus.ARCHIVED },
      // ADMIN sees all properties; OWNER sees only their own
      ...(isAdmin ? {} : { ownerId: session.user.id }),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
      pricePerNight: true,
      maxGuests: true,
      bedrooms: true,
      bathrooms: true,
      city: true,
      images: {
        where: { isCover: true },
        select: { url: true, alt: true },
        take: 1,
      },
      bookings: {
        where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
        select: { id: true },
      },
      reviews: {
        where: { isPublished: true },
        select: { rating: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Propriedades</h2>
          <p className="text-slate-500 mt-1">
            {properties.length} propriedade{properties.length !== 1 ? 's' : ''} registada{properties.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="bg-[#8b1a1a] text-white px-6 py-2.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/10 hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Propriedade
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">home_work</span>
          <p className="text-slate-400 mt-2 font-medium">Nenhuma propriedade encontrada.</p>
          <p className="text-sm text-slate-400 mt-1">Adicione a sua primeira propriedade para começar a receber reservas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property) => {
            const activeBookings = property.bookings.length
            const reviewCount = property.reviews.length
            const avgRating =
              reviewCount > 0
                ? (property.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
                : null
            const coverImage = property.images[0]
            const badge = STATUS_BADGE[property.status] ?? STATUS_BADGE.DRAFT

            return (
              <div
                key={property.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                {/* Cover image */}
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage.url}
                      alt={coverImage.alt ?? property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-slate-300">home_work</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col gap-4 flex-1">
                  <div>
                    <h3 className="font-bold text-[#1a1a2e] text-base truncate">{property.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {property.city}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservas</p>
                      <p className="text-sm font-bold text-[#1a1a2e] mt-0.5">{activeBookings}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avaliação</p>
                      <p className="text-sm font-bold text-[#1a1a2e] mt-0.5">
                        {avgRating ? (
                          <span className="flex items-center justify-center gap-0.5">
                            <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            {avgRating}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Noite</p>
                      <p className="text-sm font-bold text-[#1a1a2e] mt-0.5">{fmtCurrency(property.pricePerNight)}</p>
                    </div>
                  </div>

                  {/* Amenities row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bed</span>
                      {property.bedrooms} quarto{property.bedrooms !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bathtub</span>
                      {property.bathrooms} wc
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">group</span>
                      até {property.maxGuests}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 mt-auto">
                    <PropertyManageButton
                      property={{ id: property.id, title: property.title, slug: property.slug }}
                    />
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
