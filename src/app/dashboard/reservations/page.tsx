const reservations = [
  { id: '#RES-9021', guest: 'Alejandro Alba', initials: 'AA', checkIn: '24 Out, 2023', checkOut: '28 Out, 2023', property: 'Villa Marisol', status: 'Confirmado', amount: '$1.450,00', statusColor: 'emerald' },
  { id: '#RES-8842', guest: 'Maria Cardona', initials: 'MC', checkIn: '25 Out, 2023', checkOut: '30 Out, 2023', property: 'Urban Loft', status: 'Pendente', amount: '$890,00', statusColor: 'amber' },
  { id: '#RES-7651', guest: 'Julian Beltran', initials: 'JB', checkIn: '28 Out, 2023', checkOut: '02 Nov, 2023', property: 'Cozy Cabin', status: 'Cancelado', amount: '$2.100,00', statusColor: 'red' },
  { id: '#RES-6549', guest: 'Elena Ponds', initials: 'EP', checkIn: '01 Nov, 2023', checkOut: '05 Nov, 2023', property: 'Beach House', status: 'Confirmado', amount: '$3.420,00', statusColor: 'emerald' },
  { id: '#RES-5531', guest: 'Ricardo Lima', initials: 'RL', checkIn: '05 Nov, 2023', checkOut: '10 Nov, 2023', property: 'Villa Marisol', status: 'Confirmado', amount: '$1.800,00', statusColor: 'emerald' },
]

export default function ReservationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Reservas</h2>
          <p className="text-slate-500 mt-1">Gerencie todas as suas transações e estadias de clientes.</p>
        </div>
        <button className="bg-[#8b1a1a] text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-sm hover:opacity-90 transition-all">
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Reserva
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                type="text" 
                placeholder="Pesquisar reservas..." 
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-[#8b1a1a] focus:border-[#8b1a1a] ring-0"
              />
            </div>
            <select className="text-sm border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-2 ring-0">
              <option>Status: Todos</option>
              <option>Confirmado</option>
              <option>Pendente</option>
              <option>Cancelado</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
               <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
               <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Check-in / Out</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Propriedade</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reservations.map((res) => (
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
                  <td className="px-8 py-4 text-sm text-slate-500">
                    <div>{res.checkIn}</div>
                    <div className="text-[10px]">{res.checkOut}</div>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-500">{res.property}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 bg-${res.statusColor}-50 text-${res.statusColor}-700 text-xs font-bold rounded-full`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-bold">{res.amount}</td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                       <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#1a1a2e]">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-[#8b1a1a]">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </div>
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
