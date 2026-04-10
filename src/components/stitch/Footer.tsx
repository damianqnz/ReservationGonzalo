"use client";

import Link from 'next/link';

export default function Footer() {
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.Tawk_API) {
      window.Tawk_API.toggle();
    }
  };

  return (
    <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
      <div className="container-main space-y-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <span className="text-xl font-bold font-display">
              ReservationGonzalo
            </span>
            <p className="text-gray-500 text-sm leading-relaxed">
              Redefiniendo el lujo y la comodidad en el alquiler vacacional de
              alta gama.
            </p>
          </div>

          {/* Empresa */}
          <div className="space-y-6">
            <p className="font-bold text-sm uppercase tracking-widest text-gray-900">
              Empresa
            </p>
            <ul className="space-y-4 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  Sobre mim
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <p className="font-bold text-sm uppercase tracking-widest text-gray-900">
              Legal
            </p>
            <ul className="space-y-4 text-sm text-gray-600">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Termos e Condições
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-primary transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div className="space-y-6">
            <p className="font-bold text-sm uppercase tracking-widest text-gray-900">
              Ajuda
            </p>
            <ul className="space-y-4 text-sm text-gray-600">
              <li>
                <button
                  onClick={handleContactClick}
                  className="hover:text-primary transition-colors text-left font-medium"
                >
                  Contacto
                </button>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Soporte
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom area */}
        <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-400">
            © 2026 ReservationGonzalo. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Página oficial de Gonzalo
            </span>
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
