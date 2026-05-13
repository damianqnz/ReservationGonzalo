'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { sileo } from 'sileo'

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

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  async function handleDelete() {
    setLoading(true)

    const deletePromise = async () => {
      const res  = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' })
      const json = await res.json() as { data: unknown; error: string | null }

      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Erro ao eliminar')
      }

      onDeleted()
      onClose()
      return true
    }

    sileo.promise(deletePromise(), {
      loading: { title: 'A eliminar quarto...' },
      success: { 
        title: 'Quarto eliminado', 
        description: `&ldquo;${room.name}&rdquo; foi removido com sucesso` 
      },
      error: (err: unknown) => ({
        title: 'Erro ao eliminar',
        description: err instanceof Error ? err.message : 'Tente novamente'
      })
    })
    .finally(() => setLoading(false))
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

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
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
