'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageCategory } from '@prisma/client'
import { Grid2x2, Camera } from 'lucide-react'
import { resolveImageUrl } from '@/lib/cloudinary'
import GalleryModal from './GalleryModal'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string
  url: string
  publicId: string
  alt: string | null
  isCover: boolean
  order: number
  category: ImageCategory
}

interface PropertyGalleryProps {
  images: GalleryImage[]
  propertyTitle: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyGallery({ images, propertyTitle }: PropertyGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="w-full h-[280px] bg-slate-100 flex items-center justify-center rounded-xl">
        <div className="flex flex-col items-center gap-2 text-slate-300">
          <Camera size={48} strokeWidth={1.5} />
          <span className="text-sm font-medium">Sem fotografias</span>
        </div>
      </div>
    )
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order)
  const cover         = sortedImages.find((img) => img.isCover) ?? sortedImages[0]
  const rest          = sortedImages.filter((img) => img.id !== cover.id)
  const top           = rest[0] ?? null
  const bottom        = rest[1] ?? null
  const total         = sortedImages.length

  function openAt(index: number) {
    setInitialIndex(index)
    setModalOpen(true)
  }

  const coverIndex  = sortedImages.indexOf(cover)
  const topIndex    = top    ? sortedImages.indexOf(top)    : 0
  const bottomIndex = bottom ? sortedImages.indexOf(bottom) : 0

  return (
    <>
      {/* ── Desktop collage (md+) ───────────────────────────────────────────── */}
      <div
        className="hidden md:grid w-full overflow-hidden rounded-xl"
        style={{
          height: 'calc(100svh - 64px - 56px)',
          maxHeight: '600px',
          minHeight: '400px',
          gridTemplateColumns: '3fr 2fr',
          gridTemplateRows: '1fr 1fr',
          gap: '4px',
        }}
      >
        {/* Cover — spans 2 rows */}
        <div
          className="relative row-span-2 cursor-pointer group overflow-hidden"
          onClick={() => openAt(coverIndex)}
        >
          <Image
            src={resolveImageUrl(cover, { width: 1200 })}
            alt={cover.alt ?? propertyTitle}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 768px) 60vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Top-right */}
        {top ? (
          <div
            className="relative cursor-pointer group overflow-hidden"
            onClick={() => openAt(topIndex)}
          >
            <Image
              src={resolveImageUrl(top, { width: 800 })}
              alt={top.alt ?? propertyTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="40vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ) : (
          <div className="bg-slate-100 flex items-center justify-center">
            <Camera className="text-slate-200" size={32} />
          </div>
        )}

        {/* Bottom-right — with "Ver mais" overlay */}
        {bottom ? (
          <div
            className="relative cursor-pointer group overflow-hidden"
            onClick={() => openAt(bottomIndex)}
          >
            <Image
              src={resolveImageUrl(bottom, { width: 800 })}
              alt={bottom.alt ?? propertyTitle}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="40vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            
            {/* "Ver mais fotos" button */}
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openAt(0)
                }}
                className="flex items-center gap-2 bg-white text-slate-900 text-[13px] font-bold px-4 py-2 rounded-lg shadow-xl hover:bg-slate-50 transition-all transform active:scale-95"
              >
                <Grid2x2 size={16} className="text-[#8b1a1a]" />
                Ver {total} fotos
              </button>
            </div>
          </div>
        ) : (
          <div className="relative bg-slate-100 flex items-center justify-center">
            <Camera className="text-slate-200" size={32} />
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={() => openAt(0)}
                className="flex items-center gap-2 bg-white text-slate-900 text-[13px] font-bold px-4 py-2 rounded-lg shadow-xl hover:bg-slate-50 transition-all transform active:scale-95"
              >
                <Grid2x2 size={16} className="text-[#8b1a1a]" />
                Ver {total} fotos
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile single image (< md) ──────────────────────────────────────── */}
      <div
        className="md:hidden relative w-full overflow-hidden cursor-pointer"
        style={{ height: '60vw', maxHeight: '320px' }}
        onClick={() => openAt(coverIndex)}
      >
        <Image
          src={resolveImageUrl(cover, { width: 800 })}
          alt={cover.alt ?? propertyTitle}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        {/* Mobile "Ver fotos" overlay */}
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openAt(0)
            }}
            className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white text-[12px] font-bold px-4 py-2 rounded-full border border-white/20 shadow-lg"
          >
            <Camera size={14} />
            Ver {total} fotos
          </button>
        </div>
      </div>

      {/* ── Gallery Modal ────────────────────────────────────────────────────── */}
      <GalleryModal
        images={sortedImages}
        propertyTitle={propertyTitle}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialImageIndex={initialIndex}
      />
    </>
  )
}
