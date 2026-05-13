const benefits = [
  {
    icon: "savings",
    title: "Melhor Preço Garantido",
    description:
      "Evite as taxas ocultas das grandes plataformas. Ao reservar diretamente, garante a tarifa mais baixa disponível.",
  },
  {
    icon: "shield_lock",
    title: "Reserva Segura",
    description:
      "Processo de pagamento encriptado e confirmação instantânea. A sua estadia está garantida no momento da reserva.",
  },
  {
    icon: "person_check",
    title: "Atendimento Personalizado",
    description:
      "Fale diretamente comigo. Estou aqui para ajudar a planear cada detalhe da sua estadia.",
  },
];

export default function WhyBookDirect() {
  return (
    <section className="mt-16 py-12 bg-surface">
      <div className="container-main">
        <h2 className="font-display font-bold text-[24px] text-text-main mb-8">
          Porquê reservar comigo?
        </h2>
        <div className="space-y-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.icon}
              className="bg-white p-5 rounded-[0.75rem] shadow-sm flex gap-4 items-start"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {benefit.icon}
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-[16px] text-text-main mb-1">
                  {benefit.title}
                </h3>
                <p className="text-[14px] text-text-muted leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
