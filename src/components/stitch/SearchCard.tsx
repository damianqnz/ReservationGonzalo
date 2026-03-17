export default function SearchCard() {
  return (
    <section className="relative z-10 px-6 -mt-20">
      <div className="bg-white rounded-[0.75rem] p-4 shadow-soft">
        <div className="space-y-3">
          {/* Dates Input */}
          <button className="w-full flex items-center gap-3 p-4 rounded-[0.5rem] border border-surface bg-surface hover:bg-surface/80 transition-colors text-left group">
            <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">
              calendar_month
            </span>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                Datas
              </span>
              <span className="text-[15px] font-medium text-text-main mt-0.5">
                Check-in / Check-out
              </span>
            </div>
          </button>

          {/* Guests Input */}
          <button className="w-full flex items-center gap-3 p-4 rounded-[0.5rem] border border-surface bg-surface hover:bg-surface/80 transition-colors text-left group">
            <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">
              group
            </span>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                Hóspedes
              </span>
              <span className="text-[15px] font-medium text-text-main mt-0.5">
                Adicionar hóspedes
              </span>
            </div>
          </button>

          {/* Search Button */}
          <button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-[15px] rounded-[0.5rem] transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">search</span>
            Procurar
          </button>
        </div>
      </div>
    </section>
  );
}
