const reviews = [
  {
    text: '"A melhor experiência de reserva que já tive. O processo foi simples e o apartamento era exatamente como nas fotos. Recomendo vivamente!"',
    author: "Maria Silva",
    initial: "M",
    stay: "Estadia em Setembro 2023",
  },
  {
    text: '"Reservar diretamente compensou muito. O anfitrião foi extremamente prestável e deu-nos ótimas dicas locais. A casa estava impecável."',
    author: "João Costa",
    initial: "J",
    stay: "Estadia em Agosto 2023",
  },
];

function StarRow() {
  return (
    <div className="flex items-center gap-1 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[16px] text-accent"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function GuestReviews() {
  return (
    <section className="mt-16 mb-16 px-6 overflow-hidden">
      <h2 className="font-display font-bold text-[24px] text-text-main mb-6">
        O que dizem os nossos hóspedes
      </h2>
      <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-6 px-6 snap-x">
        {reviews.map((review) => (
          <div
            key={review.author}
            className="w-[280px] shrink-0 bg-white border border-surface rounded-[0.75rem] p-5 shadow-sm snap-center"
          >
            <StarRow />
            <p className="text-[14px] text-text-main font-medium italic mb-4 leading-relaxed">
              {review.text}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-[12px] font-bold text-text-muted">
                {review.initial}
              </div>
              <div>
                <p className="text-[13px] font-bold text-text-main">
                  {review.author}
                </p>
                <p className="text-[11px] text-text-muted">{review.stay}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
