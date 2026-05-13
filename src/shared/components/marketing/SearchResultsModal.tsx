"use client";

import { useEffect, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Wifi,
  Wind,
  WashingMachine,
  ChefHat,
  Tv,
  Car,
  Waves,
  Thermometer,
  Star,
  Check,
} from "lucide-react";

// ─── Amenity icon map ─────────────────────────────────────────────────────────
// Maps DB icon slugs OR amenity names → lucide component

type LucideIcon = ComponentType<{ size?: number; className?: string; fill?: string; stroke?: string }>;

const ICON_MAP: Record<string, LucideIcon> = {
  // By DB icon field (Material Symbols slugs stored in DB)
  wifi: Wifi,
  ac_unit: Wind,
  local_laundry_service: WashingMachine,
  kitchen: ChefHat,
  tv: Tv,
  local_parking: Car,
  pool: Waves,
  heat: Thermometer,
  thermostat: Thermometer,
  // By common amenity names (PT + EN)
  WiFi: Wifi,
  "Ar condicionado": Wind,
  "Air conditioning": Wind,
  Aquecimento: Thermometer,
  Heating: Thermometer,
  "Máquina de lavar": WashingMachine,
  "Washing machine": WashingMachine,
  Washer: WashingMachine,
  Cozinha: ChefHat,
  "Full kitchen": ChefHat,
  Kitchen: ChefHat,
  "Smart TV": Tv,
  TV: Tv,
  Estacionamento: Car,
  Parking: Car,
  Piscina: Waves,
  Pool: Waves,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchProperty {
  id: string;
  title: string;
  slug: string;
  city: string;
  country: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  cleaningFee: number;
  coverImage: { url: string; alt?: string | null } | null;
  amenities: { name: string; icon?: string | null }[];
  avgRating: number | null;
  reviewCount: number;
}

interface SearchResultsModalProps {
  properties: SearchProperty[];
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  nights?: number;
  onClose: () => void;
  onChangeDates: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateParam(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Property Card ────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  checkIn,
  checkOut,
  guests,
  nights,
}: {
  property: SearchProperty;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  nights?: number;
}) {
  const totalPrice = nights
    ? property.pricePerNight * nights + property.cleaningFee
    : null;

  const detailsHref = (() => {
    const base = `/property/${property.slug}`;
    const p = new URLSearchParams();
    if (checkIn) p.set("checkIn", formatDateParam(checkIn));
    if (checkOut) p.set("checkOut", formatDateParam(checkOut));
    if (guests) p.set("guests", String(guests));
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  })();

  const visibleAmenities = property.amenities.slice(0, 3);
  const extraCount = property.amenities.length - visibleAmenities.length;

  return (
    <article className="flex gap-4 p-4 bg-white rounded-xl border border-surface hover:shadow-soft transition-shadow">
      {/* Cover image */}
      <div className="relative w-40 h-32 shrink-0 rounded-lg overflow-hidden bg-surface">
        {property.coverImage ? (
          <Image
            src={property.coverImage.url}
            alt={property.coverImage.alt ?? property.title}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-text-muted">
              apartment
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-[15px] text-text-main leading-tight truncate">
              {property.title}
            </h3>
            {property.avgRating !== null && (
              <span className="flex items-center gap-1 text-[13px] font-semibold text-text-main shrink-0">
                <Star size={13} fill="#F59E0B" stroke="#F59E0B" />
                {property.avgRating}
              </span>
            )}
          </div>

          <p className="text-[13px] text-text-muted mt-0.5 truncate">
            {property.city}, {property.country}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-[12px] text-text-muted">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">group</span>
              {property.maxGuests}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bed</span>
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">shower</span>
              {property.bathrooms}
            </span>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {visibleAmenities.map((a) => {
                const IconComp = ICON_MAP[a.icon ?? ""] ?? ICON_MAP[a.name] ?? Check;
                return (
                  <span
                    key={a.name}
                    className="flex items-center gap-1 text-[11px] text-text-muted bg-surface px-1.5 py-0.5 rounded"
                    title={a.name}
                  >
                    <IconComp size={12} className="text-gray-500 shrink-0" />
                    {a.name}
                  </span>
                );
              })}
              {extraCount > 0 && (
                <span className="text-[11px] text-text-muted">+{extraCount} mais</span>
              )}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <p className="text-[13px] font-semibold text-text-main">
              Desde{" "}
              <span className="text-[16px] text-primary">
                {property.pricePerNight.toFixed(0)}€
              </span>
              /noite
            </p>
            {totalPrice !== null && nights && (
              <p className="text-[11px] text-text-muted">
                Total: {totalPrice.toFixed(0)}€ ({nights} noite{nights !== 1 ? "s" : ""})
              </p>
            )}
          </div>
          <Link
            href={detailsHref}
            className="text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-lg"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function SearchResultsModal({
  properties,
  checkIn,
  checkOut,
  guests,
  nights,
  onClose,
  onChangeDates,
}: SearchResultsModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-text-main/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-xl max-h-[90dvh] sm:max-h-[80dvh] flex flex-col bg-white sm:rounded-2xl rounded-t-2xl shadow-[0_-8px_30px_rgba(26,26,46,0.15)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface shrink-0">
          <h2 className="font-display font-semibold text-[17px] text-text-main">
            {properties.length}{" "}
            {properties.length === 1 ? "alojamento disponível" : "alojamentos disponíveis"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-text-muted"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
              <span className="material-symbols-outlined text-[56px] text-text-muted">
                event_busy
              </span>
              <div>
                <p className="font-display font-semibold text-[16px] text-text-main">
                  Sem disponibilidade
                </p>
                <p className="text-[14px] text-text-muted mt-1">
                  Sem disponibilidade para as datas selecionadas
                </p>
              </div>
              <button
                onClick={onChangeDates}
                className="text-[14px] font-semibold text-primary border border-primary rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors"
              >
                Alterar datas
              </button>
            </div>
          ) : (
            properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={nights}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
