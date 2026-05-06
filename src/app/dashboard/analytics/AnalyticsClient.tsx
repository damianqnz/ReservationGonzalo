'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { AnalyticsData } from '@/domains/analytics/services/analyticsService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData: AnalyticsData
  properties:  { id: string; title: string }[]
  initialYear: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY   = '#8b1a1a'
const NAVY      = '#1a1a2e'
const PREV_LINE = '#94a3b8'

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#22c55e',
  COMPLETED: '#3b82f6',
  CANCELLED: '#ef4444',
  PENDING:   '#f59e0b',
  NO_SHOW:   '#94a3b8',
}
const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  PENDING:   'Pendente',
  NO_SHOW:   'Não compareceu',
}

const SOURCE_COLORS: Record<string, string> = {
  DIRECT:  PRIMARY,
  AIRBNB:  '#ff5a5f',
  BOOKING: '#003580',
  MANUAL:  '#94a3b8',
}
const SOURCE_LABELS: Record<string, string> = {
  DIRECT:  'Direto',
  AIRBNB:  'Airbnb',
  BOOKING: 'Booking.com',
  MANUAL:  'Manual',
}

const NAT_PALETTE = [
  '#8b1a1a', '#1a1a2e', '#3b82f6', '#22c55e',
  '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#64748b',
]

