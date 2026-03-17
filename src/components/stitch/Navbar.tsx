"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b transition-all duration-300 h-16 flex items-center justify-between px-6 ${
        scrolled ? "border-surface shadow-sm" : "border-transparent"
      }`}
    >
      <a
        href="#"
        className="font-display font-bold text-[20px] tracking-tight text-text-main"
      >
        ReservationGonzalo
      </a>
      <div className="flex items-center gap-4">
        <div className="flex items-center text-[14px] font-medium text-text-muted">
          <button className="font-bold text-text-main">PT</button>
          <span className="mx-1 opacity-50">|</span>
          <button className="hover:text-text-main transition-colors">EN</button>
          <span className="mx-1 opacity-50">|</span>
          <button className="hover:text-text-main transition-colors">ES</button>
        </div>
        <button
          aria-label="Login"
          className="text-text-main hover:text-primary transition-colors flex items-center"
        >
          <span className="material-symbols-outlined text-[24px]">
            account_circle
          </span>
        </button>
      </div>
    </header>
  );
}
