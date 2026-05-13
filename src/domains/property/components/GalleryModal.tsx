'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { ImageCategory } from '@prisma/client'
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { IMAGE_CATEGORIES, getCategoryLabel, groupImagesByCategory } from '@/shared/utils/imageCategories'
import { resolveImageUrl } from '@/shared/lib/cloudinary'
import type { GalleryImage } from './PropertyGallery'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryModalProps {
  images: GalleryImage[]
  propertyTitle: string
  isOpen: boolean
  onClose: () => void
  initialCategory?: ImageCategory
  initialImageIndex?: number
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: GalleryImage[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setIdx((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setIdx((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  const current = images[idx]
  const catConfig = IMAGE_CATEGORIES[current.category]

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">
             {idx + 1} / {images.length}
          </span>
          <span className="text-white/70 text-xs mt-0.5">
            {catConfig.icon} {catConfig.label.pt}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          aria-label="Fechar lightbox"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const diff = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
          touchStartX.current = null
        }}
      >
        <div className="relative w-full h-full">
          <Image
            key={current.id}
            src={resolveImageUrl(current, { width: 1600 })}
            alt={current.alt ?? ''}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Navigation Arrows (Desktop) */}
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all backdrop-blur-sm"
          aria-label="Foto anterior"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all backdrop-blur-sm"
          aria-label="Próxima foto"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Footer / Caption */}
      {current.alt && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center">
          <p className="text-white text-sm max-w-2xl mx-auto shadow-sm">
            {current.alt}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Gallery Modal ─────────────────────────────────────────────────────────────

export default function GalleryModal({
  images,
  propertyTitle,
  isOpen,
  onClose,
  initialCategory,
  initialImageIndex = 0,
}: GalleryModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<ImageCategory | 'ALL'>(
    initialCategory ?? 'ALL'
  )
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})
  const mainScrollRef = useRef<HTMLDivElement>(null)

  const grouped = groupImagesByCategory(images)

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = originalStyle }
  }, [isOpen])

  // ESC to close (when lightbox is NOT open)
  useEffect(() => {
    if (!isOpen || lightboxIndex !== null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, lightboxIndex])

  function scrollToCategory(cat: ImageCategory) {
    setActiveCategory(cat)
    const el = categoryRefs.current[cat]
    if (el && mainScrollRef.current) {
      const topOffset = el.offsetTop - 20 // add some padding
      mainScrollRef.current.scrollTo({ top: topOffset, behavior: 'smooth' })
    }
  }

  if (!isOpen) return null

  // Compute columns for image group
  function getColsClass(count: number): string {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count === 3) return 'grid-cols-2 lg:grid-cols-3'
    return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
  }

  return (
    <>
      {/* Lightbox layer (z-70) */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Modal Main Container (z-60) */}
      <div className="fixed inset-0 z-[60] bg-white flex flex-col md:bg-slate-50">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-200 bg-white sticky top-0 z-20">
          <div className="flex flex-col">
            <h2 className="text-slate-900 font-bold text-lg md:text-xl line-clamp-1">{propertyTitle}</h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Galeria de fotos · {images.length} imagens</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            aria-label="Fechar galeria"
          >
            Fechar <X size={18} />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
          <aside className="hidden md:flex flex-col w-72 border-r border-slate-200 bg-white overflow-y-auto shrink-0 pb-10">
            <nav className="p-4 space-y-1">
              {/* All tab */}
              <button
                onClick={() => {
                  setActiveCategory('ALL')
                  mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === 'ALL'
                    ? 'text-white bg-[#1a1a2e] shadow-lg shadow-navy-900/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>Todas as fotos</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeCategory === 'ALL' ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {images.length}
                </span>
              </button>

              <div className="h-px bg-slate-100 my-4 mx-2" />

              {/* Per-category tabs */}
              {grouped.map(({ category, images: catImages }) => {
                const cfg = IMAGE_CATEGORIES[category]
                const isActive = activeCategory === category
                return (
                  <button
                    key={category}
                    onClick={() => scrollToCategory(category)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'text-white bg-[#8b1a1a] shadow-lg shadow-red-900/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{cfg.icon}</span>
                      {getCategoryLabel(category)}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {catImages.length}
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* ── Main content Area ─────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile / Tablet: horizontal category pills */}
            <div className="md:hidden flex gap-2 px-4 py-4 overflow-x-auto bg-white border-b border-slate-100 no-scrollbar sticky top-0 z-10">
              <button
                onClick={() => {
                  setActiveCategory('ALL')
                  mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`shrink-0 text-[13px] font-bold px-4 py-2 rounded-full transition-all border ${
                  activeCategory === 'ALL'
                    ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Todas ({images.length})
              </button>
              {grouped.map(({ category, images: catImages }) => {
                const cfg = IMAGE_CATEGORIES[category]
                const isActive = activeCategory === category
                return (
                  <button
                    key={category}
                    onClick={() => scrollToCategory(category)}
                    className={`shrink-0 text-[13px] font-bold px-4 py-2 rounded-full transition-all border ${
                      isActive
                        ? 'bg-[#8b1a1a] text-white border-[#8b1a1a]'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {cfg.icon} {getCategoryLabel(category)} ({catImages.length})
                  </button>
                )
              })}
            </div>

            {/* Scrollable Gallery Grid */}
            <main 
              ref={mainScrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 md:bg-white"
            >
              <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {grouped.map(({ category, images: catImages }) => {
                  const cfg = IMAGE_CATEGORIES[category]
                  return (
                    <section
                      key={category}
                      ref={(el) => { categoryRefs.current[category] = el }}
                      className="scroll-mt-6"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl">{cfg.icon}</span>
                        <h3 className="text-slate-900 font-extrabold text-xl md:text-2xl tracking-tight">
                          {getCategoryLabel(category)}
                          <span className="text-slate-400 font-medium text-sm md:text-base ml-3">
                            {catImages.length} foto{catImages.length !== 1 ? 's' : ''}
                          </span>
                        </h3>
                      </div>
                      
                      <div className={`grid ${getColsClass(catImages.length)} gap-3 md:gap-4`}>
                        {catImages.map((img) => {
                          const globalIdx = images.indexOf(img)
                          return (
                            <div
                              key={img.id}
                              className="relative aspect-[4/3] md:aspect-[3/2] overflow-hidden rounded-2xl cursor-pointer group bg-slate-100"
                              onClick={() => setLightboxIndex(globalIdx)}
                            >
                              <Image
                                src={resolveImageUrl(img, { width: 800 })}
                                alt={img.alt ?? ''}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 50vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
