import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/shared/lib/auth'
import { db } from '@/shared/lib/db'
import { resolveImageUrl } from '@/shared/lib/cloudinary'
import ImageUploader, { type UploadedImage } from '@/domains/property/components/ImageUploader'

interface Props {
  params: Promise<{ id: string; roomId: string }>
}

export default async function RoomImagesPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') redirect('/dashboard')

  const { id: propertyId, roomId } = await params

  const room = await db.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      propertyId: true,
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
      property: {
        select: {
          id: true,
          title: true,
          slug: true,
          ownerId: true,
        },
      },
    },
  })

  if (!room || room.propertyId !== propertyId) notFound()
  if (room.property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const images: UploadedImage[] = room.images.map((img) => ({
    ...img,
    url: resolveImageUrl(img),
    alt: img.alt,
  }))

  const folder = `properties/${room.property.slug}/rooms/${room.id}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/properties/${propertyId}/images`}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {room.property.title}
          </p>
          <h2 className="text-2xl font-extrabold text-[#1a1a2e] tracking-tight">
            Imagens — {room.name}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Faça upload, reordene e defina a imagem de capa do quarto.
          </p>
        </div>
      </div>

      {/* Uploader */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <ImageUploader
          folder={folder}
          initialImages={images}
          saveImageUrl={`/api/rooms/${room.id}/images`}
          imageBaseUrl={`/api/rooms/${room.id}/images`}
          maxImages={10}
        />
      </div>
    </div>
  )
}
