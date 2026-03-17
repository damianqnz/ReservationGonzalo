interface Room {
  id: string
  checkIn: string
  checkOut: string
  guest: string
  otherRoom: string
  isVip?: boolean
}

interface RoomCategory {
  name: string
  units: number
  rooms: Room[]
}

const roomCategories: RoomCategory[] = [
  {
    name: 'Suítes Júnior',
    units: 4,
    rooms: [
      { id: '101', checkIn: '12/10/2023', checkOut: '15/10/2023', guest: 'John Doe', otherRoom: '102' },
      { id: '104', checkIn: '14/10/2023', checkOut: '20/10/2023', guest: 'Mariya Johns', otherRoom: 'Não' },
    ]
  },
  {
    name: 'Suítes de Luxo',
    units: 2,
    rooms: [
      { id: '204', checkIn: '10/10/2023', checkOut: '12/10/2023', guest: 'Carlos Mendes', otherRoom: '205' },
    ]
  },
  {
    name: 'Suítes VIP',
    units: 1,
    rooms: [
      { id: '502', checkIn: '18/10/2023', checkOut: '25/10/2023', guest: 'Elena Rodriguez', otherRoom: 'Não', isVip: true },
    ]
  }
]

export default function PropertiesPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight">Propriedades e Quartos</h2>
          <p className="text-slate-500 mt-1">Gestão e visão geral do status de todas as suítes disponíveis.</p>
        </div>
        <button className="bg-[#8b1a1a] text-white px-6 py-2.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/10 hover:opacity-90 transition-all active:scale-95">
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Listagem
        </button>
      </div>

      <div className="space-y-12">
        {roomCategories.map((category) => (
          <section key={category.name}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1.5 bg-[#8b1a1a] rounded-full"></div>
              <h3 className="text-xl font-bold text-[#1a1a2e]">{category.name}</h3>
              <span className="ml-auto text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 border border-slate-200">
                {category.units} UNIDADES
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {category.rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                       <span className="text-2xl font-bold text-[#8b1a1a]">{room.id}</span>
                       {room.isVip && (
                         <span className="material-symbols-outlined text-[#8b1a1a] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                       )}
                    </div>
                    <button className="text-slate-400 hover:bg-slate-50 p-1 rounded-lg">
                      <span className="material-symbols-outlined text-xl">more_vert</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Check-in</p>
                        <p className="text-sm font-semibold">{room.checkIn}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Check-out</p>
                        <p className="text-sm font-semibold">{room.checkOut}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Hóspede</p>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-[#8b1a1a]">person</span>
                        {room.guest}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Outro quarto</p>
                        <p className="text-sm font-medium">{room.otherRoom}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Quartos</p>
                        <p className="text-sm font-medium">01</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
