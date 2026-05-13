'use client'

import React, { useState } from 'react'
import { X, Star, AlertCircle } from 'lucide-react'
import { sileo } from 'sileo'

interface Property {
  id: string
  title: string
}

interface ImportReviewModalProps {
  isOpen: boolean
  onClose: () => void
  properties: Property[]
  onSuccess: () => void
}

const SOURCES = [
  { id: 'AIRBNB', label: 'Airbnb' },
  { id: 'BOOKING', label: 'Booking.com' },
  { id: 'MANUAL', label: 'Outra / Manual' },
]

/**
 * Modal to manually import reviews from external sources.
 */
export default function ImportReviewModal({ isOpen, onClose, properties, onSuccess }: ImportReviewModalProps) {
  const [formData, setFormData] = useState({
    propertyId: '',
    source: 'AIRBNB' as 'AIRBNB' | 'BOOKING' | 'MANUAL',
    guestName: '',
    rating: 5,
    comment: '',
    stayDate: '',
    sourceUrl: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!formData.propertyId || !formData.guestName || !formData.comment) {
      sileo.error({ 
        title: 'Campos obrigatórios', 
        description: 'Por favor preencha todos os campos obrigatórios.' 
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.error) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Erro na importação. Verifique os dados.')
      }

      sileo.success({ 
        title: 'Avaliação importada!', 
        description: 'Já aparece na página da propriedade' 
      })
      
      // Reset form
      setFormData({
        propertyId: '',
        source: 'AIRBNB',
        guestName: '',
        rating: 5,
        comment: '',
        stayDate: '',
        sourceUrl: '',
      })
      
      onSuccess()
    } catch (error: any) {
      sileo.error({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao importar a avaliação.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Importar avaliação externa</h2>
            <p className="text-sm text-slate-500">Adicione manualmente avaliações de outras plataformas</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="Fechar"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Atenção:</strong> Apenas importe avaliações reais de hóspedes que efetivamente ficaram no seu alojamento. Avaliações falsas violam os nossos termos de utilização.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-900 flex items-center gap-1">
                Propriedade <span className="text-red-500">*</span>
              </label>
              <select 
                required
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white outline-none transition-all"
              >
                <option value="">Selecionar propriedade...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-900 flex items-center gap-1">
                Fonte <span className="text-red-500">*</span>
              </label>
              <select 
                required
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white outline-none transition-all"
              >
                {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {/* Guest Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-900 flex items-center gap-1">
                Nome do hóspede <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: João Silva"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-900 flex items-center gap-1">
                Classificação <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-1 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star 
                      size={28} 
                      className={star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-navy-900 flex items-center gap-1">
              Comentário <span className="text-red-500">*</span>
            </label>
            <textarea 
              required
              rows={4}
              placeholder="Cole aqui o conteúdo do comentário..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stay Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-900">Data da estadia (opcional)</label>
              <input 
                type="date"
                value={formData.stayDate}
                onChange={(e) => setFormData({ ...formData, stayDate: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Original Link */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-900">Link original (opcional)</label>
              <input 
                type="url"
                placeholder="https://airbnb.com/rooms/..."
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1 pl-1">Link para a avaliação original (para referência interna)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-navy-900 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-navy-900 text-white text-sm font-bold rounded-xl hover:bg-navy-800 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isSubmitting ? 'A importar...' : 'Importar avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}
