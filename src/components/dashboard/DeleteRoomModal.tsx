'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  room:      { id: string; name: string }
  isOpen:    boolean
  onClose:   () => void
  onDeleted: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeleteRoomModal({ room, isOpen, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  async function handleDelete() {
    setLoading(true)
    setError(null)

    try {
      const res  = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' })
      const json = await res.json() as { data: unknown; error: string | null }

      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : 'Erro ao eliminar. Tente novamente.')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onDeleted()
        onClose()
      }, 1200)
    } catch {
      setError('Erro de ligação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-[#1a1a2e] tracking-tight">
            Eliminar Quarto
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={24} className="text-red-600" />
            </div>
          </div>

          {/* Warning text */}
          <div className="text-sm text-slate-600 text-center space-y-1">
            <p>
              Tem a certeza que deseja eliminar{' '}
              <span className="font-bold text-[#1a1a2e]">&ldquo;{room.name}&rdquo;</span>?
            </p>
            <p className="text-xs text-slate-400">
              As imagens e dados do quarto serão permanentemente eliminados.
            </p>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">warning</span>
            <p className="text-xs">
              Quartos com reservas ativas <strong>não podem ser eliminados</strong>. Cancele as reservas primeiro.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-semibold">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Quarto eliminado
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || success}
            className="px-5 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || success}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                A eliminar...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Eliminar Quarto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
