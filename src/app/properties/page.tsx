import type { Metadata } from 'next'
import { PropertyStatus } from '@prisma/client'
import { db } from '@/shared/lib/db'
import { resolveImageUrl } from '@/shared/lib/cloudinary'
import PropertyCard from '@/components/property/PropertyCard'

export const metadata: Metadata = {
  title: 'Propriedades',
  description: 'Todos os alojamentos disponíveis.',
}

interface Props {
  searchParams: Promise<{ ownerId?: string; page?: string }>
}

/**
 * Public properties listing page.
 * Supports optional ?ownerId= filter to show properties by a specific host.
 */
export default async function PropertiesPage({ searchParams }: Props) {
  const { ownerId, page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    status: PropertyStatus.ACTIVE,
    ...(ownerId ? { ownerId } : {}),
  }

  const [properties, total] = await db.$transaction([
    db.property.findMany({
      where,
      select: {
        title: true,
        slug: true,
        city: true,
        country: true,
        pricePerNight: true,
        images: {
          where: { isCover: true },
          select: { url: true, publicId: true, alt: true },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    db.property.count({ where }),
  ])

  const cards = properties.map((p) => {
    const avgRating =
      p.reviews.length > 0
        ? Math.round(
            (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length) * 10,
          ) / 10
        : null
    const cover = p.images[0]
    return {
      slug: p.slug,
      name: p.title,
      location: `${p.city}, ${p.country}`,
      price: `€${p.pricePerNight.toFixed(0)}`,
      rating: avgRating !== null ? avgRating.toFixed(1) : '–',
      image: cover ? resolveImageUrl(cover, { width: 600, height: 400 }) : '',
      publicId: cover?.publicId,
      alt: cover?.alt ?? p.title,
    }
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-white border-b border-surface">
        <div className="container-main py-6">
          <h1 className="text-[24px] font-display font-bold text-text-main">
            Propriedades disponíveis
          </h1>
          <p className="text-[14px] text-text-muted mt-1">{total} alojamento{total !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <main className="container-main py-8">
        {cards.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <span className="material-symbols-outlined text-[48px] mb-3 block">home</span>
            <p className="text-[16px]">Nenhuma propriedade disponível de momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
                <PropertyCard
                  key={card.slug}
                  {...card}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                {page > 1 && (
                  <a
                    href={`?${ownerId ? `ownerId=${ownerId}&` : ''}page=${page - 1}`}
                    className="px-4 py-2 rounded-lg border border-surface text-[14px] hover:bg-surface transition-colors"
                  >
                    Anterior
                  </a>
                )}
                <span className="text-[13px] text-text-muted px-2">
                  Página {page} de {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={`?${ownerId ? `ownerId=${ownerId}&` : ''}page=${page + 1}`}
                    className="px-4 py-2 rounded-lg border border-surface text-[14px] hover:bg-surface transition-colors"
                  >
                    Seguinte
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
