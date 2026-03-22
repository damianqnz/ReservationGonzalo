import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { resolveImageUrl } from '@/lib/cloudinary'
import ImageUploader, { type UploadedImage } from '@/components/ui/ImageUploader'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PropertyImagesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id } = await params

  const property = await db.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      ownerId: true,
      hasRooms: true,
      images: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          publicId: true,
          url: true,
          isCover: true,
          alt: true,
          order: true,
        },
      },
      rooms: {
        where: { status: 'ACTIVE' },
        orderBy: { order: 'asc' },
        select: { id: true, name: true },
      },
    },
  })

  if (!property) notFound()
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') redirect('/dashboard')

  // Resolve display URLs server-side
  const images: UploadedImage[] = property.images.map((img) => ({
    ...img,
    url: resolveImageUrl(img),
    alt: img.alt,
  }))

  const folder = `properties/${property.slug}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/properties"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">
            Imagens — {property.title}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Faça upload, reordene e defina a imagem de capa da propriedade.
          </p>
        </div>
      </div>

      {/* Uploader */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <ImageUploader
          folder={folder}
          initialImages={images}
          saveImageUrl={`/api/properties/${property.id}/images`}
          imageBaseUrl={`/api/properties/${property.id}/images`}
          maxImages={20}
        />
      </div>

      {/* Rooms section (if property has rooms) */}
      {property.hasRooms && property.rooms.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#1a1a2e] mb-4">Imagens por quarto</h3>
          <div className="space-y-2">
            {property.rooms.map((room) => (
              <Link
                key={room.id}
                href={`/dashboard/properties/${property.id}/rooms/${room.id}/images`}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-[#8b1a1a]/30 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-lg">bed</span>
                  <span className="text-sm font-medium text-slate-700">{room.name}</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#8b1a1a] text-lg transition-colors">
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
