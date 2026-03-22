'use client'

import { useRef, useState } from 'react'
import { Upload, X, Star, GripVertical, ImageOff } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedImage {
  id: string
  publicId: string
  url: string
  isCover: boolean
  alt: string | null
  order: number
}

interface ImageUploaderProps {
  /** Cloudinary folder path, e.g. "properties/chiado" */
  folder: string
  /** Initial images from DB */
  initialImages: UploadedImage[]
  /** Max images allowed (default 10) */
  maxImages?: number
  /** POST endpoint to create DB record, e.g. "/api/properties/[id]/images" */
  saveImageUrl: string
  /** Base URL for PATCH/DELETE per image, e.g. "/api/properties/[id]/images" */
  imageBaseUrl: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageUploader({
  folder,
  initialImages,
  maxImages = 10,
  saveImageUrl,
  imageBaseUrl,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(
    [...initialImages].sort((a, b) => a.order - b.order)
  )
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList)
    if (images.length + files.length > maxImages) {
      setUploadError(`Máximo ${maxImages} imagens permitidas.`)
      return
    }
    setUploadError(null)

    for (const file of files) {
      await uploadSingleFile(file)
    }
  }

  async function uploadSingleFile(file: File) {
    setIsUploading(true)
    setUploadError(null)
    try {
      // 1. Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok || uploadData.error) {
        setUploadError(uploadData.error ?? 'Erro ao fazer upload.')
        return
      }

      const { publicId, url } = uploadData.data as { publicId: string; url: string }

      // 2. Save to DB
      const isFirst = images.length === 0
      const saveRes = await fetch(saveImageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId,
          url,
          order: images.length,
          isCover: isFirst,
        }),
      })
      const saveData = await saveRes.json()

      if (!saveRes.ok || saveData.error) {
        // Cloudinary upload succeeded but DB save failed — clean up
        await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        })
        setUploadError(saveData.error ?? 'Erro ao guardar imagem.')
        return
      }

      setImages((prev) => [...prev, saveData.data as UploadedImage])
    } catch {
      setUploadError('Erro de ligação. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(image: UploadedImage) {
    setUploadError(null)
    try {
      const res = await fetch(`${imageBaseUrl}/${image.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error ?? 'Erro ao eliminar imagem.')
        return
      }
      const remaining = images.filter((i) => i.id !== image.id)
      // If deleted image was cover, promote next image
      if (image.isCover && remaining.length > 0) {
        await handleSetCover(remaining[0], remaining)
      } else {
        setImages(remaining)
      }
    } catch {
      setUploadError('Erro ao eliminar imagem.')
    }
  }

  // ── Cover ───────────────────────────────────────────────────────────────────

  async function handleSetCover(target: UploadedImage, currentImages?: UploadedImage[]) {
    setUploadError(null)
    const base = currentImages ?? images
    try {
      const res = await fetch(`${imageBaseUrl}/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCover: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error ?? 'Erro ao definir capa.')
        return
      }
      setImages(base.map((img) => ({ ...img, isCover: img.id === target.id })))
    } catch {
      setUploadError('Erro ao definir capa.')
    }
  }

  // ── Reorder (drag & drop) ───────────────────────────────────────────────────

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  async function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      return
    }
    const reordered = [...images]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const withOrder = reordered.map((img, i) => ({ ...img, order: i }))
    setImages(withOrder)
    setDragIndex(null)

    // Persist new orders
    await Promise.all(
      withOrder.map((img) =>
        fetch(`${imageBaseUrl}/${img.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: img.order }),
        })
      )
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const canUploadMore = images.length < maxImages && !isUploading

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      {canUploadMore && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-[#8b1a1a] bg-[#8b1a1a]/5'
              : 'border-slate-200 hover:border-[#8b1a1a]/40 hover:bg-slate-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-2 border-[#8b1a1a]/30 border-t-[#8b1a1a] rounded-full animate-spin" />
              <p className="text-sm font-medium">A fazer upload…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 select-none">
              <Upload size={32} className="text-slate-300" />
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="text-xs mt-1">JPG, PNG, WebP · máx. 10 MB · até {maxImages} imagens</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Images grid */}
      {images.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            {images.length} imagem{images.length !== 1 ? 'ns' : ''} · arraste para reordenar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                  img.isCover
                    ? 'border-[#8b1a1a]'
                    : 'border-transparent hover:border-slate-200'
                } ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-slate-100">
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.alt ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff size={24} className="text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Drag handle */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded p-0.5">
                  <GripVertical size={14} className="text-slate-500" />
                </div>

                {/* Cover badge */}
                {img.isCover && (
                  <div className="absolute top-2 right-2 bg-[#8b1a1a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} fill="white" />
                    Capa
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-between p-2 gap-1">
                  {!img.isCover && (
                    <button
                      onClick={() => handleSetCover(img)}
                      title="Definir como capa"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-slate-50 flex items-center gap-1"
                    >
                      <Star size={10} />
                      Capa
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img)}
                    title="Eliminar imagem"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto bg-red-600 text-white p-1.5 rounded-lg hover:bg-red-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !canUploadMore && (
        <p className="text-sm text-slate-400 text-center">Nenhuma imagem adicionada.</p>
      )}
    </div>
  )
}
