"use client";

import { useState, type ComponentType } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Bath,
  Lock,
  Sun,
  Shield,
  ShieldAlert,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyData {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  address: string;
  city: string;
  country: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  area: number | null;
  pricePerNight: number;
  cleaningFee: number;
  securityDeposit: number;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  minNights: number;
  images: { url: string; alt: string | null; order: number; isCover: boolean }[];
  amenities: { amenity: { name: string; icon: string | null } }[];
  reviews: {
    id: string;
    guestName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }[];
  owner: { name: string | null };
  avgRating: number | null;
  reviewCount: number;
}

interface Props {
  property: PropertyData;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  nights?: number;
  totalPrice?: number;
}

// ─── Constants / maps ─────────────────────────────────────────────────────────

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

const ICON_MAP: Record<string, LucideIcon> = {
  // DB icon slugs (Material Symbols names stored in DB)
  wifi: Wifi,
  ac_unit: Wind,
  local_laundry_service: WashingMachine,
  kitchen: ChefHat,
  tv: Tv,
  local_parking: Car,
  pool: Waves,
  heat: Thermometer,
  thermostat: Thermometer,
  // Lucide slug names
  wind: Wind,
  thermometer: Thermometer,
  car: Car,
  waves: Waves,
  bath: Bath,
  lock: Lock,
  sun: Sun,
  shield: Shield,
  "shield-alert": ShieldAlert,
  // Amenity names (PT + EN)
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

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartamento inteiro",
  HOUSE: "Casa inteira",
  VILLA: "Vila inteira",
  STUDIO: "Estúdio inteiro",
  ROOM: "Quarto privado",
};

const CANCELLATION_LABELS: Record<string, string> = {
  FLEXIBLE: "Política Flexível — cancelamento gratuito até 24h antes",
  MODERATE: "Política Moderada — reembolso parcial até 5 dias antes",
  STRICT: "Política Estrita — não reembolsável",
};

