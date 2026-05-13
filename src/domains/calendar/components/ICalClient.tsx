'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ICalSyncRow } from '@/app/dashboard/properties/[id]/ical/page'

interface Room {
  id: string
  name: string
}

interface ExportUrlRoom {
  roomId: string
  roomName: string
  url: string
}

interface Props {
  propertyId: string
  propertyTitle: string
  hasRooms: boolean
  rooms: Room[]
  syncs: ICalSyncRow[]
  exportUrlProperty: string
  exportUrlsRooms: ExportUrlRoom[]
}

export default function ICalClient({
  propertyId,
  propertyTitle,
  hasRooms,
  rooms,
  syncs: initialSyncs,
  exportUrlProperty,
  exportUrlsRooms,
}: Props) {
  const router = useRouter()
  const [syncs, setSyncs] = useState<ICalSyncRow[]>(initialSyncs)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Import form state
  const [importSource, setImportSource] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importRoomId, setImportRoomId] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Sync state per row
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function copyToClipboard(url: string) {
    await navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setImportError(null)
    setImporting(true)

    try {
      const res = await fetch('/api/ical/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          roomId: importRoomId || null,
          source: importSource,
          icalUrl: importUrl,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setImportError(typeof json.error === 'string' ? json.error : 'Erro ao importar calendário.')
        return
      }
      setImportSource('')
      setImportUrl('')
      setImportRoomId('')
      router.refresh()
    } catch {
      setImportError('Erro de rede.')
    } finally {
      setImporting(false)
    }
  }

  async function handleSync(syncId: string) {
    setSyncingId(syncId)
    try {
      // Re-trigger import for existing sync — use the existing sync's url/source
      const sync = syncs.find((s) => s.id === syncId)
      if (!sync) return

      const res = await fetch('/api/ical/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          roomId: sync.roomId,
          source: sync.source,
          icalUrl: sync.icalUrl,
        }),
      })
      const json = await res.json()
      if (res.ok && !json.error) {
        router.refresh()
      }
    } finally {
      setSyncingId(null)
    }
  }

  async function handleDelete(syncId: string) {
    if (!confirm('Remover esta sincronização iCal?')) return
    setDeletingId(syncId)
    try {
      const res = await fetch(`/api/ical/import?syncId=${syncId}`, { method: 'DELETE' })
      if (res.ok) {
        setSyncs((prev) => prev.filter((s) => s.id !== syncId))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sincronização iCal</h1>
        <p className="text-sm text-gray-500 mt-1">{propertyTitle}</p>
      </div>

      {/* ── Export URLs ──────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Exportar Calendário</h2>
        <p className="text-sm text-gray-500">
          Copie estes links e cole no Airbnb, Booking.com ou Google Calendar para exportar reservas e
          datas bloqueadas.
        </p>

        <div className="space-y-3">
          {/* Property-level export */}
          <ExportRow
            label="Propriedade completa"
            url={exportUrlProperty}
            copied={copiedUrl === exportUrlProperty}
            onCopy={() => copyToClipboard(exportUrlProperty)}
          />

          {/* Room-level exports */}
          {exportUrlsRooms.map((r) => (
            <ExportRow
              key={r.roomId}
              label={r.roomName}
              url={r.url}
              copied={copiedUrl === r.url}
              onCopy={() => copyToClipboard(r.url)}
            />
          ))}
        </div>
      </section>

      {/* ── Import / Sync ────────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Importar Calendário Externo</h2>
        <p className="text-sm text-gray-500">
          Adicione URLs iCal do Airbnb, Booking.com, etc. As datas bloqueadas serão sincronizadas
          automaticamente a cada 6 horas.
        </p>

        <form onSubmit={handleImport} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fonte <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Airbnb, Booking.com"
                value={importSource}
                onChange={(e) => setImportSource(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {hasRooms && rooms.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Quarto (opcional)
                </label>
                <select
                  value={importRoomId}
                  onChange={(e) => setImportRoomId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Propriedade inteira</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              URL iCal <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {importError && (
            <p className="text-sm text-red-600">{importError}</p>
          )}

          <button
            type="submit"
            disabled={importing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? 'A importar...' : 'Adicionar e Sincronizar'}
          </button>
        </form>
      </section>

      {/* ── Active syncs ─────────────────────────────────────────────────────── */}
      {syncs.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Calendários Activos</h2>

          <div className="space-y-3">
            {syncs.map((sync) => (
              <div
                key={sync.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{sync.source}</span>
                    {sync.roomName && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {sync.roomName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate max-w-xs sm:max-w-sm">{sync.icalUrl}</p>
                  <p className="text-xs text-gray-400">
                    {sync.lastSyncedAt
                      ? `Última sync: ${sync.lastSyncedAt} · ${sync.syncedDates} datas`
                      : 'Nunca sincronizado'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSync(sync.id)}
                    disabled={syncingId === sync.id}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    {syncingId === sync.id ? 'A sincronizar...' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => handleDelete(sync.id)}
                    disabled={deletingId === sync.id}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === sync.id ? 'A remover...' : 'Remover'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── ExportRow ────────────────────────────────────────────────────────────────

function ExportRow({
  label,
  url,
  copied,
  onCopy,
}: {
  label: string
  url: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-sm font-medium text-gray-700 w-40 shrink-0">{label}</span>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <input
          readOnly
          value={url}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-gray-50 truncate"
        />
        <button
          onClick={onCopy}
          className="shrink-0 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <a
          href={url}
          download
          className="shrink-0 text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          .ics
        </a>
      </div>
    </div>
  )
}
