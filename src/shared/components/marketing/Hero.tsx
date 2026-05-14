import Image from "next/image";

const amenities = [
  { icon: "beach_access", label: "200m da praia" },
  { icon: "pool", label: "Piscina privada" },
  { icon: "bed", label: "4 quartos" },
  { icon: "group", label: "Até 10 pessoas" },
  { icon: "bathroom", label: "2 casas de banho" },
];

export default function Hero() {
  return (
    <section className="relative min-h-[560px] md:min-h-[640px] w-full overflow-hidden bg-[#1a1a2e]">
      <Image
        src="/images/exterior8.jpeg"
        alt="Casa de férias com piscina privada perto da praia em Cascais, Portugal"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Top-to-bottom gradient: darker at top (navbar legibility) and bottom (SearchCard contrast) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/80" />

      {/* Warm vignette for mood — bottom warm glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2a0a0a]/55 via-transparent to-transparent" />

      <div className="relative flex flex-col items-center justify-center min-h-[560px] md:min-h-[640px] px-5 pt-20 pb-28 text-center">

        {/* Social proof pill */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-7">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined material-symbols-filled text-[15px] text-amber-300"
              >
                star
              </span>
            ))}
          </div>
          <span className="text-white text-[13px] font-semibold">4.9</span>
          <span className="text-white/50 text-[13px]">·</span>
          <span className="text-white/80 text-[13px]">120+ avaliações</span>
        </div>

        {/* H1 */}
        <h1 className="font-display font-bold text-[34px] sm:text-[44px] md:text-[54px] leading-[1.1] text-white max-w-[740px]">
          Casa de férias com piscina
          <br />
          <span className="text-amber-300">a 200m da praia</span>
          {" "}em Cascais
        </h1>

        {/* Subheadline */}
        <p className="mt-5 text-white/80 text-[16px] md:text-[18px] max-w-[480px] leading-relaxed">
          Reserve diretamente e poupe nas taxas.
          <br className="hidden sm:block" />
          Ideal para famílias e grupos.
        </p>

        {/* Amenity chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-[620px]">
          {amenities.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-300">{icon}</span>
              <span className="text-white text-[13px] font-medium whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* Trust micro-line */}
        <div className="mt-7 flex items-center gap-2.5 text-white/45 text-[11px] font-medium tracking-[0.12em] uppercase">
          <span>Reserva direta</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>Sem taxas</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>Confirmação imediata</span>
        </div>
      </div>
    </section>
  );
}
