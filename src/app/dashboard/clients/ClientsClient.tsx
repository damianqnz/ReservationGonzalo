'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { ClientRow } from '@/app/api/dashboard/clients/route'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal',       ES: 'Espanha',        FR: 'França',
  DE: 'Alemanha',       GB: 'Reino Unido',    IT: 'Itália',
  BR: 'Brasil',         NL: 'Países Baixos',  BE: 'Bélgica',
  US: 'Estados Unidos', CH: 'Suíça',          AT: 'Áustria',
  PL: 'Polónia',        SE: 'Suécia',         NO: 'Noruega',
  DK: 'Dinamarca',      FI: 'Finlândia',      IE: 'Irlanda',
  CA: 'Canadá',         AU: 'Austrália',
}

const COUNTRY_FLAGS: Record<string, string> = {
  PT: '🇵🇹', ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪', GB: '🇬🇧',
  IT: '🇮🇹', BR: '🇧🇷', NL: '🇳🇱', BE: '🇧🇪', US: '🇺🇸',
  CH: '🇨🇭', AT: '🇦🇹', PL: '🇵🇱', SE: '🇸🇪', NO: '🇳🇴',
  DK: '🇩🇰', FI: '🇫🇮', IE: '🇮🇪', CA: '🇨🇦', AU: '🇦🇺',
}

function countryDisplay(code: string | null): string {
  if (!code) return ''
  const flag = COUNTRY_FLAGS[code.toUpperCase()] ?? '🌍'
  const name = COUNTRY_NAMES[code.toUpperCase()] ?? code
  return `${flag} ${name}`
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount)
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Property {
  id: string
  title: string
}

