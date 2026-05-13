'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { ImageCategory } from '@prisma/client'
import { IMAGE_CATEGORIES } from '@/shared/utils/imageCategories'
import { sileo } from 'sileo'
import { Star, X, Upload, ImageOff, ChevronDown } from 'lucide-react'
import { type UploadedImage } from '@/domains/property/components/ImageUploader'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIP_KEY = 'category-tip-dismissed'

const ORDERED_CATEGORIES = Object.entries(IMAGE_CATEGORIES)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key]) => key as ImageCategory)

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  propertyId:    string
  propertySlug:  string
  initialImages: UploadedImage[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImagesClient({ propertyId, propertySlug, initialImages }: Props) {
  const [images,       setImages]       = useState<UploadedImage[]>(initialImages)
  const [tipDismissed, setTipDismissed] = useState(true)
  const [expanded,     setExpanded]     = useState<Partial<Record<ImageCategory, boolean>>>(() => {
    const cats = new Set(initialImages.map(img => img.category ?? 'OUTRO'))
    const init: Partial<Record<ImageCategory, boolean>> = {}
    for (const cat of ORDERED_CATEGORIES) init[cat] = cats.has(cat)
    return init
  })
  const [activeCat,  setActiveCat]  = useState<ImageCategory | null>(null)
  const [uploadingCat, setUploadingCat] = useState<ImageCategory | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTipDismissed(localStorage.getItem(TIP_KEY) === '1')
  }, [])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    const map = Object.fromEntries(ORDERED_CATEGORIES.map(c => [c, [] as UploadedImage[]])) as Record<ImageCategory, UploadedImage[]>
    for (const img of images) {
      const cat = (img.category ?? 'OUTRO') as ImageCategory
      map[cat].push(img)
    }
    return map
  }, [images])

  const filledSections = ORDERED_CATEGORIES.filter(cat => grouped[cat].length > 0).length
  const hasUncategorized = images.some(img => !img.category || img.category === 'OUTRO')

  function progressText(n: number): string {
    if (n === 0) return 'Adicione fotos para cada divisão'
    if (n <= 4)  return 'Bom começo! Continue a adicionar fotos'
    if (n <= 8)  return 'A ficar completo!'
    return 'Galeria completa! 🎉'
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  function openFilePicker(cat: ImageCategory) {
    setActiveCat(cat)
    setExpanded(prev => ({ ...prev, [cat]: true }))
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length && activeCat) {
      uploadFiles(Array.from(e.target.files), activeCat)
    }
    e.target.value = ''
  }

  function uploadFiles(files: File[], category: ImageCategory) {
    setActiveCat(null)
    for (const file of files) uploadOne(file, category)
  }

  function uploadOne(file: File, category: ImageCategory) {
    setUploadingCat(category)

    const run = async () => {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', `properties/${propertySlug}`)

      const upRes  = await fetch('/api/upload', { method: 'POST', body: form })
      const upData = await upRes.json()
      if (!upRes.ok || upData.error) throw new Error(upData.error ?? 'Erro no upload')

      const { publicId, url } = upData.data as { publicId: string; url: string }

      const isFirst = images.length === 0
      const saveRes  = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, url, order: images.length, isCover: isFirst, category }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || saveData.error) {
        await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        })
        throw new Error(saveData.error ?? 'Erro ao guardar')
      }

      const saved = saveData.data as UploadedImage
      setImages(prev => [...prev, { ...saved, url }])
      return saved
    }

    sileo.promise(run(), {
      loading: { title: 'A carregar foto…' },
      success: { title: 'Foto adicionada!', description: IMAGE_CATEGORIES[category].label.pt },
      error:   { title: 'Erro ao carregar foto', description: 'Tente novamente' },
    }).finally(() => setUploadingCat(null))
  }

  // ── Cover ─────────────────────────────────────────────────────────────────

  function handleSetCover(imageId: string) {
    sileo.promise(
      (async () => {
        const res = await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCover: true }),
        })
        if (!res.ok) throw new Error()
        setImages(prev => prev.map(img => ({ ...img, isCover: img.id === imageId })))
      })(),
      {
        loading: { title: 'A definir capa…' },
        success: { title: 'Foto de capa definida!' },
        error:   { title: 'Erro', description: 'Não foi possível definir a capa' },
      }
    )
  }

  // ── Move category ──────────────────────────────────────────────────────────

  async function handleMove(imageId: string, newCat: ImageCategory) {
    const res = await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: newCat }),
    })
    if (!res.ok) { sileo.error({ title: 'Erro ao mover foto' }); return }
    setImages(prev => prev.map(img => img.id === imageId ? { ...img, category: newCat } : img))
    sileo.success({
      title: 'Foto movida',
      description: `${IMAGE_CATEGORIES[newCat].icon} ${IMAGE_CATEGORIES[newCat].label.pt}`,
    })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(imageId: string) {
    const res = await fetch(`/api/properties/${propertyId}/images/${imageId}`, { method: 'DELETE' })
    if (!res.ok) { sileo.error({ title: 'Erro ao eliminar foto' }); return }
    const remaining = images.filter(img => img.id !== imageId)
    const deleted   = images.find(img => img.id === imageId)
    if (deleted?.isCover && remaining.length > 0) {
      await fetch(`/api/properties/${propertyId}/images/${remaining[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCover: true }),
      })
      setImages(remaining.map((img, i) => ({ ...img, isCover: i === 0 })))
    } else {
      setImages(remaining)
    }
  }

  // ── Drag-and-drop for section upload zone ──────────────────────────────────

  function handleSectionDrop(e: React.DragEvent, cat: ImageCategory) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) uploadFiles(Array.from(e.dataTransfer.files), cat)
  }

  // ── Tip ───────────────────────────────────────────────────────────────────

  function dismissTip() {
    localStorage.setItem(TIP_KEY, '1')
    setTipDismissed(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Summary line ── */}
      {images.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-semibold text-slate-600">
            {images.length} foto{images.length !== 1 ? 's' : ''}
          </span>
          {ORDERED_CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
            <span key={cat} className="flex items-center gap-1">
              <span className="text-slate-300">·</span>
              <span>{IMAGE_CATEGORIES[cat].icon} {IMAGE_CATEGORIES[cat].label.pt} ({grouped[cat].length})</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Tip banner ── */}
      {!tipDismissed && hasUncategorized && images.length > 0 && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <span className="text-lg mt-0.5">💡</span>
          <p className="text-sm text-blue-700 flex-1">
            Categorize as suas fotos para uma melhor experiência na galeria.
            Os hóspedes podem filtrar por divisão.
          </p>
          <button type="button" onClick={dismissTip}
            className="text-blue-400 hover:text-blue-600 transition-colors shrink-0 p-0.5">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Progress ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#1a1a2e]">
            Secções com fotos: <span className="text-[#8b1a1a]">{filledSections}</span> / {ORDERED_CATEGORIES.length}
          </span>
          <span className="text-slate-500 text-xs">{progressText(filledSections)}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#8b1a1a] rounded-full transition-all duration-500"
            style={{ width: `${(filledSections / ORDERED_CATEGORIES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Empty state (no images at all) ── */}
      {images.length === 0 && (
        <div
          className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center cursor-pointer hover:border-[#8b1a1a]/40 hover:bg-slate-50 transition-colors"
          onClick={() => openFilePicker('SALA')}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleSectionDrop(e, 'SALA')}
        >
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Upload size={40} className="text-slate-300" />
            <div>
              <p className="text-base font-semibold text-slate-600">
                Comece por adicionar a foto principal da sua propriedade
              </p>
              <p className="text-sm mt-1">JPG, PNG, WebP · a foto principal será atribuída à Sala</p>
            </div>
            <button
              type="button"
              className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#8b1a1a] text-white rounded-xl text-sm font-semibold hover:bg-[#6d1414] transition-colors"
            >
              <Upload size={16} />
              Adicionar primeira foto
            </button>
          </div>
        </div>
      )}

      {/* ── Category sections ── */}
      {ORDERED_CATEGORIES.map(cat => {
        const cfg   = IMAGE_CATEGORIES[cat]
        const imgs  = grouped[cat]
        const count = imgs.length
        const open  = expanded[cat] ?? false
        const isUploading = uploadingCat === cat

        return (
          <div key={cat} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Section header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              onClick={() => setExpanded(prev => ({ ...prev, [cat]: !open }))}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-sm font-bold text-[#1a1a2e]">{cfg.label.pt}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  count > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {count} foto{count !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Section body */}
            {open && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">

                {/* Image grid */}
                {imgs.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imgs.map(img => (
                      <ImageCard
                        key={img.id}
                        image={img}
                        currentCategory={cat}
                        onSetCover={() => handleSetCover(img.id)}
                        onMove={newCat => handleMove(img.id, newCat)}
                        onDelete={() => handleDelete(img.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Upload zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isUploading
                      ? 'border-[#8b1a1a]/30 bg-[#8b1a1a]/5'
                      : 'border-slate-200 hover:border-[#8b1a1a]/40 hover:bg-slate-50'
                  }`}
                  onClick={() => !isUploading && openFilePicker(cat)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleSectionDrop(e, cat)}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-[#8b1a1a]">
                      <div className="w-4 h-4 border-2 border-[#8b1a1a]/30 border-t-[#8b1a1a] rounded-full animate-spin" />
                      A carregar…
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-slate-400 select-none">
                      <Upload size={16} className="text-slate-300" />
                      <span className="text-xs">
                        Clique ou arraste fotos de <strong>{cfg.label.pt}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  )
}

// ─── ImageCard ────────────────────────────────────────────────────────────────

function ImageCard({
  image,
  currentCategory,
  onSetCover,
  onMove,
  onDelete,
}: {
  image:           UploadedImage
  currentCategory: ImageCategory
  onSetCover:      () => void
  onMove:          (cat: ImageCategory) => void
  onDelete:        () => void
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-slate-200 transition-all aspect-[4/3] bg-slate-100">

      {/* Image */}
      {image.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt ?? ''} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff size={24} className="text-slate-300" />
        </div>
      )}

      {/* Cover badge */}
      {image.isCover && (
        <div className="absolute top-2 left-2 bg-[#8b1a1a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star size={9} fill="white" />
          Capa
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-150" />

      {/* Action buttons */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-end justify-between p-2">

        {/* Top-right: delete */}
        <button
          type="button"
          onClick={onDelete}
          className="bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700 transition-colors"
          title="Eliminar"
        >
          <X size={12} />
        </button>

        {/* Bottom: star + move select */}
        <div className="w-full flex items-center gap-1.5">
          {!image.isCover && (
            <button
              type="button"
              onClick={onSetCover}
              className="bg-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-slate-50 flex items-center gap-1 transition-colors"
              title="Definir como capa"
            >
              <Star size={10} />
              Capa
            </button>
          )}
          <select
            value={currentCategory}
            onChange={e => onMove(e.target.value as ImageCategory)}
            onClick={e => e.stopPropagation()}
            className="flex-1 text-[10px] bg-white/90 border border-white/20 rounded-lg px-1.5 py-1 text-slate-700 outline-none cursor-pointer truncate"
            title="Mover para categoria"
          >
            {ORDERED_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {IMAGE_CATEGORIES[cat].icon} {IMAGE_CATEGORIES[cat].label.pt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
