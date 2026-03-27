"use client";

import React, { useState } from "react";

interface FaqQuestion {
  q: string;
  a?: string;
}

interface FaqCategoryWithQuestions {
  type: "questions";
  title: string;
  defaultOpen?: boolean;
  questions: FaqQuestion[];
}

interface FaqCategoryWithContent {
  type: "content";
  title: string;
  content: string;
}

type FaqCategory = FaqCategoryWithQuestions | FaqCategoryWithContent;

const faqCategories: FaqCategory[] = [
  {
    type: "questions",
    title: "Reservas",
    defaultOpen: true,
    questions: [
      {
        q: "¿Onde posso encontrar o meu código de reserva ou PIN?",
        a: "A sua reserva está associada ao seu endereço de e-mail. Você recebeu uma confirmação de reserva por e-mail que inclui o seu ID de reserva e o seu código PIN.",
      },
      {
        q: "¿Cómo posso entrar em contato com vocês?",
        a: "Você pode entrar em contato conosco através do nosso site, e-mail ou telefone.",
      },
      {
        q: "¿Cómo posso estender a minha reserva?",
        a: "Se tiver as datas disponiveis que deseja estender, pode fazer uma nova reserva. Caso contrario não é possível",
      },
      {
        q: "¿Cómo posso cancelar a minha reserva?",
        a: "Sua reserva pode ser cancelada até 5 dias antes do check-in. Caso contrario nao e possivel",
      },
    ],
  },
  {
    type: "content",
    title: "Precios y descuentos",
    content:
      "Informacao detalhada sobre nossas políticas de preços, descontos por longa estadia e promociones de temporada.",
  },
  {
    type: "content",
    title: "Llegada y salida",
    content:
      "Protocolos de check-in, horarios de check-out e acesso mediante fechaduras inteligentes ou chaves físicas.",
  },
  {
    type: "content",
    title: "Pagos y devoluciones",
    content:
      "Métodos de pagamento aceites, cronogramas de facturação e política de reembolsos ante cancelaciones.",
  },
  {
    type: "content",
    title: "Características y servicios de la propiedad",
    content:
      "Detalhes sobre WiFi, eletrodomésticos, serviços de limpeza e suministros incluídos na propriedade.",
  },
  {
    type: "content",
    title: "Iniciar sesión o Crear una cuenta",
    content:
      "Guia para gerenciar seu perfil pessoal, ver histórico de reservas e salvar suas propriedades favoritas.",
  },
];

export default function HelpFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="bg-white text-text-main antialiased">
      <main>
        {/* Hero Section */}
        <section className="container-main">
          <div className="bg-accent/10 rounded-[2.5rem] p-16 md:p-32 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left order-2 md:order-1">
              <p className="text-xs font-bold tracking-widest uppercase text-text-muted mb-4 block">
                AYUDA Y ASISTENCIA
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Todo lo que necesita en un solo lugar
              </h1>
              <p className="text-text-main/80 text-lg mb-10 leading-relaxed">
                Gestiona tus reservas, accede a información importante sobre la
                propiedad o reserva complementos para mejorar tu estancia.
              </p>
              <button className="bg-primary text-white px-16 py-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all transform hover:-translate-y-0.5">
                Gestionar mi reserva
              </button>
            </div>
            <div className="w-full md:w-1/3 flex justify-center order-1 md:order-2">
              <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                <div className="bg-white/40 rounded-full w-full h-full absolute animate-pulse" />
                <svg
                  className="relative z-10 w-32 h-32 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.93.55 3.73 1.5 5.25L2 22l4.75-1.5c1.52.95 3.32 1.5 5.25 1.5 5.52 0 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container-main py-40">
          <div className="mb-12 text-center md:text-left">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-text-muted">
              PREGUNTAS FRECUENTES
            </span>
          </div>
          <div className="bg-white shadow-xl shadow-gray-100/50 rounded-3xl border border-gray-100 overflow-hidden">
            {faqCategories.map((cat, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={cat.title}
                  className={`border-b border-gray-100 last:border-b-0 ${isOpen ? "" : ""}`}
                >
                  <button
                    className="w-full flex items-center justify-between p-16 text-left focus:outline-none"
                    onClick={() => toggle(i)}
                  >
                    <span className="text-2xl font-display font-semibold flex items-center">
                      <span className="mr-4 text-primary">
                        {isOpen ? "—" : "+"}
                      </span>
                      {cat.title}
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? "500px" : "0" }}
                  >
                    <div className="px-16 pb-16">
                      {cat.type === "questions" ? (
                        <div className="pl-16 space-y-6">
                          {cat.questions.map((q, qi) => (
                            <div key={qi}>
                              {q.a ? (
                                <div>
                                  <h4 className="font-bold mb-2 flex items-center">
                                    <span className="text-primary mr-2">
                                      —
                                    </span>
                                    {q.q}
                                  </h4>
                                  <p className="text-text-muted text-sm pl-12 leading-relaxed">
                                    {q.a}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center hover:text-primary cursor-pointer transition-colors">
                                  <span className="text-primary mr-2 font-bold">
                                    +
                                  </span>
                                  <span className="font-medium text-sm">
                                    {q.q}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-muted text-sm pl-16">
                          {cat.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-24 container-main">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a
              className="text-xl font-display font-bold text-primary tracking-tight"
              href="#"
            >
              ReservationGonzalo
            </a>
            <div className="flex items-center space-x-8 text-sm font-medium text-text-muted">
              <a
                className="hover:text-primary transition-colors"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="hover:text-primary transition-colors"
                href="#"
              >
                Terms of Service
              </a>
            </div>
            <p className="text-sm text-text-muted">
              © 2026 ReservationGonzalo
            </p>
          </div>
      </footer>
    </div>
  );
}
