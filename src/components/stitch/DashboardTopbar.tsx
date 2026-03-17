import Image from 'next/image'

export default function DashboardTopbar() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-[#1a1a2e]/20 rounded-lg transition-all">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-0"
            placeholder="Pesquisar análises, reservas ou propriedades..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-slate-100 rounded-full transition-all">
            <span className="material-symbols-outlined text-slate-500">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#8b1a1a] rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <span className="material-symbols-outlined text-slate-500">chat_bubble</span>
          </button>
        </div>
        <div className="h-8 w-[1px] bg-slate-200"></div>
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1a1a2e]">Gonzalo R.</p>
            <p className="text-[10px] text-slate-500">Gerente de Propriedade</p>
          </div>
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW4UEKqW05NpJMy1GdhdKfPzvBdr-_xGGwelEYoaSPxgRlDpUquKD9qdF4z81Vzd67I0ilmBTy__3_2GHqR4fdJavuO3f2TFthTQwPCHYOYGxivHba4Hqmy7HlgtVwMwcSZIEjdf4rkakl28cfvgWNbsX_L_5U-hdNbyjGG_kDp2CfpIlcEVcZM4UGLmHekXhe_hnXHySka6dNaQNlH-o0SiIMbOOJ9EuXzU_j1cG2Zj5nUvBni7DgpFN0UPffimLprdNPdrqoeZG0"
              alt="Perfil do administrador"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