const ROOM_TYPE_LABELS: Record<string, string> = {
  ENTIRE_PLACE: 'Aloj. inteiro',
  PRIVATE_ROOM: 'Quarto privado',
  SHARED_ROOM:  'Quarto partilhado',
  SINGLE:       'Individual',
  DOUBLE:       'Duplo',
  TWIN:         'Twin',
  SUITE:        'Suite',
  JUNIOR_SUITE: 'Junior Suite',
  FAMILY:       'Familiar',
  STUDIO:       'Studio',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEUR(n: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtEURCompact(n: number): string {
  if (n >= 1000) return `€${(n / 1000).toFixed(0)}k`
  return `€${n}`
}

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🌍'
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

function pctChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0 && current === 0) return { text: '—', positive: true }
  if (previous === 0) return { text: '+novo', positive: true }
  const pct = ((current - previous) / previous) * 100
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  title, value, subtitle, change,
}: { title: string; value: string; subtitle?: string; change?: { text: string; positive: boolean } }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-extrabold text-[#1a1a2e] leading-none">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      {change && (
        <p className={`text-xs font-semibold mt-2 ${change.positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {change.text} vs ano anterior
        </p>
      )}
    </div>
  )
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-[#1a1a2e] text-base">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function SkeletonRow() {
  return <div className="h-[300px] bg-slate-100 animate-pulse rounded-lg" />
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm min-w-[140px]">
      {label && <p className="font-semibold text-[#1a1a2e] mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="text-xs py-0.5" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('receita') ? fmtEUR(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ initialData, properties, initialYear }: Props) {
  const [data, setData]           = useState<AnalyticsData>(initialData)
  const [year, setYear]           = useState(initialYear)
  const [propertyId, setPropertyId] = useState('')
  const [loading, setLoading]     = useState(false)
  const isFirst = useRef(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year: year.toString() })
      if (propertyId) params.set('propertyId', propertyId)
      const res  = await fetch(`/api/dashboard/analytics?${params}`)
      const json = await res.json()
      if (json.data) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [year, propertyId])

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    fetchData()
  }, [fetchData])

  const yearOptions = [initialYear - 2, initialYear - 1, initialYear]
  const totalBookings = data.yearTotals.bookings
  const totalRevenue  = data.yearTotals.revenue
  const bkChange      = pctChange(data.yearTotals.bookings, data.yearTotals.prevBookings)
  const revChange     = pctChange(data.yearTotals.revenue,  data.yearTotals.prevRevenue)
  const hasBookings   = data.byStatus.reduce((s, x) => s + x.count, 0) > 0

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!hasBookings) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Análises</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">bar_chart</span>
          <p className="text-slate-500 mt-4 font-medium">Ainda não há dados suficientes para análise.</p>
          <p className="text-sm text-slate-400 mt-1">
            As análises aparecerão assim que tiver reservas confirmadas.
          </p>
          <Link href="/dashboard/reservations" className="inline-block mt-4 text-[#8b1a1a] text-sm font-semibold hover:underline">
            Ver reservas →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Análises</h2>
          <p className="text-slate-500 mt-1 text-sm">Visão detalhada do desempenho das suas propriedades.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-[#1a1a2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Property filter */}
          {properties.length > 1 && (
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-[#1a1a2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30"
            >
              <option value="">Todas as propriedades</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          {/* Export button — future feature */}
          <button
            disabled
            title="Em breve"
            className="px-4 py-2 text-sm font-semibold text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Exportar relatório
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="animate-spin material-symbols-outlined text-base">refresh</span>
          A atualizar dados...
        </div>
      )}

      {/* ── ROW 1 — KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total reservas"
          value={totalBookings.toLocaleString('pt-PT')}
          subtitle={`Ano ${year}`}
          change={bkChange}
        />
        <KPICard
          title="Receita total"
          value={fmtEUR(totalRevenue)}
          subtitle={`Ano ${year}`}
          change={revChange}
        />
        <KPICard
          title="Média por reserva"
          value={fmtEUR(data.avgBookingValue)}
          subtitle={`${data.avgNights} noite${data.avgNights !== 1 ? 's' : ''} em média`}
        />
        <KPICard
          title="Taxa de cancelamento"
          value={`${data.cancellationRate}%`}
          subtitle="De todas as reservas"
          change={data.cancellationRate > 0 ? { text: `${data.cancellationRate}% canceladas`, positive: data.cancellationRate < 15 } : undefined}
        />
      </div>

      {/* ── ROW 2 — Main chart: Bookings + Revenue by Month ──────────────────── */}
      <SectionCard title={`Reservas e Receita por Mês — ${year}`}>
        {loading ? <SkeletonRow /> : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data.bookingsByMonth} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={fmtEURCompact} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => v === 'bookings' ? 'Reservas' : 'Receita'} />
              <Bar yAxisId="left" dataKey="bookings" name="Reservas" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Receita" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* ── ROW 3 — Revenue comparison + Status pie ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={`Comparação de Receita: ${year} vs ${year - 1}`}>
          {loading ? <SkeletonRow /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.revenueComparison} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={fmtEURCompact} />
                <Tooltip
                  formatter={(value, name) => [
                    fmtEUR(typeof value === 'number' ? value : 0),
                    name === 'currentYear' ? `${year}` : `${year - 1}`,
                  ]}
                  labelFormatter={(l) => `Mês: ${l}`}
                />
                <Legend formatter={(v) => v === 'currentYear' ? `${year}` : `${year - 1}`} />
                <Line type="monotone" dataKey="currentYear"  stroke={PRIMARY}   strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="previousYear" stroke={PREV_LINE} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Estado das Reservas">
          {loading ? <SkeletonRow /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  label={({ percent }) =>
                    (percent ?? 0) > 0.04 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {data.byStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, STATUS_LABELS[name as string] ?? name]} />
                <Legend
                  formatter={(v) => STATUS_LABELS[v] ?? v}
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 4 — Nationality + Source ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Reservas por Nacionalidade">
          {loading ? <SkeletonRow /> : data.byNationality.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Sem dados de nacionalidade.</p>
          ) : (() => {
            const natTotal = data.byNationality.reduce((s, n) => s + n.bookings, 0)
            return (
              <div className="flex flex-col gap-4">
                {/* PieChart */}
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.byNationality}
                      dataKey="bookings"
                      nameKey="countryName"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      label={({ percent }) =>
                        (percent ?? 0) > 0.04 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {data.byNationality.map((_, idx) => (
                        <Cell key={idx} fill={NAT_PALETTE[idx % NAT_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        const entry = data.byNationality.find((n) => n.countryName === name)
                        const flag = entry && entry.country !== 'XX' ? flagEmoji(entry.country) : '🌍'
                        return [value, `${flag} ${name}`]
                      }}
                    />
                    <Legend
                      formatter={(v) => {
                        const entry = data.byNationality.find((n) => n.countryName === v)
                        const flag = entry && entry.country !== 'XX' ? flagEmoji(entry.country) : '🌍'
                        return `${flag} ${v}`
                      }}
                      iconType="circle"
                      iconSize={10}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Summary table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Posição</th>
                        <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">País</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reservas</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byNationality.map((row, idx) => {
                        const isUnknown = row.country === 'XX'
                        const displayFlag = isUnknown ? '🌍' : flagEmoji(row.country)
                        const displayName = isUnknown ? 'Não especificado' : row.countryName
                        const pct = natTotal > 0 ? ((row.bookings / natTotal) * 100).toFixed(1) : '0.0'
                        return (
                          <tr key={row.country} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-[#1a1a2e]">
                              <span className="mr-1">{displayFlag}</span>{displayName}
                            </td>
                            <td className="py-2 px-3 text-right">{row.bookings}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{pct}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}
        </SectionCard>

        <SectionCard title="Canal de Reserva">
          {loading ? <SkeletonRow /> : data.bySource.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Sem dados de canal.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.bySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    (percent ?? 0) > 0.04 ? `${SOURCE_LABELS[name as string] ?? name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {data.bySource.map((entry) => (
                    <Cell key={entry.source} fill={SOURCE_COLORS[entry.source] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, SOURCE_LABELS[name as string] ?? name]} />
                <Legend formatter={(v) => SOURCE_LABELS[v] ?? v} iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── ROW 5 — Top months table ──────────────────────────────────────────── */}
      <SectionCard title="Meses Mais Reservados (histórico)">
        {data.topMonths.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sem dados suficientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Posição</th>
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Mês</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total reservas</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Receita média</th>
                </tr>
              </thead>
              <tbody>
                {data.topMonths.map((row, idx) => (
                  <tr key={row.month} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-400">
                      {idx === 0 ? '🏆' : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#1a1a2e]">
                      {row.month}
                      {idx === 0 && (
                        <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          Melhor mês
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">{row.bookings}</td>
                    <td className="py-3 px-3 text-right text-[#8b1a1a] font-bold">{fmtEUR(row.avgRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── ROW 6 — Property performance (only if multiple) ──────────────────── */}
      {data.byProperty.length > 1 && (
        <SectionCard title="Desempenho por Propriedade">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Propriedade</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reservas</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Receita total</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxa ocupação</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Média/reserva</th>
                </tr>
              </thead>
              <tbody>
                {data.byProperty.map((row) => (
                  <tr key={row.propertyId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#1a1a2e]">{row.propertyTitle}</td>
                    <td className="py-3 px-3 text-right">{row.bookings}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#8b1a1a]">{fmtEUR(row.revenue)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${row.occupancyRate >= 70 ? 'text-emerald-600' : row.occupancyRate >= 40 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {row.occupancyRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {row.bookings > 0 ? fmtEUR(Math.round(row.revenue / row.bookings)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Room type breakdown ───────────────────────────────────────────────── */}
      {data.byRoomType.length > 0 && (
        <SectionCard title="Reservas por Tipo de Quarto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reservas</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Receita total</th>
                </tr>
              </thead>
              <tbody>
                {data.byRoomType.map((row) => (
                  <tr key={row.type} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#1a1a2e]">
                      {ROOM_TYPE_LABELS[row.type] ?? row.type}
                    </td>
                    <td className="py-3 px-3 text-right">{row.bookings}</td>
                    <td className="py-3 px-3 text-right font-bold text-[#8b1a1a]">{fmtEUR(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MÉTRICAS AVANÇADAS
          ════════════════════════════════════════════════════════════════════ */}
      <div className="pt-4">
        <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-1">Métricas Avançadas</h3>
        <p className="text-sm text-slate-400 mb-6">Análise detalhada de inventário, tempo e saúde financeira.</p>

        {/* ── A: Eficiência do Inventário ─────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-[#8b1a1a] rounded-full" />
            <h4 className="text-base font-bold text-slate-700">A — Eficiência do Inventário</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card A1: Casa Completa vs Quartos */}
            <SectionCard title="Casa Completa vs Quartos Individuais">
              {loading ? <SkeletonRow /> : (() => {
                const inv = data.inventoryComparison
                const chartData = [
                  { label: 'Casa Completa',       revenue: inv.entirePlace.revenue,     bookings: inv.entirePlace.bookings,     avgValue: inv.entirePlace.avgValue     },
                  { label: 'Quartos Individuais', revenue: inv.individualRooms.revenue,  bookings: inv.individualRooms.bookings, avgValue: inv.individualRooms.avgValue },
                  { label: 'Propriedade Direta',  revenue: inv.directProperty.revenue,  bookings: inv.directProperty.bookings,  avgValue: inv.directProperty.avgValue  },
                ]
                const hasData = chartData.some((d) => d.bookings > 0)
                return hasData ? (
                  <div className="flex flex-col gap-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <ComposedChart data={chartData} margin={{ top: 12, right: 24, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis yAxisId="left"  tickFormatter={fmtEURCompact} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          formatter={(value, name) =>
                            name === 'revenue'
                              ? [fmtEUR(typeof value === 'number' ? value : 0), 'Receita']
                              : [value, 'Reservas']
                          }
                        />
                        <Legend formatter={(v) => v === 'revenue' ? 'Receita' : 'Reservas'} />
                        <Bar yAxisId="left"  dataKey="revenue"  name="revenue"  fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar yAxisId="right" dataKey="bookings" name="bookings" fill={NAVY}    radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.75} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    {/* avgValue row */}
                    <div className="grid grid-cols-3 gap-2">
                      {chartData.map((d) => (
                        <div key={d.label} className="text-center bg-slate-50 rounded-lg p-2">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{d.label.split(' ')[0]}</p>
                          <p className="text-sm font-bold text-[#8b1a1a]">{d.avgValue > 0 ? fmtEUR(d.avgValue) : '—'}</p>
                          <p className="text-[10px] text-slate-400">valor médio</p>
                        </div>
                      ))}
                    </div>
                    <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${inv.entirePlace.avgValue >= inv.individualRooms.avgValue * 0.8 ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      💡 {inv.recommendation}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Sem dados de inventário.</p>
                )
              })()}
            </SectionCard>

            {/* Card A2: Dias Bloqueados por Casa Completa */}
            <SectionCard title="Dias Bloqueados por Casa Completa">
              {loading ? <SkeletonRow /> : data.blockedOpportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">check_circle</span>
                  <p className="text-sm text-slate-400">Nenhum dia bloqueado por reserva de casa completa.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 italic">
                    Dias em que quartos ficaram indisponíveis por reserva de alojamento completo.
                  </p>
                  {data.blockedOpportunities.map((opp) => (
                    <div key={opp.propertyId} className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{opp.propertyTitle}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-extrabold text-[#1a1a2e]">{opp.blockedDays}</p>
                          <p className="text-xs text-slate-400">dias bloqueados</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#8b1a1a]">{fmtEUR(opp.estimatedLostRevenue)}</p>
                          <p className="text-xs text-slate-400">receita estimada perdida</p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#8b1a1a] rounded-full"
                          style={{ width: `${Math.min(100, (opp.blockedDays / 365) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{((opp.blockedDays / 365) * 100).toFixed(1)}% do ano</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ── B: Tempo e Antecipação ──────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-[#1a1a2e] rounded-full" />
            <h4 className="text-base font-bold text-slate-700">B — Tempo e Antecipação</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card B1: Lead Time */}
            <SectionCard title="Lead Time (Antecedência de Reserva)">
              {loading ? <SkeletonRow /> : (() => {
                const lt = data.leadTimeAnalysis
                const rows = [
                  { label: 'Geral',              avg: lt.overall.avg,         median: lt.overall.median,         color: '#64748b' },
                  { label: 'Casa Completa',       avg: lt.entirePlace.avg,     median: lt.entirePlace.median,     color: PRIMARY   },
                  { label: 'Quartos Individuais', avg: lt.individualRooms.avg, median: lt.individualRooms.median, color: NAVY      },
                ]
                return (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3">
                      {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                            <span className="text-sm font-semibold text-[#1a1a2e]">{row.label}</span>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <p className="text-lg font-extrabold text-[#1a1a2e]">{row.avg}</p>
                              <p className="text-[10px] text-slate-400">dias (média)</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-slate-500">{row.median}</p>
                              <p className="text-[10px] text-slate-400">dias (mediana)</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-semibold bg-slate-50 text-slate-600 px-3 py-2 rounded-lg">
                      📅 {lt.insight}
                    </p>
                  </div>
                )
              })()}
            </SectionCard>

            {/* Card B2: ALOS */}
            <SectionCard title="Duração Média de Estadia (ALOS)">
              {loading ? <SkeletonRow /> : (() => {
                const al = data.alosAnalysis
                const isWarning = al.insight.startsWith('⚠️')
                const rows = [
                  { label: 'Geral',              value: al.overall,         color: '#64748b' },
                  { label: 'Casa Completa',       value: al.entirePlace,     color: PRIMARY   },
                  { label: 'Quartos Individuais', value: al.individualRooms, color: NAVY      },
                ]
                return (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      {rows.map((row) => (
                        <div key={row.label} className="text-center bg-slate-50 rounded-xl p-4">
                          <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: row.color }} />
                          <p className="text-2xl font-extrabold" style={{ color: row.color }}>
                            {row.value > 0 ? row.value : '—'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{row.value > 0 ? 'noites' : 'sem dados'}</p>
                          <p className="text-[10px] font-semibold text-slate-500 mt-1">{row.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${isWarning ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {al.insight}
                    </p>
                  </div>
                )
              })()}
            </SectionCard>
          </div>
        </div>

        {/* ── C: Saúde Financeira ─────────────────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-emerald-600 rounded-full" />
            <h4 className="text-base font-bold text-slate-700">C — Saúde Financeira</h4>
          </div>

          <div className="space-y-6">
            {/* RevPAR */}
            <SectionCard title="RevPAR por Propriedade">
              {loading ? <SkeletonRow /> : data.revparByProperty.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sem propriedades com quartos configurados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left  py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Propriedade</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">RevPAR</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxa Ocupação</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">ADR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revparByProperty.map((row) => {
                        const revparColor = row.revpar >= 50 ? 'text-emerald-600' : row.revpar >= 20 ? 'text-amber-600' : 'text-red-500'
                        return (
                          <tr key={row.propertyId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-[#1a1a2e]">{row.propertyTitle}</td>
                            <td className={`py-3 px-3 text-right font-extrabold text-base ${revparColor}`}>
                              {fmtEUR(row.revpar)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`font-semibold ${row.occupancyRate >= 70 ? 'text-emerald-600' : row.occupancyRate >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {row.occupancyRate}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600 font-medium">
                              {row.adr > 0 ? fmtEUR(row.adr) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Net ADR by channel */}
            <SectionCard title="Receita Líquida por Canal">
              {loading ? <SkeletonRow /> : data.netAdrByChannel.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sem dados de canal.</p>
              ) : (() => {
                const totGross = data.netAdrByChannel.reduce((s, r) => s + r.grossRevenue,  0)
                const totFees  = data.netAdrByChannel.reduce((s, r) => s + r.estimatedFees, 0)
                const totNet   = data.netAdrByChannel.reduce((s, r) => s + r.netRevenue,    0)
                const totBk    = data.netAdrByChannel.reduce((s, r) => s + r.bookings,      0)
                const CHANNEL_COLORS: Record<string, string> = {
                  DIRECT: 'bg-emerald-50 text-emerald-700', AIRBNB: 'bg-orange-50 text-orange-700',
                  BOOKING: 'bg-blue-50 text-blue-700',      MANUAL: 'bg-slate-100 text-slate-600',
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left  py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Canal</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reservas</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Receita Bruta</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Comissões Est.</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Receita Líquida</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">ADR Líquido</th>
                          <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.netAdrByChannel.map((row) => (
                          <tr key={row.source} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${CHANNEL_COLORS[row.source] ?? 'bg-slate-100 text-slate-600'}`}>
                                {SOURCE_LABELS[row.source] ?? row.source}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">{row.bookings}</td>
                            <td className="py-3 px-3 text-right text-slate-500">{fmtEUR(row.grossRevenue)}</td>
                            <td className="py-3 px-3 text-right text-red-400 font-medium">
                              {row.estimatedFees > 0 ? `−${fmtEUR(row.estimatedFees)}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-[#8b1a1a]">{fmtEUR(row.netRevenue)}</td>
                            <td className="py-3 px-3 text-right text-slate-600">{row.netAdr > 0 ? fmtEUR(row.netAdr) : '—'}</td>
                            <td className="py-3 px-3 text-right text-slate-400 text-xs">{row.feeRate}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                          <td className="py-3 px-3 text-xs font-bold text-slate-500 uppercase">Total</td>
                          <td className="py-3 px-3 text-right">{totBk}</td>
                          <td className="py-3 px-3 text-right text-slate-500">{fmtEUR(totGross)}</td>
                          <td className="py-3 px-3 text-right text-red-400">{totFees > 0 ? `−${fmtEUR(totFees)}` : '—'}</td>
                          <td className="py-3 px-3 text-right text-[#8b1a1a]">{fmtEUR(totNet)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                    <p className="text-[11px] text-slate-400 mt-3 px-1">* Comissões estimadas. Valores reais podem variar.</p>
                  </div>
                )
              })()}
            </SectionCard>

            {/* Cancellation by channel */}
            <SectionCard title="Taxa de Cancelamento por Canal">
              {loading ? <SkeletonRow /> : data.cancellationByChannel.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Sem dados de canal.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left  py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Canal</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Reservas</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Canceladas</th>
                        <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxa</th>
                        <th className="text-left  py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Avaliação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cancellationByChannel.map((row) => {
                        const rate = row.cancellationRate
                        const rateCls = rate < 5 ? 'bg-emerald-50 text-emerald-700' : rate <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        return (
                          <tr key={row.source} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-[#1a1a2e]">
                              {SOURCE_LABELS[row.source] ?? row.source}
                            </td>
                            <td className="py-3 px-3 text-right">{row.totalBookings}</td>
                            <td className="py-3 px-3 text-right text-red-500">{row.cancelled}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${rateCls}`}>
                                {rate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-xs text-slate-500">{row.recommendation}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ── D — LOOK-TO-BOOK ──────────────────────────────────────────────── */}
        <div>
          <h3 className="text-lg font-bold text-[#1a1a2e] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8b1a1a]">manage_search</span>
            D — Conversão: Buscas vs Reservas (Look-to-Book)
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <SectionCard title="Taxa de Conversão Look-to-Book">
              {data.lookToBook.totalSearches === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-slate-300">manage_search</span>
                  <p className="text-sm text-slate-400 italic">Sem dados de pesquisa ainda. Os dados aparecem automaticamente quando hóspedes verificam disponibilidade.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-extrabold text-[#1a1a2e]">{data.lookToBook.totalSearches}</p>
                      <p className="text-xs text-slate-500 mt-1">Total de Pesquisas</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-extrabold text-emerald-600">{data.lookToBook.totalConversions}</p>
                      <p className="text-xs text-slate-500 mt-1">Convertidas</p>
                    </div>
                    <div className={`rounded-lg p-4 text-center ${data.lookToBook.conversionRate >= 20 ? 'bg-emerald-50' : data.lookToBook.conversionRate >= 10 ? 'bg-amber-50' : 'bg-red-50'}`}>
                      <p className={`text-2xl font-extrabold ${data.lookToBook.conversionRate >= 20 ? 'text-emerald-700' : data.lookToBook.conversionRate >= 10 ? 'text-amber-700' : 'text-red-700'}`}>
                        {data.lookToBook.conversionRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Taxa de Conversão</p>
                    </div>
                  </div>
                  {/* Insight */}
                  <p className="text-sm text-slate-600 italic">{data.lookToBook.insight}</p>
                  {/* Monthly trend */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Tendência Mensal ({year})</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={data.lookToBook.byMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v, name) => [typeof v === 'number' ? (name === 'rate' ? `${v.toFixed(1)}%` : v) : v, name === 'searches' ? 'Pesquisas' : name === 'conversions' ? 'Conversões' : 'Taxa %']} />
                        <Legend formatter={(v) => v === 'searches' ? 'Pesquisas' : v === 'conversions' ? 'Conversões' : 'Taxa %'} />
                        <Line type="monotone" dataKey="searches" stroke="#e8c4c4" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="conversions" stroke="#8b1a1a" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* By property */}
                  {data.lookToBook.byProperty.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Por Propriedade</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Propriedade</th>
                              <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pesquisas</th>
                              <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Conversões</th>
                              <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Taxa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.lookToBook.byProperty.map((row) => {
                              const rateCls = row.rate >= 20 ? 'bg-emerald-50 text-emerald-700' : row.rate >= 10 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              return (
                                <tr key={row.propertyId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                  <td className="py-3 px-3 font-semibold text-[#1a1a2e]">{row.title}</td>
                                  <td className="py-3 px-3 text-right">{row.searches}</td>
                                  <td className="py-3 px-3 text-right text-emerald-600">{row.conversions}</td>
                                  <td className="py-3 px-3 text-right">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${rateCls}`}>
                                      {row.rate.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