interface Props {
  initialClients: ClientRow[]
  properties: Property[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientsClient({ initialClients, properties }: Props) {
  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [country,     setCountry]     = useState('')
  const [period,      setPeriod]      = useState<'30d' | '90d' | '1y' | 'all'>('all')
  const [marketingOn, setMarketingOn] = useState(false)
  const [propertyId,  setPropertyId]  = useState('')
  const [page,        setPage]        = useState(1)

  // ── Data (fetched from API when filters change) ───────────────────────────
  const [clients,  setClients]  = useState<ClientRow[]>(initialClients)
  const [total,    setTotal]    = useState(initialClients.length)
  const [loading,  setLoading]  = useState(false)

  const hasFilters = !!(search || country || period !== 'all' || marketingOn || propertyId)

  // Build all countries present in data for filter dropdown
  const allCountries = useMemo(() => {
    const codes = new Set(initialClients.map((c) => c.guestCountry).filter(Boolean) as string[])
    return Array.from(codes).sort()
  }, [initialClients])

  // ── Fetch from API when filters change ────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams()
    if (search)      params.set('search',     search)
    if (country)     params.set('country',    country)
    if (period !== 'all') params.set('period', period)
    if (marketingOn) params.set('marketing',  'true')
    if (propertyId)  params.set('propertyId', propertyId)

    setLoading(true)
    setPage(1)

    fetch(`/api/dashboard/clients?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setClients(json.data)
          setTotal(json.total ?? json.data.length)
        }
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [search, country, period, marketingOn, propertyId])

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageClients = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const fromIdx     = (page - 1) * PAGE_SIZE + 1
  const toIdx       = Math.min(page * PAGE_SIZE, total)

  function clearFilters() {
    setSearch('')
    setCountry('')
    setPeriod('all')
    setMarketingOn(false)
    setPropertyId('')
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const marketingCount = clients.filter((c) => c.acceptedMarketing).length
    const countryCounts  = new Map<string, number>()
    for (const c of clients) {
      if (c.guestCountry) {
        countryCounts.set(c.guestCountry, (countryCounts.get(c.guestCountry) ?? 0) + 1)
      }
    }
    let topCountry = ''
    let topCount   = 0
    for (const [code, count] of countryCounts) {
      if (count > topCount) { topCount = count; topCountry = code }
    }
    const avgSpent = clients.length > 0
      ? clients.reduce((s, c) => s + c.totalSpent, 0) / clients.length
      : 0

    return {
      total:    total,
      marketing: marketingCount,
      topCountry: topCountry ? countryDisplay(topCountry) : '—',
      avgSpent,
    }
  }, [clients, total])

  // ── Export URL (mirrors current filters) ─────────────────────────────────
  function exportUrl(): string {
    const params = new URLSearchParams()
    if (search)      params.set('search',     search)
    if (country)     params.set('country',    country)
    if (period !== 'all') params.set('period', period)
    if (marketingOn) params.set('marketing',  'true')
    if (propertyId)  params.set('propertyId', propertyId)
    const qs = params.toString()
    return `/api/dashboard/clients/export${qs ? `?${qs}` : ''}`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Clientes</h2>
          <p className="text-slate-500 mt-1">
            {total} cliente{total !== 1 ? 's' : ''} no total
          </p>
        </div>
        <a
          href={exportUrl()}
          download
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Exportar CSV
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clientes"         value={String(stats.total)} />
        <StatCard label="Aceitaram Marketing"    value={String(stats.marketing)} />
        <StatCard label="País mais frequente"    value={stats.topCountry} small />
        <StatCard label="Gasto médio / cliente"  value={fmtCurrency(stats.avgSpent)} />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Pesquisar por nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
            />
          </div>

          {/* Country */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
          >
            <option value="">Todos os países</option>
            {allCountries.map((c) => (
              <option key={c} value={c}>
                {COUNTRY_FLAGS[c] ?? '🌍'} {COUNTRY_NAMES[c] ?? c}
              </option>
            ))}
          </select>

          {/* Period */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
          >
            <option value="all">Todos os períodos</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>

          {/* Property (only if multiple) */}
          {properties.length > 1 ? (
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
            >
              <option value="">Todas as propriedades</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          ) : (
            <div /> /* placeholder cell */
          )}
        </div>

        {/* Bottom filter row */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setMarketingOn((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                marketingOn ? 'bg-[#1a1a2e]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  marketingOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-slate-600 font-medium">Só marketing</span>
          </label>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 hover:text-[#8b1a1a] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">close</span>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">A carregar...</div>
        ) : pageClients.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <Th>Cliente</Th>
                    <Th>País</Th>
                    <Th>Telefone</Th>
                    <Th>Reservas</Th>
                    <Th>Total Gasto</Th>
                    <Th>Última Reserva</Th>
                    <Th>Marketing</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageClients.map((c) => (
                    <ClientRow key={c.guestEmail} client={c} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Mostrando {fromIdx}–{toIdx} de {total} clientes
                </p>
                <div className="flex items-center gap-2">
                  <PaginationBtn
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    icon="chevron_left"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    {page} / {totalPages}
                  </span>
                  <PaginationBtn
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    icon="chevron_right"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-bold text-[#1a1a2e] ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  )
}

function ClientRow({ client: c }: { client: ClientRow }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Cliente */}
      <td className="px-6 py-4">
        <p className="font-semibold text-[#1a1a2e]">{c.guestName}</p>
        <p className="text-xs text-slate-400 mt-0.5">{c.guestEmail}</p>
      </td>

      {/* País */}
      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
        {c.guestCountry
          ? `${COUNTRY_FLAGS[c.guestCountry.toUpperCase()] ?? '🌍'} ${COUNTRY_NAMES[c.guestCountry.toUpperCase()] ?? c.guestCountry}`
          : <span className="text-slate-300">—</span>
        }
      </td>

      {/* Telefone */}
      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
        {c.guestPhone ?? <span className="text-slate-300">—</span>}
      </td>

      {/* Reservas */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 bg-slate-100 text-[#1a1a2e] text-xs font-bold rounded-full">
          {c.totalBookings}
        </span>
      </td>

      {/* Total Gasto */}
      <td className="px-6 py-4">
        <span className="font-bold text-[#1a1a2e]">{fmtCurrency(c.totalSpent)}</span>
      </td>

      {/* Última Reserva */}
      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
        {fmtDate(c.lastBooking)}
      </td>

      {/* Marketing */}
      <td className="px-6 py-4 text-center text-base">
        {c.acceptedMarketing ? '✅' : '❌'}
      </td>

      {/* Ações */}
      <td className="px-6 py-4">
        <Link
          href={`/dashboard/reservations?search=${encodeURIComponent(c.guestEmail)}`}
          className="text-xs font-semibold text-[#8b1a1a] border border-[#8b1a1a]/30 rounded-lg px-3 py-1.5 hover:bg-[#8b1a1a]/5 transition-colors whitespace-nowrap"
        >
          Ver reservas
        </Link>
      </td>
    </tr>
  )
}

function PaginationBtn({
  onClick, disabled, icon,
}: { onClick: () => void; disabled: boolean; icon: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  )
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="py-20 text-center">
      <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
      <p className="text-slate-400 mt-3 font-medium">
        {hasFilters ? 'Nenhum cliente corresponde aos filtros' : 'Nenhum cliente encontrado'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-3 text-sm text-[#8b1a1a] hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
