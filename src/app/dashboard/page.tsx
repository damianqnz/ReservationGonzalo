import StatCard from '@/components/stitch/StatCard'

const recentReservations = [
  { id: '#RES-9021', guest: 'Alejandro Alba', initials: 'AA', checkIn: '24 Out, 2023', status: 'Confirmado', amount: '$1.450,00', statusColor: 'emerald' },
  { id: '#RES-8842', guest: 'Maria Cardona', initials: 'MC', checkIn: '25 Out, 2023', status: 'Pendente', amount: '$890,00', statusColor: 'amber' },
  { id: '#RES-7651', guest: 'Julian Beltran', initials: 'JB', checkIn: '28 Out, 2023', status: 'Cancelado', amount: '$2.100,00', statusColor: 'red' },
  { id: '#RES-6549', guest: 'Elena Ponds', initials: 'EP', checkIn: '01 Nov, 2023', status: 'Confirmado', amount: '$3.420,00', statusColor: 'emerald' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Visão Geral do Painel</h2>
          <p className="text-slate-500 mt-1">Bem-vindo de volta, Gonzalo. Aqui está o que está a acontecer hoje.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            <span>Últimos 30 Dias</span>
          </button>
          <button className="px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-lg">file_download</span>
            <span>Exportar Dados</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Visitantes" value="24.508" change="+12.5%" isPositive={true} icon="visibility" color="primary" />
        <StatCard title="Reservas" value="1.284" change="+8.2%" isPositive={true} icon="event_available" color="accent" />
        <StatCard title="Receita" value="$142.600" change="-2.4%" isPositive={false} icon="payments" color="primary" />
        <StatCard title="Quartos Ativos" value="452" change="+4.1%" isPositive={true} icon="bed" color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#1a1a2e]">Tendências de Receita</h3>
              <p className="text-sm text-slate-500">Divisão mensal dos ganhos brutos</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#8b1a1a]"></span>
                <span className="text-xs font-medium text-slate-500">Ano Passado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1a1a2e]"></span>
                <span className="text-xs font-medium text-slate-500">Este Ano</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
              <defs>
                <linearGradient id="grad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8b1a1a', stopOpacity: 0.2 }}></stop>
                  <stop offset="100%" style={{ stopColor: '#8b1a1a', stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
              <path d="M0,80 Q50,70 100,50 T200,60 T300,30 T400,10 L400,100 L0,100 Z" fill="url(#grad)"></path>
              <path d="M0,80 Q50,70 100,50 T200,60 T300,30 T400,10" fill="none" stroke="#8b1a1a" strokeWidth="2"></path>
              <circle cx="100" cy="50" fill="#8b1a1a" r="4"></circle>
              <circle cx="300" cy="30" fill="#8b1a1a" r="4"></circle>
            </svg>
            <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter pt-4">
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-[#1a1a2e] mb-1">País Principal</h3>
          <p className="text-sm text-slate-500 mb-6">Distribuição regional de reservas</p>
          <div className="aspect-square w-full rounded-lg overflow-hidden relative border border-slate-200 bg-slate-50/50">
             <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-[#1a1a2e]/90 text-white p-4 rounded-xl shadow-xl flex flex-col items-center gap-1 backdrop-blur-sm z-10">
                <span className="text-xs uppercase font-bold opacity-70">Portugal</span>
                <span className="text-2xl font-black">34.2%</span>
                <span className="text-[10px] bg-[#8b1a1a] px-2 py-0.5 rounded">Top Região</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Lisboa</span>
              <span className="text-sm font-bold">12.402</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#8b1a1a] h-full w-[70%]"></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Porto</span>
              <span className="text-sm font-bold">8.190</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1a1a2e] h-full w-[45%]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#1a1a2e]">Reservas Recentes</h3>
            <p className="text-sm text-slate-500">Últimas 10 transações de reserva</p>
          </div>
          <button className="text-[#8b1a1a] text-sm font-bold hover:underline">Ver Todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID da Reserva</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Nome do Cliente</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Check-in</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentReservations.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 font-bold text-[#1a1a2e] text-sm">{res.id}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#1a1a2e] text-xs">
                        {res.initials}
                      </div>
                      <span className="text-sm font-medium">{res.guest}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-500">{res.checkIn}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 bg-${res.statusColor}-50 text-${res.statusColor}-700 text-xs font-bold rounded-full`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-bold">{res.amount}</td>
                  <td className="px-8 py-4">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                      <span className="material-symbols-outlined text-slate-400">more_horiz</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