const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()]}`;
}

// ─── Guest modal schema ───────────────────────────────────────────────────────

const guestSchema = z.object({
  guestName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  guestEmail: z.string().email("Email inválido"),
  guestPhone: z.string().optional(),
  guestCount: z.number().int().min(1, "Mínimo 1 hóspede"),
  guestMessage: z.string().max(500, "Máximo 500 caracteres").optional(),
});
type GuestFormValues = z.infer<typeof guestSchema>;

// ─── Star rating helper ───────────────────────────────────────────────────────

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(rating) ? "#F59E0B" : "none"}
          stroke={i < Math.round(rating) ? "#F59E0B" : "#D1D5DB"}
        />
      ))}
    </div>
  );
}

// ─── Guest Modal ──────────────────────────────────────────────────────────────

function GuestModal({
  property,
  checkIn,
  checkOut,
  defaultGuests,
  onClose,
}: {
  property: PropertyData;
  checkIn: string;
  checkOut: string;
  defaultGuests: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: { guestCount: defaultGuests },
  });

  async function onSubmit(values: GuestFormValues) {
    setApiError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn,
          checkOut,
          guestName: values.guestName,
          guestEmail: values.guestEmail,
          guestPhone: values.guestPhone || undefined,
          guestCount: values.guestCount,
          guestMessage: values.guestMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Ocorreu um erro ao criar a reserva.";
        setApiError(msg);
        return;
      }

      router.push(`/checkout?bookingId=${data.data.id}`);
    } catch {
      setApiError("Erro de ligação. Por favor tente novamente.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-text-main/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden max-h-[92dvh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface shrink-0">
          <h2 className="font-display font-semibold text-[17px] text-text-main">
            Dados da reserva
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-text-muted"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-5 py-4 space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-1">
              Nome completo <span className="text-primary">*</span>
            </label>
            <input
              {...register("guestName")}
              placeholder="Ana Silva"
              className="w-full h-11 px-3 rounded-lg border border-surface bg-surface text-[14px] text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {errors.guestName && (
              <p className="text-[12px] text-red-600 mt-1">{errors.guestName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-1">
              Email <span className="text-primary">*</span>
            </label>
            <input
              {...register("guestEmail")}
              type="email"
              placeholder="ana@exemplo.com"
              className="w-full h-11 px-3 rounded-lg border border-surface bg-surface text-[14px] text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {errors.guestEmail && (
              <p className="text-[12px] text-red-600 mt-1">{errors.guestEmail.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-1">
              Telefone
            </label>
            <input
              {...register("guestPhone")}
              type="tel"
              placeholder="+351 912 345 678"
              className="w-full h-11 px-3 rounded-lg border border-surface bg-surface text-[14px] text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Guest count */}
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-1">
              Número de hóspedes <span className="text-primary">*</span>
            </label>
            <input
              {...register("guestCount", { valueAsNumber: true })}
              type="number"
              min={1}
              max={property.maxGuests}
              className="w-full h-11 px-3 rounded-lg border border-surface bg-surface text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Máximo {property.maxGuests} hóspede{property.maxGuests !== 1 ? "s" : ""}
            </p>
            {errors.guestCount && (
              <p className="text-[12px] text-red-600 mt-1">{errors.guestCount.message}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-1">
              Mensagem para o anfitrião
            </label>
            <textarea
              {...register("guestMessage")}
              rows={3}
              placeholder="Hora prevista de chegada, pedidos especiais…"
              className="w-full px-3 py-2.5 rounded-lg border border-surface bg-surface text-[14px] text-text-main placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {errors.guestMessage && (
              <p className="text-[12px] text-red-600 mt-1">{errors.guestMessage.message}</p>
            )}
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] text-red-700">
              {apiError}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 border border-surface rounded-lg text-[14px] font-medium text-text-muted hover:bg-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                A processar…
              </>
            ) : (
              "Confirmar reserva"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PropertyDetailsClient({
  property,
  checkIn,
  checkOut,
  guests,
  nights,
  totalPrice,
}: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const hasDates = !!(checkIn && checkOut && nights);

  const images = property.images.length > 0 ? property.images : null;

  return (
    <div className="bg-background text-text-main antialiased pb-24">
      {/* ── App Bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <a href="/" aria-label="Voltar" className="p-2 -ml-2">
            <span className="material-symbols-outlined text-text-main">arrow_back</span>
          </a>
          <h1 className="text-[16px] font-display font-semibold text-text-main line-clamp-1">
            {property.title}
          </h1>
        </div>
        <div className="flex gap-1">
          <button aria-label="Partilhar" className="p-2">
            <span className="material-symbols-outlined text-text-main">share</span>
          </button>
          <button aria-label="Guardar" className="p-2">
            <span className="material-symbols-outlined text-text-main">favorite_border</span>
          </button>
        </div>
      </header>

      <main>
        {/* ── Gallery ─────────────────────────────────────────────────────── */}
        <section className="relative">
          <div className="w-full aspect-[4/3] overflow-hidden bg-surface">
            {images ? (
              <Image
                src={images[activeImg].url}
                alt={images[activeImg].alt ?? property.title}
                fill
                className="object-cover transition-all duration-500"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-text-muted">
                  apartment
                </span>
              </div>
            )}
          </div>

          {images && images.length > 1 && (
            <>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all relative ${
                      activeImg === i
                        ? "border-white shadow-lg scale-110"
                        : "border-transparent opacity-60"
                    }`}
                    aria-label={`Foto ${i + 1}`}
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                  </button>
                ))}
              </div>
              <div className="absolute top-4 right-4 bg-black/50 text-white text-[12px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                {activeImg + 1}/{images.length}
              </div>
            </>
          )}
        </section>

        {/* ── Property Info ────────────────────────────────────────────────── */}
        <section className="px-4 py-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">
                {TYPE_LABELS[property.type] ?? property.type}
              </p>
              <h2 className="text-[22px] font-display font-bold leading-tight">
                {property.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[14px] text-text-muted">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>
                  {property.city}, {property.country}
                </span>
              </div>
            </div>
            {property.avgRating !== null && (
              <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full shrink-0">
                <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                <span className="text-[14px] font-bold">{property.avgRating}</span>
                {property.reviewCount > 0 && (
                  <span className="text-[12px] text-text-muted">({property.reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Capacity tags */}
          <div className="flex flex-wrap gap-2">
            {[
              `${property.maxGuests} hóspedes`,
              `${property.bedrooms} quarto${property.bedrooms !== 1 ? "s" : ""}`,
              `${property.beds} cama${property.beds !== 1 ? "s" : ""}`,
              `${property.bathrooms} casa${property.bathrooms !== 1 ? "s" : ""} de banho`,
              ...(property.area ? [`${property.area} m²`] : []),
            ].map((tag) => (
              <span
                key={tag}
                className="bg-surface text-[13px] font-medium px-3 py-1.5 rounded-full text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Host ────────────────────────────────────────────────────────── */}
        <section className="px-4 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]">person</span>
          </div>
          <div>
            <p className="font-semibold text-[16px]">
              Anfitrião: {property.owner.name ?? "Gonzalo"}
            </p>
            <p className="text-[13px] text-text-muted">Superanfitrião</p>
          </div>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Description ─────────────────────────────────────────────────── */}
        <section className="px-4 py-6 space-y-3">
          <h3 className="text-[18px] font-display font-bold">Sobre este alojamento</h3>
          <p className="text-[14px] text-text-muted leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Amenities ───────────────────────────────────────────────────── */}
        {property.amenities.length > 0 && (
          <>
            <section className="px-4 py-6 space-y-4">
              <h3 className="text-[18px] font-display font-bold">O que este espaço oferece</h3>
              <div className="grid grid-cols-2 gap-3">
                {property.amenities.map(({ amenity }) => {
                  const IconComp =
                    ICON_MAP[amenity.icon ?? ""] ?? ICON_MAP[amenity.name] ?? Check;
                  return (
                    <div
                      key={amenity.name}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface"
                    >
                      <IconComp size={18} className="text-primary shrink-0" />
                      <span className="text-[13px] font-medium text-text-main">
                        {amenity.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
            <hr className="mx-4 border-surface" />
          </>
        )}

        {/* ── Reviews ─────────────────────────────────────────────────────── */}
        {property.reviews.length > 0 && (
          <>
            <section className="px-4 py-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-display font-bold">Avaliações</h3>
                {property.avgRating !== null && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={property.avgRating} />
                    <span className="text-[14px] font-bold">{property.avgRating}</span>
                    <span className="text-[13px] text-text-muted">
                      ({property.reviewCount})
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {property.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white border border-surface rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-text-muted text-[20px]">
                            person
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[14px]">{r.guestName}</p>
                          <p className="text-[12px] text-text-muted">
                            {new Date(r.createdAt).toLocaleDateString("pt-PT", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size={13} />
                    </div>
                    {r.comment && (
                      <p className="text-[13px] text-text-muted leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <hr className="mx-4 border-surface" />
          </>
        )}

        {/* ── House Rules ──────────────────────────────────────────────────── */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-[18px] font-display font-bold">Regras da casa</h3>
          <div className="space-y-3">
            {[
              {
                icon: "schedule",
                label: `Check-in: a partir das ${property.checkInTime}`,
              },
              {
                icon: "logout",
                label: `Check-out: até às ${property.checkOutTime}`,
              },
              { icon: "smoke_free", label: "Não fumar" },
              { icon: "pets", label: "Sem animais de estimação" },
              { icon: "volume_off", label: "Sem festas nem eventos" },
              {
                icon: "cancel",
                label:
                  CANCELLATION_LABELS[property.cancellationPolicy] ??
                  property.cancellationPolicy,
              },
              ...(property.minNights > 1
                ? [{ icon: "event_available", label: `Mínimo ${property.minNights} noites` }]
                : []),
            ].map((rule) => (
              <div key={rule.label} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-text-muted text-[20px] mt-0.5">
                  {rule.icon}
                </span>
                <span className="text-[14px] text-text-muted">{rule.label}</span>
              </div>
            ))}
          </div>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Location placeholder ─────────────────────────────────────────── */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-[18px] font-display font-bold">Localização</h3>
          <div className="bg-surface rounded-2xl h-48 flex items-center justify-center">
            <div className="text-center text-text-muted">
              <span className="material-symbols-outlined text-[48px]">map</span>
              <p className="text-[13px] mt-2">
                {property.city}, {property.country}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Sticky Booking Bar ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-surface px-4 py-3 shadow-[0_-4px_20px_rgba(26,26,46,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            {hasDates ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-extrabold text-text-main">
                    {property.pricePerNight.toFixed(0)}€
                  </span>
                  <span className="text-[13px] text-text-muted">/noite</span>
                </div>
                <p className="text-[12px] text-text-muted truncate">
                  {formatShortDate(checkIn!)} → {formatShortDate(checkOut!)} ·{" "}
                  {nights} noite{nights !== 1 ? "s" : ""} ·{" "}
                  {guests ?? 1} hóspede{(guests ?? 1) !== 1 ? "s" : ""}
                </p>
                {totalPrice !== undefined && (
                  <p className="text-[12px] font-semibold text-primary">
                    Total: {totalPrice.toFixed(0)}€
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[12px] text-text-muted">A partir de</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-extrabold text-text-main">
                    {property.pricePerNight.toFixed(0)}€
                  </span>
                  <span className="text-[13px] text-text-muted">/noite</span>
                </div>
              </>
            )}
          </div>

          {hasDates ? (
            <button
              onClick={() => setModalOpen(true)}
              className="shrink-0 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all text-[15px]"
            >
              Reservar agora
            </button>
          ) : (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="shrink-0 bg-primary hover:bg-primary/90 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all text-[14px]"
            >
              Verificar disponibilidade
            </button>
          )}
        </div>
      </div>

      {/* ── Guest Modal ──────────────────────────────────────────────────────── */}
      {modalOpen && checkIn && checkOut && (
        <GuestModal
          property={property}
          checkIn={checkIn}
          checkOut={checkOut}
          defaultGuests={guests ?? 1}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
