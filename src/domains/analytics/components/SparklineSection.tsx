'use client'

import Link from 'next/link'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts'

interface SparkMonth {
  month: string
  bookings: number
}

interface Props {
  data: SparkMonth[]
}

export default function SparklineSection({ data }: Props) {
  const hasData = data.some((d) => d.bookings > 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#1a1a2e]">Análises rápidas</h3>
          <p className="text-xs text-slate-400">Reservas nos últimos 6 meses</p>
        </div>
        <Link
          href="/dashboard/analytics"
          className="text-[#8b1a1a] text-sm font-semibold hover:underline flex items-center gap-1"
        >
          Ver análise completa
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              formatter={(v) => [v, 'Reservas']}
              labelFormatter={(l) => `${l}`}
            />
            <Bar dataKey="bookings" radius={[3, 3, 0, 0]} maxBarSize={36}>
              {data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={idx === data.length - 1 ? '#8b1a1a' : '#e8c4c4'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[110px] flex items-center justify-center">
          <p className="text-sm text-slate-400 italic">Sem reservas confirmadas nos últimos 6 meses.</p>
        </div>
      )}
    </div>
  )
}
