'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Undo2,
  Plus,
  Search,
  ExternalLink
} from 'lucide-react'
import type { ReviewWithDetails } from '@/domains/review/types'
import { Property } from '@prisma/client'
import { sileo } from 'sileo'
import ImportReviewModal from '@/components/dashboard/ImportReviewModal'
import { useRouter } from 'next/navigation'

interface ReviewsClientProps {
  initialReviews: ReviewWithDetails[]
  properties: Pick<Property, 'id' | 'title'>[]
}

const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: 'bg-slate-100 text-slate-700 border-slate-200',
  AIRBNB: 'bg-orange-50 text-orange-700 border-orange-200',
  BOOKING: 'bg-blue-50 text-blue-700 border-blue-200',
  MANUAL: 'bg-gray-100 text-gray-700 border-gray-200',
}

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Direta',
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking.com',
  MANUAL: 'Manual',
}

export default function ReviewsClient({ initialReviews, properties }: ReviewsClientProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState<ReviewWithDetails[]>(initialReviews)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('all')
  const [filterProperty, setFilterProperty] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [expandedProperties, setExpandedProperties] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update reviews list when initial (from server) changes
  useEffect(() => {
    setReviews(initialReviews)
  }, [initialReviews])

  // Stats calculation
  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter(r => !r.isPublished && !r.isRejected).length,
    approved: reviews.filter(r => r.isPublished).length,
    rejected: reviews.filter(r => r.isRejected).length,
  }), [reviews])

  // Filter logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'pending' && !r.isPublished && !r.isRejected) ||
        (filterStatus === 'approved' && r.isPublished) ||
        (filterStatus === 'rejected' && r.isRejected)
      const matchProperty = filterProperty === 'all' || r.propertyId === filterProperty
      const matchSource = filterSource === 'all' || r.source === filterSource
      return matchStatus && matchProperty && matchSource
    })
  }, [reviews, filterStatus, filterProperty, filterSource])

  // Group by property
  const groupedReviews = useMemo(() => {
    const groups: Record<string, { title: string, reviews: ReviewWithDetails[], id: string }> = {}
    
    // Ensure all properties are represented if needed or just properties with reviews
    filteredReviews.forEach(r => {
      if (!groups[r.propertyId]) {
        groups[r.propertyId] = { title: r.property.title, reviews: [], id: r.propertyId }
      }
      groups[r.propertyId].reviews.push(r)
    })
    
    return Object.values(groups).sort((a, b) => a.title.localeCompare(b.title))
  }, [filteredReviews])

  // Auto-expand properties with pending reviews
  useEffect(() => {
    const propertyIdsToExpand = groupedReviews
      .filter(g => g.reviews.some(r => !r.isPublished && !r.isRejected))
      .map(g => g.id)
    
    setExpandedProperties(prev => Array.from(new Set([...prev, ...propertyIdsToExpand])))
  }, [groupedReviews])

  const toggleProperty = (id: string) => {
    setExpandedProperties(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleAction = async (id: string, action: string, data?: any) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })

      const result = await res.json()
      if (result.error) throw new Error(result.error)

      // Update local state
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ...result.data } : r))
      
      if (action === 'reply') {
        setReplyingTo(null)
        setReplyText('')
      }

      sileo.success({ 
        title: action === 'approve' ? 'Avaliação aprovada' : 
               action === 'reject' ? 'Avaliação rejeitada' : 
               action === 'reply' ? 'Resposta publicada' : 'Estado atualizado',
        description: 'As alterações foram guardadas com sucesso.'
      })
    } catch (error: any) {
      sileo.error({ 
        title: 'Erro na operação',
        description: error.message 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAvatarColor = (name: string, index: number) => {
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700']
    return colors[index % colors.length]
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 tracking-tight">Avaliações</h1>
          <p className="text-slate-500 mt-1">Gerencie o feedback dos seus hóspedes e importe avaliações externas.</p>
        </div>
        <button 
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#8b1a1a] text-white rounded-lg hover:bg-[#a11e1e] transition-all font-semibold shadow-sm"
        >
          <Plus size={18} />
          Importar avaliação
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSimple title="Total" value={stats.total} icon={<Star size={20} />} color="blue" />
        <StatCardSimple title="Pendentes" value={stats.pending} icon={<Calendar size={20} />} color="orange" badge={stats.pending > 0} />
        <StatCardSimple title="Aprovadas" value={stats.approved} icon={<CheckCircle2 size={20} />} color="emerald" />
        <StatCardSimple title="Rejeitadas" value={stats.rejected} icon={<XCircle size={20} />} color="rose" />
      </div>

      {/* Actions Row (Filters) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === s 
                ? 'bg-navy-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-auto">
            <select 
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="all">Todas as propriedades</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="all">Todas as fontes</option>
              <option value="WEBSITE">Diretas</option>
              <option value="AIRBNB">Airbnb</option>
              <option value="BOOKING">Booking.com</option>
              <option value="MANUAL">Manuais</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {groupedReviews.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-navy-900">Ainda não tem avaliações</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              As avaliações aparecem automaticamente após o check-out dos hóspedes ou podem ser importadas manualmente.
            </p>
          </div>
        ) : (
          groupedReviews.map((group) => (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Property Header */}
              <button 
                onClick={() => toggleProperty(group.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-navy-50 text-navy-600 rounded-lg">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900">{group.title}</h3>
                    <p className="text-xs text-slate-500">
                      {group.reviews.length} avaliações · ⭐ {(group.reviews.reduce((acc, r) => acc + r.rating, 0) / group.reviews.length).toFixed(1)} média
                    </p>
                  </div>
                </div>
                {expandedProperties.includes(group.id) ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
              </button>

              {/* Property Reviews List */}
              {expandedProperties.includes(group.id) && (
                <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/30">
                  {group.reviews.map((review, idx) => (
                    <div key={review.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(review.guestName, idx)}`}>
                            {review.guestName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-navy-900">{review.guestName}</h4>
                              {review.source !== 'WEBSITE' && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SOURCE_COLORS[review.source]}`}>
                                  {SOURCE_LABELS[review.source]}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    size={12} 
                                    className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} 
                                  />
                                ))}
                              </div>
                              <span>{formatDate(review.stayDate || review.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Check for side badge */}
                        <div className="flex flex-col items-end gap-2">
                          {!review.isPublished && !review.isRejected ? (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">Pendente</span>
                          ) : review.isPublished ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Aprovada</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">Rejeitada</span>
                          )}
                          {review.sourceUrl && (
                            <a 
                              href={review.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-navy-600 hover:text-navy-900 flex items-center gap-1 text-[10px] font-medium"
                            >
                              Ver original <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 text-slate-700 text-sm italic leading-relaxed">
                        "{review.comment}"
                      </div>

                      {/* Owner Reply */}
                      {review.ownerReply && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border-l-4 border-navy-500">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare size={14} className="text-navy-600" />
                            <span className="text-xs font-bold text-navy-900">A sua resposta:</span>
                          </div>
                          <p className="text-sm text-slate-600 italic">"{review.ownerReply}"</p>
                        </div>
                      )}

                      {/* Reply Form */}
                      {replyingTo === review.id && (
                        <div className="mt-4 space-y-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escreva a sua resposta..."
                            className="w-full p-4 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:outline-none min-h-[100px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setReplyingTo(null)}
                              className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => handleAction(review.id, 'reply', { ownerReply: replyText })}
                              disabled={!replyText.trim() || isSubmitting}
                              className="px-4 py-1.5 bg-navy-900 text-white text-sm font-bold rounded-lg hover:bg-navy-800 disabled:opacity-50"
                            >
                              Publicar resposta
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                        {!review.isPublished && !review.isRejected ? (
                          <>
                            <button 
                              onClick={() => handleAction(review.id, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all text-xs font-bold"
                            >
                              <CheckCircle2 size={14} /> Aprovar
                            </button>
                            <button 
                              onClick={() => handleAction(review.id, 'reject')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-all text-xs font-bold"
                            >
                              <XCircle size={14} /> Rejeitar
                            </button>
                          </>
                        ) : review.isPublished ? (
                          <button 
                            onClick={() => handleAction(review.id, 'toggle')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-xs font-bold"
                          >
                            <Undo2 size={14} /> Cancelar aprovação
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleAction(review.id, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all text-xs font-bold"
                            >
                              <CheckCircle2 size={14} /> Reaprovar
                            </button>
                            {/* In theory we could add a DELETE here but the request says toggle/approve/reject/reply */}
                          </>
                        )}
                        
                        {!replyingTo && (
                          <button 
                            onClick={() => {
                              setReplyingTo(review.id)
                              setReplyText(review.ownerReply || '')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-navy-600 hover:bg-navy-50 rounded-lg transition-all text-xs font-bold ml-auto"
                          >
                            <MessageSquare size={14} /> {review.ownerReply ? 'Editar resposta' : 'Responder'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ImportReviewModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        properties={properties}
        onSuccess={() => {
          setIsImportModalOpen(false)
          router.refresh() // Refresh server data
        }}
      />
    </div>
  )
}

function StatCardSimple({ title, value, icon, color, badge }: { title: string, value: number | string, icon: React.ReactNode, color: string, badge?: boolean }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group">
      <div className={`p-3 rounded-xl ${colorMap[color]} shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-black text-navy-900">{value}</h3>
          {badge && <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>}
        </div>
      </div>
    </div>
  )
}
