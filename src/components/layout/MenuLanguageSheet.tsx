"use client";

import { useState } from "react";

interface MenuLanguageSheetProps {
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Os nossos alojamentos", href: "#" },
  { label: "Sobre nós", href: "#" },
  { label: "Contacto", href: "#" },
];

const languages = ["PT", "EN", "ES"] as const;
type Language = (typeof languages)[number];

export default function MenuLanguageSheet({
  open,
  onClose,
}: MenuLanguageSheetProps) {
  const [selectedLang, setSelectedLang] = useState<Language>("PT");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white z-50 shadow-soft flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface">
          <button
            onClick={onClose}
            className="text-text-main p-2 -ml-2 rounded-full hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="material-symbols-outlined text-[24px]">
              close
            </span>
          </button>
          <h2 className="font-display font-bold text-[20px] text-text-main">
            ReservationGonzalo
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          {/* Language Toggle */}
          <div>
            <p className="text-sm text-text-muted mb-3 font-medium uppercase tracking-wider">
              Idioma
            </p>
            <div className="flex h-10 items-center rounded-lg bg-surface p-1">
              {languages.map((lang) => (
                <label
                  key={lang}
                  className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md text-sm font-medium transition-colors ${
                    selectedLang === lang
                      ? "bg-text-main text-white shadow-sm"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  <span>{lang}</span>
                  <input
                    type="radio"
                    name="lang"
                    value={lang}
                    checked={selectedLang === lang}
                    onChange={() => setSelectedLang(lang)}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-display text-[20px] font-semibold text-text-main hover:text-primary transition-colors flex items-center justify-between group"
              >
                {link.label}
                <span className="material-symbols-outlined text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  chevron_right
                </span>
              </a>
            ))}
          </nav>
        </div>

        {/* Footer Action */}
        <div className="p-6 mt-auto border-t border-surface">
          <button className="w-full py-3.5 rounded-xl border border-text-main text-text-main font-display font-semibold text-[15px] hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            Iniciar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}
