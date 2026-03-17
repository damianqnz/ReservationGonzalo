export default function CalendarPage() {
  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
  const dates = [23, 24, 25, 26, 27, 28, 29]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">Calendário de Reservas</h2>
          <p className="text-sm text-slate-500">Gerencie suas reservas e disponibilidade de propriedade.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-200/50 rounded-lg">
            <button className="px-4 py-1.5 text-xs font-bold rounded-md transition-all bg-white text-[#1a1a2e] shadow-sm">Mensal</button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-md transition-all text-slate-500 hover:text-[#1a1a2e]">Semanal</button>
          </div>
          <button className="flex items-center gap-2 bg-[#8b1a1a] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-900/10 hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Reserva
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-600">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-xs font-medium text-slate-600">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-xs font-medium text-slate-600">Check-in</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-xs font-medium border-slate-200 rounded-lg focus:ring-[#8b1a1a] focus:border-[#8b1a1a] py-1.5 ring-0">
            <option>Todas as Propriedades</option>
            <option>Complexo Inteiro</option>
            <option>Quarto 1</option>
            <option>Quarto 2</option>
          </select>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-[#1a1a2e] px-2">Outubro 2023</span>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200">
          <div className="p-4 border-r border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">Recurso</div>
          {days.map((day, i) => (
            <div key={i} className={`p-4 text-center border-r border-slate-200 ${day === 'QUA' ? 'bg-[#1a1a2e]/5' : ''}`}>
              <p className={`text-[10px] font-bold ${day === 'QUA' ? 'text-[#1a1a2e]' : 'text-slate-400'}`}>{day}</p>
              <p className={`text-sm font-bold ${day === 'QUA' ? 'text-[#1a1a2e] font-extrabold' : 'text-[#1a1a2e]'}`}>{dates[i]}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-slate-200 relative h-24">
          <div className="p-4 border-r border-slate-200 bg-slate-50/20 flex flex-col justify-center">
            <p className="text-sm font-bold text-[#1a1a2e]">Complexo Inteiro</p>
            <p className="text-[10px] text-slate-500">4-6 Hóspedes • Villa</p>
          </div>
          <div className="col-span-7 grid grid-cols-7 relative">
            <div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100 bg-[#1a1a2e]/5"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div></div>
            <div className="absolute top-4 left-[2%] w-[40%] h-14 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-2 cursor-pointer hover:shadow-md transition-shadow">
              <p className="text-[10px] font-bold text-emerald-600">CONFIRMADO</p>
              <p className="text-xs font-bold text-[#1a1a2e] truncate">Julianne Moore +2</p>
            </div>
            <div className="absolute top-4 left-[60%] w-[35%] h-14 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-2 cursor-pointer hover:shadow-md transition-shadow">
              <p className="text-[10px] font-bold text-amber-600">PENDENTE</p>
              <p className="text-xs font-bold text-[#1a1a2e] truncate">Marco Rossi</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-slate-200 h-24">
          <div className="p-4 border-r border-slate-200 bg-slate-50/20 flex flex-col justify-center">
            <p className="text-sm font-bold text-[#1a1a2e]">Quarto 1</p>
            <p className="text-[10px] text-slate-500">2 Hóspedes • Suíte Master</p>
          </div>
          <div className="col-span-7 grid grid-cols-7 relative">
            <div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100 bg-[#1a1a2e]/5"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div></div>
            <div className="absolute top-4 left-[30%] w-[55%] h-14 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-2 cursor-pointer hover:shadow-md transition-shadow">
              <p className="text-[10px] font-bold text-blue-600 uppercase">CHECKED-IN</p>
              <p className="text-xs font-bold text-[#1a1a2e] truncate">Alexander Wright</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[200px_repeat(7,1fr)] h-24">
          <div className="p-4 border-r border-slate-200 bg-slate-50/20 flex flex-col justify-center">
            <p className="text-sm font-bold text-[#1a1a2e]">Quarto 2</p>
            <p className="text-[10px] text-slate-500">2 Hóspedes • Twin</p>
          </div>
          <div className="col-span-7 grid grid-cols-7 relative">
            <div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100 bg-[#1a1a2e]/5"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div className="border-r border-slate-100"></div><div></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
              <p className="text-xs text-slate-400 italic">Sem reservas agendadas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
