"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/style.css";
import type { SearchProperty } from "@/shared/components/marketing/SearchResultsModal";

// Lazy-import the modal to avoid SSR issues
import dynamic from "next/dynamic";
const SearchResultsModal = dynamic(
  () => import("@/shared/components/marketing/SearchResultsModal"),
  { ssr: false },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatShortDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_PT[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

function nightsBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchCard() {
  // ── Date range state ────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const dateRef = useRef<HTMLDivElement>(null);

  // ── Guests state ────────────────────────────────────────────────────────────
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const guestsRef = useRef<HTMLDivElement>(null);

  // ── Search state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchProperty[] | null>(null);

  // ── Fetch unavailable dates on mount ────────────────────────────────────────
  useEffect(() => {
    async function loadUnavailable() {
      try {
        // Fetch the first active property to get its blocked dates
        const propRes = await fetch("/api/properties?limit=1");
        if (!propRes.ok) return;
        const propData = await propRes.json();
        const firstId = propData?.data?.properties?.[0]?.id;
        if (!firstId) return;

        const res = await fetch(`/api/availability?propertyId=${firstId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.data?.unavailableDates) {
          setUnavailableDates(data.data.unavailableDates.map((iso: string) => new Date(iso)));
        }
      } catch {
        // Non-critical — silently ignore
      }
    }
    loadUnavailable();
  }, []);

  // ── Close dropdowns on outside click ────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(e.target as Node)) {
        setGuestsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────────
  // A complete range requires both dates AND they must be different days
  const hasRange =
    !!(dateRange?.from &&
    dateRange?.to &&
    dateRange.from.getTime() !== dateRange.to.getTime())
  const nights = hasRange ? nightsBetween(dateRange!.from!, dateRange!.to!) : 0;
  const totalGuests = adults + children;

  const dateLabel = hasRange
    ? `${formatShortDate(dateRange!.from!)} → ${formatShortDate(dateRange!.to!)} (${nights} noite${nights !== 1 ? "s" : ""})`
    : dateRange?.from
      ? `${formatShortDate(dateRange.from)} → ?`
      : "Check-in / Check-out";

  const guestsLabel =
    children > 0
      ? `${adults} adulto${adults !== 1 ? "s" : ""}, ${children} criança${children !== 1 ? "s" : ""}`
      : `${adults} hóspede${adults !== 1 ? "s" : ""}`;

  // ── Search ───────────────────────────────────────────────────────────────────
  async function handleSearch() {
    if (!hasRange) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        checkIn: dateRange!.from!.toISOString(),
        checkOut: dateRange!.to!.toISOString(),
        guests: String(totalGuests),
      });
      const res = await fetch(`/api/properties/search?${params.toString()}`);
      const data = await res.json();
      setResults(data?.data?.properties ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="relative z-10 px-4 md:px-6 -mt-10">
        <div className="bg-white rounded-[1rem] p-4 md:px-8 shadow-soft max-w-[860px] mx-auto">
          <div className="space-y-3">

            {/* ── Dates ──────────────────────────────────────────────────── */}
            <div ref={dateRef} className="relative">
              <button
                onClick={() => {
                  setDatePickerOpen((v) => !v);
                  setGuestsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-[0.5rem] border border-surface bg-surface hover:bg-surface/80 transition-colors text-left group"
              >
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">
                  calendar_month
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                    Datas
                  </span>
                  <span
                    className={`text-[15px] font-medium mt-0.5 truncate ${
                      dateRange?.from ? "text-text-main" : "text-text-muted"
                    }`}
                  >
                    {dateLabel}
                  </span>
                </div>
                {dateRange?.from && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange(undefined);
                    }}
                    className="ml-auto text-text-muted hover:text-primary transition-colors flex-shrink-0"
                    aria-label="Limpar datas"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </button>

              {datePickerOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-xl border border-surface shadow-[0_8px_30px_rgba(26,26,46,0.12)] p-3 rdp-custom">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      // Only close when both dates are set AND they're different days
                      if (
                        range?.from &&
                        range?.to &&
                        range.from.getTime() !== range.to.getTime()
                      ) {
                        setDatePickerOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    pagedNavigation
                    locale={ptBR}
                    disabled={[
                      { before: new Date() },
                      ...unavailableDates,
                    ]}
                    showOutsideDays={false}
                  />
                </div>
              )}
            </div>

            {/* ── Guests ─────────────────────────────────────────────────── */}
            <div ref={guestsRef} className="relative">
              <button
                onClick={() => {
                  setGuestsOpen((v) => !v);
                  setDatePickerOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-[0.5rem] border border-surface bg-surface hover:bg-surface/80 transition-colors text-left group"
              >
                <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">
                  group
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">
                    Hóspedes
                  </span>
                  <span className="text-[15px] font-medium text-text-main mt-0.5">
                    {guestsLabel}
                  </span>
                </div>
                <span className="ml-auto material-symbols-outlined text-[18px] text-text-muted">
                  {guestsOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {guestsOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-xl border border-surface shadow-[0_8px_30px_rgba(26,26,46,0.12)] p-4 space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-text-main">Adultos</p>
                      <p className="text-[12px] text-text-muted">13 anos ou mais</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setAdults((v) => Math.max(1, v - 1))}
                        disabled={adults <= 1}
                        className="w-8 h-8 rounded-full border border-surface flex items-center justify-center text-text-main hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Menos adultos"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-5 text-center text-[15px] font-semibold text-text-main">
                        {adults}
                      </span>
                      <button
                        onClick={() => setAdults((v) => Math.min(10, v + 1))}
                        disabled={adults >= 10}
                        className="w-8 h-8 rounded-full border border-surface flex items-center justify-center text-text-main hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Mais adultos"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-text-main">Crianças</p>
                      <p className="text-[12px] text-text-muted">Até 12 anos</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setChildren((v) => Math.max(0, v - 1))}
                        disabled={children <= 0}
                        className="w-8 h-8 rounded-full border border-surface flex items-center justify-center text-text-main hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Menos crianças"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-5 text-center text-[15px] font-semibold text-text-main">
                        {children}
                      </span>
                      <button
                        onClick={() => setChildren((v) => Math.min(5, v + 1))}
                        disabled={children >= 5}
                        className="w-8 h-8 rounded-full border border-surface flex items-center justify-center text-text-main hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Mais crianças"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Search button ───────────────────────────────────────────── */}
            <button
              onClick={handleSearch}
              disabled={!hasRange || loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-display font-semibold text-[15px] rounded-[0.5rem] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A procurar…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  Procurar
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Results modal ──────────────────────────────────────────────────── */}
      {results !== null && (
        <SearchResultsModal
          properties={results}
          checkIn={dateRange?.from}
          checkOut={dateRange?.to}
          guests={totalGuests}
          nights={nights}
          onClose={() => setResults(null)}
          onChangeDates={() => {
            setResults(null);
            setDatePickerOpen(true);
          }}
        />
      )}
    </>
  );
}
