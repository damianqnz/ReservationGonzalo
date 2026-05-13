interface StatCardProps {
  title: string
  value: string | number
  change: string
  isPositive: boolean
  icon: string
  color: 'primary' | 'accent' | 'emerald'
}

export default function StatCard({ title, value, change, isPositive, icon, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-slate-100 text-[#1a1a2e]',
    accent: 'bg-red-50 text-[#8b1a1a]',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  const barColor = color === 'accent' ? 'bg-[#8b1a1a]/10' : 'bg-[#1a1a2e]/10'

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span
          className={`text-xs font-bold flex items-center px-2 py-1 rounded-full ${
            isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-[#8b1a1a] bg-red-50'
          }`}
        >
          {change}
        </span>
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[#1a1a2e] mt-1">{value}</h3>
      <div className="mt-4 h-12 w-full flex items-end gap-1">
        {[40, 60, 50, 80, 70, 90].map((h, i) => (
          <div
            key={i}
            className={`flex-1 ${barColor} rounded-t-sm transition-all duration-300`}
            style={{ height: `${h}%` }}
          ></div>
        ))}
      </div>
    </div>
  )
}
