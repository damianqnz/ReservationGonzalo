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
  hasRooms: boolean;
  rooms: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    beds: number;
    pricePerNight: number;
    images: { url: string; alt: string | null; isCover: boolean }[];
  }[];
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
  SINGLE: "Quarto Individual",
  DOUBLE: "Quarto Duplo",
  TWIN: "Quarto Twin",
  SUITE: "Suite",
  JUNIOR_SUITE: "Suite Junior",
  FAMILY: "Quarto Familiar",
  ENTIRE_PLACE: "Alojamento Completo",
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
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()]}`;
}

// ─── Country list ─────────────────────────────────────────────────────────────

const PRIORITY_COUNTRIES = [
  { code: "PT", label: "Portugal" },
  { code: "ES", label: "España" },
  { code: "FR", label: "França" },
  { code: "DE", label: "Alemanha" },
  { code: "GB", label: "Reino Unido" },
  { code: "IT", label: "Itália" },
  { code: "NL", label: "Países Baixos" },
  { code: "BE", label: "Bélgica" },
  { code: "CH", label: "Suíça" },
  { code: "BR", label: "Brasil" },
];

const OTHER_COUNTRIES = [
  { code: "AD", label: "Andorra" },
  { code: "AO", label: "Angola" },
  { code: "AR", label: "Argentina" },
  { code: "AT", label: "Áustria" },
  { code: "AU", label: "Austrália" },
  { code: "CA", label: "Canadá" },
  { code: "CL", label: "Chile" },
  { code: "CN", label: "China" },
  { code: "CO", label: "Colômbia" },
  { code: "CV", label: "Cabo Verde" },
  { code: "CZ", label: "República Checa" },
  { code: "DK", label: "Dinamarca" },
  { code: "EE", label: "Estónia" },
  { code: "FI", label: "Finlândia" },
  { code: "GR", label: "Grécia" },
  { code: "HR", label: "Croácia" },
  { code: "HU", label: "Hungria" },
  { code: "IE", label: "Irlanda" },
  { code: "IL", label: "Israel" },
  { code: "IN", label: "Índia" },
  { code: "IS", label: "Islândia" },
  { code: "JP", label: "Japão" },
  { code: "KR", label: "Coreia do Sul" },
  { code: "LT", label: "Lituânia" },
  { code: "LU", label: "Luxemburgo" },
  { code: "LV", label: "Letónia" },
  { code: "MA", label: "Marrocos" },
  { code: "MX", label: "México" },
  { code: "MZ", label: "Moçambique" },
  { code: "NO", label: "Noruega" },
  { code: "NZ", label: "Nova Zelândia" },
  { code: "PE", label: "Peru" },
  { code: "PL", label: "Polónia" },
  { code: "RO", label: "Roménia" },
  { code: "RU", label: "Rússia" },
  { code: "SE", label: "Suécia" },
  { code: "SG", label: "Singapura" },
  { code: "SI", label: "Eslovénia" },
  { code: "SK", label: "Eslováquia" },
  { code: "ST", label: "São Tomé e Príncipe" },
  { code: "TL", label: "Timor-Leste" },
  { code: "TR", label: "Turquia" },
  { code: "UA", label: "Ucrânia" },
  { code: "US", label: "Estados Unidos" },
  { code: "UY", label: "Uruguai" },
  { code: "VE", label: "Venezuela" },
  { code: "ZA", label: "África do Sul" },
];

// ─── Guest modal schema ───────────────────────────────────────────────────────

const guestSchema = z.object({
  guestName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  guestEmail: z.string().email("Email inválido"),
  guestPhone: z.string().optional(),
  guestCount: z.number().int().min(1, "Mínimo 1 hóspede"),
  guestMessage: z.string().max(500, "Máximo 500 caracteres").optional(),
  guestCountry: z.string().min(2, "País de residência é obrigatório"),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "Deve aceitar os Termos e Condições",
  }),
  acceptedPrivacy: z.boolean().refine((v) => v === true, {
    message: "Deve aceitar a Política de Privacidade",
  }),
  acceptedMarketing: z.boolean().optional(),
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
  selectedRoomId,
  selectedRoomName,
  onClose,
}: {
  property: PropertyData;
  checkIn: string;
  checkOut: string;
  defaultGuests: number;
  selectedRoomId?: string;
  selectedRoomName?: string;
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
    defaultValues: {
      guestCount: defaultGuests,
      guestCountry: "PT",
      acceptedTerms: false,
      acceptedPrivacy: false,
      acceptedMarketing: false,
    },
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
          roomId: selectedRoomId,
          guestCountry: values.guestCountry,
          acceptedTerms: values.acceptedTerms,
          acceptedPrivacy: values.acceptedPrivacy,
          acceptedMarketing: values.acceptedMarketing ?? false,
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
            Dados da reserva {selectedRoomName ? `— ${selectedRoomName}` : ""}
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

          {/* Country */}
          <div>
            <label className="block text-[13px] font-semibold text-text-main mb-1">
              País de residência <span className="text-primary">*</span>
            </label>
            <select
              {...register("guestCountry")}
              className="w-full h-11 px-3 rounded-lg border border-surface bg-surface text-[14px] text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="" disabled>Selecione o país…</option>
              {PRIORITY_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
              <option disabled>──────────────</option>
              {OTHER_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            {errors.guestCountry && (
              <p className="text-[12px] text-red-600 mt-1">{errors.guestCountry.message}</p>
            )}
          </div>

          {/* RGPD checkboxes */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3">
              <input
                {...register("acceptedTerms")}
                id="acceptedTerms"
                type="checkbox"
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-surface text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label htmlFor="acceptedTerms" className="text-[13px] text-text-main leading-snug cursor-pointer">
                Aceito os{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Termos e Condições
                </a>{" "}
                <span className="text-primary">*</span>
              </label>
            </div>
            {errors.acceptedTerms && (
              <p className="text-[12px] text-red-600 -mt-1 ml-7">{errors.acceptedTerms.message}</p>
            )}

            <div className="flex items-start gap-3">
              <input
                {...register("acceptedPrivacy")}
                id="acceptedPrivacy"
                type="checkbox"
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-surface text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label htmlFor="acceptedPrivacy" className="text-[13px] text-text-main leading-snug cursor-pointer">
                Aceito a{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Política de Privacidade
                </a>{" "}
                <span className="text-primary">*</span>
              </label>
            </div>
            {errors.acceptedPrivacy && (
              <p className="text-[12px] text-red-600 -mt-1 ml-7">{errors.acceptedPrivacy.message}</p>
            )}

            <div className="flex items-start gap-3">
              <input
                {...register("acceptedMarketing")}
                id="acceptedMarketing"
                type="checkbox"
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-surface text-primary focus:ring-primary/30 cursor-pointer"
              />
              <label htmlFor="acceptedMarketing" className="text-[13px] text-text-muted leading-snug cursor-pointer">
                Aceito receber ofertas e promoções por email
              </label>
            </div>
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
  totalPrice: initialTotalPrice,
}: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const hasDates = !!(checkIn && checkOut && nights);

  // Derived selected room data
  const selectedRoom = property.rooms.find((r) => r.id === selectedRoomId);
  const currentPricePerNight = selectedRoom
    ? selectedRoom.pricePerNight
    : property.pricePerNight;

  const totalPrice =
    hasDates && nights
      ? currentPricePerNight * nights +
      property.cleaningFee +
      property.securityDeposit
      : initialTotalPrice;

  const images = property.images.length > 0 ? property.images : null;

  const handleBookNow = () => {
    if (property.hasRooms && !selectedRoomId) {
      const el = document.getElementById("room-selector");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setModalOpen(true);
  };

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
                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all relative ${activeImg === i
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

        {/* ── Room Selector (if applicable) ────────────────────────────────── */}
        {property.hasRooms && property.rooms.length > 0 && (
          <>
            <section id="room-selector" className="px-4 py-8 space-y-6 bg-slate-50">
              <div className="space-y-1">
                <h3 className="text-[20px] font-display font-bold">
                  Escolha o seu quarto
                </h3>
                <p className="text-[14px] text-text-muted">
                  Selecione a opção que melhor se adapta às suas necessidades.
                </p>
              </div>

              <div className="space-y-4">
                {property.rooms.map((room) => {
                  const isExcl = room.type === "ENTIRE_PLACE";
                  const isSelected = selectedRoomId === room.id;
                  const roomImg =
                    room.images.find((i) => i.isCover)?.url ||
                    room.images[0]?.url ||
                    "/placeholder.jpg";

                  return (
                    <div key={room.id} className="space-y-2">
                      {isExcl && (
                        <div className="flex items-center gap-4 py-2">
                          <div className="h-px bg-slate-200 flex-1" />
                          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                            ou
                          </span>
                          <div className="h-px bg-slate-200 flex-1" />
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`w-full text-left flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected
                            ? "border-[#8b1a1a] bg-white shadow-md ring-1 ring-[#8b1a1a]/10"
                            : "border-surface bg-white hover:border-slate-300"
                          } ${isExcl ? "bg-amber-50/50" : ""}`}
                      >
                        {/* Room Image */}
                        <div className="relative w-full sm:w-32 h-24 shrink-0 rounded-xl overflow-hidden bg-surface">
                          <Image
                            src={roomImg}
                            alt={room.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 128px"
                          />
                        </div>

                        {/* Room Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[16px]">
                                  {room.name}
                                </h4>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface text-text-muted">
                                  {TYPE_LABELS[room.type] ?? room.type}
                                </span>
                              </div>
                              {isExcl && (
                                <p className="text-[12px] text-amber-700 font-medium">
                                  Inclui todos os quartos
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[16px] font-bold text-text-main">
                                {room.pricePerNight}€
                              </p>
                              <p className="text-[11px] text-text-muted">
                                /noite
                              </p>
                            </div>
                          </div>

                          {room.description && (
                            <p className="text-[13px] text-text-muted line-clamp-2 leading-relaxed">
                              {room.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-[12px] text-text-muted">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">
                                group
                              </span>
                              {room.maxGuests}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">
                                bed
                              </span>
                              {room.beds}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px]">
                                shower
                              </span>
                              {room.bathrooms}
                            </span>
                          </div>
                        </div>

                        {/* Selection indicator (mobile) */}
                        <div className="mt-2 sm:mt-0 flex items-center justify-center">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                ? "bg-[#8b1a1a] border-[#8b1a1a]"
                                : "border-slate-300"
                              }`}
                          >
                            {isSelected && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
            <hr className="mx-4 border-surface" />
          </>
        )}

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
                    {currentPricePerNight.toFixed(0)}€
                  </span>
                  <span className="text-[13px] text-text-muted">/noite</span>
                </div>
                <p className="text-[12px] text-text-muted truncate">
                  {selectedRoom ? `${selectedRoom.name} · ` : ""}
                  {formatShortDate(checkIn!)} → {formatShortDate(checkOut!)} ·{" "}
                  {nights} noite{nights !== 1 ? "s" : ""}
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
              onClick={handleBookNow}
              className={`shrink-0 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all text-[15px] ${property.hasRooms && !selectedRoomId ? "opacity-60" : ""
                }`}
            >
              {property.hasRooms && !selectedRoomId
                ? "Escolher quarto"
                : "Reservar agora"}
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
          selectedRoomId={selectedRoomId || undefined}
          selectedRoomName={selectedRoom?.name}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
