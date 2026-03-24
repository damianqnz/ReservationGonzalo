"use client";

import { useState } from "react";

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
        q: "¿Dónde puedo encontrar mi código de reserva o PIN?",
        a: "Tu reserva está asociada a tu dirección de correo electrónico. Has recibido una confirmación de reserva por correo electrónico que incluye tu ID de reserva y tu código PIN.",
      },
      { q: "¿Cómo puedo ponerme en contacto con ustedes?" },
      { q: "¿Cómo puedo ampliar mi reserva?" },
      { q: "¿Cómo puedo anular mi reserva?" },
    ],
  },
  {
    type: "content",
    title: "Precios y descuentos",
    content:
      "Información detallada sobre nuestras políticas de precios, descuentos por larga estancia y promociones de temporada.",
  },
  {
    type: "content",
    title: "Llegada y salida",
    content:
      "Protocolos de check-in, horarios de check-out y acceso mediante cerraduras inteligentes o llaves físicas.",
  },
  {
    type: "content",
    title: "Pagos y devoluciones",
    content:
      "Métodos de pago aceptados, cronogramas de facturación y política de reembolsos ante cancelaciones.",
  },
  {
    type: "content",
    title: "Características y servicios de la propiedad",
    content:
      "Detalles sobre WiFi, electrodomésticos, servicios de limpieza y suministros incluidos en la propiedad.",
  },
  {
    type: "content",
    title: "Iniciar sesión o Crear una cuenta",
    content:
      "Guía para gestionar tu perfil personal, ver historial de reservas y guardar tus propiedades favoritas.",
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-accent/10 rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left order-2 md:order-1">
              <span className="text-xs font-bold tracking-widest uppercase text-text-muted mb-4 block">
                AYUDA Y ASISTENCIA
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Todo lo que necesita en un solo lugar
              </h1>
              <p className="text-text-main/80 text-lg mb-10 leading-relaxed">
                Gestiona tus reservas, accede a información importante sobre la
                propiedad o reserva complementos para mejorar tu estancia.
              </p>
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all transform hover:-translate-y-0.5">
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
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                    className="w-full flex items-center justify-between p-8 text-left focus:outline-none"
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
                    <div className="px-8 pb-8">
                      {cat.type === "questions" ? (
                        <div className="pl-8 space-y-6">
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
                                  <p className="text-text-muted text-sm pl-6 leading-relaxed">
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
                        <p className="text-text-muted text-sm pl-8">
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
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
      </footer>
    </div>
  );
}
