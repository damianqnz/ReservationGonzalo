"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Language selector
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { code: "PT", flag: "🇵🇹", label: "Português" },
  { code: "EN", flag: "🇬🇧", label: "English" },
  { code: "ES", flag: "🇪🇸", label: "Español" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

// ---------------------------------------------------------------------------
// User avatar helpers
// ---------------------------------------------------------------------------

function UserAvatar({ image, name }: { image?: string | null; name?: string | null }) {
  const initial = name?.charAt(0).toUpperCase() ?? "?";

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "User"}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="w-8 h-8 rounded-full bg-primary text-white text-[13px] font-bold flex items-center justify-center">
      {initial}
    </span>
  );
}

// ---------------------------------------------------------------------------
// User menu
// ---------------------------------------------------------------------------

function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOwner = session?.user?.role === "OWNER";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de usuario"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 text-text-main hover:text-primary transition-colors"
      >
        {session ? (
          <UserAvatar image={session.user?.image} name={session.user?.name} />
        ) : (
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[24px]">account_circle</span>
            <span className="material-symbols-outlined text-[16px]">menu</span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 min-w-[180px] bg-white border border-surface rounded-lg shadow-md py-1 z-50
            animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {session ? (
            <>
              {/* Nombre del usuario */}
              <div className="px-4 py-2 text-[12px] text-text-muted font-medium truncate border-b border-surface">
                {session.user?.name ?? session.user?.email}
              </div>

              <Link
                href="/mis-reservas"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Mis reservas
              </Link>

              {isOwner && (
                <Link
                  href="/dashboard/settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                  Perfil
                </Link>
              )}

              {isOwner && (
                <Link
                  href="/dashboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Dashboard
                </Link>
              )}

              <div className="border-t border-surface my-1" />

              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  signOut({ redirectTo: "/login" });
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#8b1a1a] hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/mis-reservas"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Minhas reservas
              </Link>

              <div className="border-t border-surface my-1" />

              <Link
                href="/login"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-text-main hover:bg-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Iniciar sessão
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeLang, setActiveLang] = useState<LangCode>("PT");
  const [langOpen, setLangOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as LangCode | null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      setActiveLang(saved);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectLang(code: LangCode) {
    setActiveLang(code);
    localStorage.setItem("lang", code);
    setLangOpen(false);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b transition-all duration-300 h-16 flex items-center ${scrolled ? "border-surface shadow-sm" : "border-transparent"
          }`}
      >
        <div className="container-main flex items-center justify-between h-full">
          <a
            href="#"
            className="font-display font-bold text-[20px] tracking-tight text-text-main"
          >
            ReservationGonzalo
          </a>

          <div className="flex items-center gap-4">
            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1 text-[14px] font-bold text-text-main hover:text-primary transition-colors"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
              >
                {activeLang}
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {langOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {langOpen && (
                <ul
                  role="listbox"
                  className="absolute right-0 mt-2 w-44 bg-white border border-surface rounded-lg shadow-md py-1 z-50"
                >
                  {LANGUAGES.map((lang) => (
                    <li key={lang.code} role="option" aria-selected={activeLang === lang.code}>
                      <button
                        onClick={() => handleSelectLang(lang.code)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[14px] hover:bg-surface transition-colors ${activeLang === lang.code
                          ? "font-bold text-text-main"
                          : "text-text-muted"
                          }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.code}</span>
                        <span className="text-text-muted font-normal">— {lang.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* User menu */}
            <UserMenu />
          </div>
        </div>
      </header>

      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-text-main text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none">
          Em breve disponível neste idioma
        </div>
      )}
    </>
  );
}
