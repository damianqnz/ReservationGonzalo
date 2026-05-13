"use client";

import { useState, useEffect, useRef, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageCategory } from "@prisma/client";
import PropertyMapWrapper from "@/domains/property/components/PropertyMapWrapper";
import PropertyGallery from "@/domains/property/components/PropertyGallery";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Image from "next/image";
import { pt } from "date-fns/locale";
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
  DoorOpen,
  Users,
  Shirt,
  Sofa,
  Bed,
  PawPrint,
  Baby,
  X,
  CalendarX,
  ScrollText,
  Info,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Key,
  Home,
  MessageSquare,
  Share2,
  Mail,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { PROPERTY_SERVICES, AMENITY_TO_SERVICE_KEY } from "@/domains/property/lib/amenities";
import { sileo } from 'sileo';

declare global {
  interface Window {
    Tawk_API: Record<string, any>;
  }
}

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
  images: { id: string; url: string; publicId: string; alt: string | null; order: number; isCover: boolean; category: ImageCategory }[];
  amenities: { amenity: { name: string; icon: string | null } }[];
  reviews: {
    id: string;
    guestName: string;
    rating: number;
    comment: string | null;
    ownerReply: string | null;
    createdAt: string;
    source?: string;
    stayDate?: string | null;
  }[];
  owner: { id: string; name: string | null; image: string | null; createdAt: string };
  licenseNumber: string | null;
  hostDescription: string | null;
  spaceDescription: string | null;
  accessInfo: string | null;
  interactionInfo: string | null;
  additionalInfo: string | null;
  parkingInfo: string | null;
  extraServices: string | null;
  smokingAllowed: boolean;
  houseRules: string | null;
  cancellationDays: number | null;
  pricingRules: { type: string; value: number; isPercentage: boolean }[];
  avgRating: number | null;
  reviewCount: number;
  lat: number | null;
  lng: number | null;
  hasRooms: boolean;
  floors: number | null;
  hasElevator: boolean;
  towelsIncluded: boolean;
  arrivalType: string | null;
  petsAllowed: boolean;
  childrenAllowed: boolean;
  bedsConfig: string | null;
  bathroomType: string | null;
  services: string | null;
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
    bedsList: string | null;
    bathroomType: string | null;
    images: { url: string; alt: string | null; isCover: boolean; category: ImageCategory }[];
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatBedsList(beds: string[]): string {
  if (beds.length === 0) return ''
  const counts = beds.reduce<Record<string, number>>((acc, bed) => {
    acc[bed] = (acc[bed] || 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .map(([type, count]) => (count === 1 ? type : `${count}× ${type}`))
    .join(', ')
}

// ─── Constants / maps ─────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "G";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function AccordionItem({
  title,
  icon: Icon,
  children,
  isOpen,
  onClick,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex justify-between items-center py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <Icon
            size={20}
            className={`transition-colors ${
              isOpen ? "text-primary" : "text-text-muted group-hover:text-primary"
            }`}
          />
          <span
            className={`font-medium text-[15px] transition-colors ${
              isOpen ? "text-text-main" : "text-text-muted group-hover:text-primary"
            }`}
          >
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-text-muted" />
        ) : (
          <ChevronDown size={20} className="text-text-muted" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-[14px] text-gray-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

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
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const AVATAR_COLORS = ['#8b1a1a', '#1a1a2e', '#059669', '#d97706', '#7c3aed', '#db2777'];

function formatShortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_PT[d.getUTCMonth()]}`;
}

function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS_PT[d.getMonth()]}`;
}

/** Returns YYYY-MM-DD using local time (avoids UTC off-by-one in negative-offset zones). */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 12, // w-3
    md: 16, // w-4
    lg: 20, // w-5
  };
  const iconSize = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const isFilled = i < Math.floor(rating);
        const isHalf = !isFilled && i < rating;
        
        return (
          <Star
            key={i}
            size={iconSize}
            fill={isFilled || isHalf ? "#F59E0B" : "none"}
            stroke={isFilled || isHalf ? "#F59E0B" : "#D1D5DB"}
            className={isHalf ? "opacity-70" : ""} // Approximation of half star
          />
        );
      })}
    </div>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  MANUAL: "Importada",
};

const SOURCE_CLASSES: Record<string, string> = {
  AIRBNB: "bg-orange-50 text-orange-700 border-orange-100",
  BOOKING: "bg-blue-50 text-blue-700 border-blue-100",
  MANUAL: "bg-gray-50 text-gray-700 border-gray-100",
};


// ─── Date Range Picker Card (shared by body section + overlay panel) ─────────

interface DateRangePickerCardProps {
  localCheckIn: Date | null;
  localCheckOut: Date | null;
  unavailableDates: Date[];
  onSelect: (range: DateRange | undefined) => void;
  onConfirm: () => void;
  onClear: () => void;
}

function DateRangePickerCard({
  localCheckIn,
  localCheckOut,
  unavailableDates,
  onSelect,
  onConfirm,
  onClear,
}: DateRangePickerCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const localNights =
    localCheckIn && localCheckOut
      ? Math.round(
        (localCheckOut.getTime() - localCheckIn.getTime()) / 86_400_000,
      )
      : null;

  const statusText = !localCheckIn
    ? "Selecione o check-in"
    : !localCheckOut
      ? "Agora selecione o check-out"
      : `Check-in: ${formatDayMonth(localCheckIn)} → Check-out: ${formatDayMonth(localCheckOut)} · ${localNights} noite${localNights !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-center overflow-x-auto">
        <DayPicker
          mode="range"
          selected={{
            from: localCheckIn ?? undefined,
            to: localCheckOut ?? undefined,
          }}
          onSelect={onSelect}
          disabled={[{ before: today }, ...unavailableDates]}
          locale={pt}
          showOutsideDays={false}
        />
      </div>
      <p
        className={`text-center text-[14px] min-h-[20px] ${localCheckIn && localCheckOut
            ? "text-green-700 font-medium"
            : "text-text-muted"
          }`}
      >
        {statusText}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 h-11 border border-surface rounded-lg text-[14px] font-medium text-text-muted hover:bg-surface transition-colors"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!localCheckIn || !localCheckOut}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg text-[14px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirmar datas →
        </button>
      </div>
    </div>
  );
}

// ─── Date Picker Panel (full-screen overlay from sticky bar) ──────────────────

function DatePickerPanel({
  localCheckIn,
  localCheckOut,
  unavailableDates,
  onSelect,
  onConfirm,
  onClear,
  onClose,
}: {
  localCheckIn: Date | null;
  localCheckOut: Date | null;
  unavailableDates: Date[];
  onSelect: (range: DateRange | undefined) => void;
  onConfirm: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-text-main/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden max-h-[92dvh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface shrink-0">
          <h2 className="font-display font-semibold text-[17px] text-text-main">
            Selecione as datas da sua estadia
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-text-muted"
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-5">
          <DateRangePickerCard
            localCheckIn={localCheckIn}
            localCheckOut={localCheckOut}
            unavailableDates={unavailableDates}
            onSelect={onSelect}
            onConfirm={onConfirm}
            onClear={onClear}
          />
        </div>
      </div>
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

// ─── Share Modal ─────────────────────────────────────────────────────────────
function ShareModal({
  isOpen,
  onClose,
  propertyTitle,
  propertyUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(propertyUrl);
    setCopied(true);
    sileo.success({ title: 'Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: (
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(`🏠 ${propertyTitle}\n${propertyUrl}`)}`
    },
    {
      name: "Facebook",
      icon: (
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`
    },
    {
      name: "Telegram",
      icon: (
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#0088CC" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(propertyUrl)}&text=${encodeURIComponent(propertyTitle)}`
    },
    {
      name: "X",
      icon: (
        <div className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(propertyTitle)}&url=${encodeURIComponent(propertyUrl)}`
    },
    {
      name: "Email",
      icon: (
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
          <Mail className="w-5 h-5 text-gray-600" />
        </div>
      ),
      url: `mailto:?subject=${encodeURIComponent(`🏠 ${propertyTitle}`)}&body=${encodeURIComponent(`Olha este alojamento:\n${propertyUrl}`)}`
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-[400px] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#1a1a2e]">Partilhar alojamento</h2>
              <p className="text-sm text-gray-500 truncate max-w-[280px]">{propertyTitle}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {shareOptions.map((option) => (
              <a 
                key={option.name}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 transition-all group"
              >
                <div className="group-hover:scale-110 transition-transform">
                  {option.icon}
                </div>
                <span className="text-xs font-medium text-gray-600">{option.name}</span>
              </a>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-[#1a1a2e]">Ou copia o link</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex items-center min-w-0">
                <span className="text-sm text-gray-500 truncate">{propertyUrl}</span>
              </div>
              <button 
                onClick={handleCopy}
                className="shrink-0 bg-[#8b1a1a] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#6d1414] transition-all flex items-center gap-2"
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
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
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const propertyUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_SITE_URL}/property/${property.slug}`;

  // ── Date picker state ────────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localCheckIn, setLocalCheckIn] = useState<Date | null>(null);
  const [localCheckOut, setLocalCheckOut] = useState<Date | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [hostDescExpanded, setHostDescExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Fetch unavailable dates once on mount so the inline body section is ready
  useEffect(() => {
    fetch(`/api/availability?propertyId=${property.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.unavailableDates) {
          setUnavailableDates(
            (json.data.unavailableDates as string[]).map((s) => new Date(s)),
          );
        }
      })
      .catch(() => { });
  }, [property.id]);

  // Close date picker panel on Escape key
  useEffect(() => {
    if (!showDatePicker) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDatePicker(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showDatePicker]);

  function handleRangeSelect(range: DateRange | undefined) {
    setLocalCheckIn(range?.from ?? null);
    setLocalCheckOut(range?.to ?? null);
  }

  function handleClearDates() {
    setLocalCheckIn(null);
    setLocalCheckOut(null);
  }

  function handleConfirmDates() {
    if (!localCheckIn || !localCheckOut) return;
    const ci = localDateStr(localCheckIn);
    const co = localDateStr(localCheckOut);
    router.push(
      `/property/${property.slug}?checkIn=${ci}&checkOut=${co}&guests=${guests ?? 1}`,
    );
    setShowDatePicker(false);
  }

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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container-main py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" aria-label="Voltar" className="p-2 -ml-2">
            <span className="material-symbols-outlined text-text-main">arrow_back</span>
          </a>
          <h1 className="text-[16px] font-display font-semibold text-text-main line-clamp-1">
            {property.title}
          </h1>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShareModalOpen(true)} aria-label="Partilhar" className="p-2">
            <span className="material-symbols-outlined text-text-main">share</span>
          </button>
          {/* TODO: Implement save/wishlist feature
          <button aria-label="Guardar" className="p-2">
            <span className="material-symbols-outlined text-text-main">favorite_border</span>
          </button>
          */}
        </div>
        </div>
      </header>

      <main>
        {/* ── Gallery ─────────────────────────────────────────────────────── */}
        <PropertyGallery
          images={property.images}
          propertyTitle={property.title}
        />

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="container-main pt-4 pb-1 flex items-center gap-1.5 text-[12px] text-text-muted flex-wrap">
          <a href="/" className="hover:text-primary transition-colors">GonzaloReservation</a>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <button
            onClick={() => {
              document.getElementById("host-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="hover:text-primary transition-colors"
          >
            Anfitrião: {property.owner.name ?? "Gonzalo"}
          </button>
        </div>

        {/* ── Price Banner ────────────────────────────────────────────────── */}
        {property.pricingRules.length > 0 && (() => {
          const longStay = property.pricingRules.find((r) => r.type === "LONG_STAY_DISCOUNT");
          const weekendMarkup = property.pricingRules.find((r) => r.type === "WEEKEND_MARKUP");
          if (!longStay && !weekendMarkup) return null;
          return (
            <div className="container-main py-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center">
                <span className="material-symbols-outlined text-amber-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
                <div className="flex flex-wrap gap-4 text-[13px]">
                  {longStay && (
                    <span className="text-amber-800 font-medium">
                      {longStay.isPercentage
                        ? `${longStay.value}% de desconto`
                        : `€${longStay.value} de desconto`}{" "}
                      em estadias longas (&ge;7 noites)
                    </span>
                  )}
                  {weekendMarkup && (
                    <span className="text-amber-800 font-medium">
                      Preço especial ao fim de semana
                      {weekendMarkup.isPercentage ? ` (+${weekendMarkup.value}%)` : ` (+€${weekendMarkup.value})`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Rating Row ──────────────────────────────────────────────────── */}
        {property.avgRating !== null && (
          <div className="container-main pb-2">
            <button
              onClick={() => {
                document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 bg-green-50 hover:bg-green-100 transition-colors px-4 py-2 rounded-full"
            >
              <StarRating rating={property.avgRating} size="sm" />
              <span className="text-[14px] font-bold">{property.avgRating}</span>
              <span className="text-[13px] text-text-muted">·</span>
              <span className="text-[13px] text-text-muted underline underline-offset-2">
                {property.reviewCount} avaliação{property.reviewCount !== 1 ? "ões" : ""}
              </span>
            </button>
          </div>
        )}

        {/* ── Title + Specs ───────────────────────────────────────────────── */}
        <div className="container-main pt-4 pb-2 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] leading-tight">
            {property.title}
          </h1>
          {(() => {
            const parts: string[] = []
            if (property.area) parts.push(`${property.area} m²`)
            parts.push(`${property.bedrooms} quarto${property.bedrooms !== 1 ? "s" : ""}`)
            if (property.floors) parts.push(`${property.floors} piso${property.floors !== 1 ? "s" : ""}`)
            parts.push(property.hasElevator ? "Acessível por elevador 🛗" : "Acessível por escadas 🪜")
            return (
              <p className="text-sm text-gray-500">{parts.join(" · ")}</p>
            )
          })()}
        </div>

        {/* ── Quick Info Cards ────────────────────────────────────────────── */}
        {(() => {
          const servicesList = parseJsonArray(property.services)
          const sofaService = servicesList.find(
            (s) => s.toLowerCase().includes("sofá") || s.toLowerCase().includes("sofa")
          )

          // Beds cards
          const bedCards: { label: string; value: string }[] = []
          if (property.hasRooms && property.rooms.length > 0) {
            for (const room of property.rooms) {
              const beds = parseJsonArray(room.bedsList)
              if (beds.length > 0) {
                bedCards.push({ label: room.name, value: formatBedsList(beds) })
              }
            }
          } else {
            const beds = parseJsonArray(property.bedsConfig)
            if (beds.length > 0) {
              bedCards.push({ label: "Camas", value: formatBedsList(beds) })
            }
          }

          // Bathroom cards
          const bathroomCards: { label: string; value: string }[] = []
          if (property.hasRooms && property.rooms.length > 0) {
            property.rooms.forEach((room, i) => {
              if (room.bathroomType) {
                const typeLabel =
                  room.bathroomType === "private" ? "privada" :
                  room.bathroomType === "shared" ? "partilhada" :
                  room.bathroomType
                bathroomCards.push({
                  label: `Casa de banho${bathroomCards.length > 0 ? ` ${i + 1}` : ""}`,
                  value: `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} (${room.name})`,
                })
              }
            })
          } else if (property.bathroomType) {
            const typeLabel =
              property.bathroomType === "private" ? "privada" :
              property.bathroomType === "shared" ? "partilhada" :
              property.bathroomType
            bathroomCards.push({
              label: "Casa de banho",
              value: `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}`,
            })
          }

          const cards = [
            // 1. Arrival type
            ...(property.arrivalType ? [{
              icon: <DoorOpen size={20} className="text-primary shrink-0" />,
              label: "Chegada",
              value: property.arrivalType === "autonomous"
                ? "Chegada autónoma"
                : property.arrivalType === "guided"
                ? "Chegada acompanhada"
                : property.arrivalType,
            }] : []),
            // 2. Max guests (always)
            {
              icon: <Users size={20} className="text-primary shrink-0" />,
              label: "Hóspedes",
              value: `Máximo ${property.maxGuests} hóspede${property.maxGuests !== 1 ? "s" : ""}`,
            },
            // 3. Towels (always)
            {
              icon: <Shirt size={20} className="text-primary shrink-0" />,
              label: "Roupa de cama e banho",
              value: property.towelsIncluded ? "Toalhas e lençóis incluídos ✓" : "Não incluídos",
            },
            // 4. Sofa (only if found in services)
            ...(sofaService ? [{
              icon: <Sofa size={20} className="text-primary shrink-0" />,
              label: "Sala de estar",
              value: sofaService,
            }] : []),
            // 5. Beds (per room or property)
            ...bedCards.map(({ label, value }) => ({
              icon: <Bed size={20} className="text-primary shrink-0" />,
              label,
              value,
            })),
            // 6. Bathrooms
            ...bathroomCards.map(({ label, value }) => ({
              icon: <Bath size={20} className="text-primary shrink-0" />,
              label,
              value,
            })),
            // 7. Pets (always)
            {
              icon: <PawPrint size={20} className="text-primary shrink-0" />,
              label: "Animais de estimação",
              value: property.petsAllowed ? "Permitidos ✓" : "Não permitidos",
            },
            // 8. Children (always)
            {
              icon: <Baby size={20} className="text-primary shrink-0" />,
              label: "Crianças",
              value: property.childrenAllowed ? "Bem-vindas ✓" : "Não recomendado",
            },
          ]

          return (
            <section className="container-main py-4">
              <h2 className="text-lg font-semibold mb-4">Informação rápida</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-3 items-start"
                  >
                    {card.icon}
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 leading-tight mb-0.5">
                        {card.label}
                      </p>
                      <p className="text-[13px] text-gray-700 leading-snug">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}

        <hr className="mx-4 border-surface" />

        {/* ── Property Info ────────────────────────────────────────────────── */}
        <section className="container-main py-6 space-y-4">
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
                  <StarRating rating={property.avgRating} size="sm" />
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
        <section id="host-section" className="container-main py-8 space-y-6">
          <h2 className="text-[20px] font-display font-bold text-[#1a1a2e]">Gerido por</h2>
          
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Owner Info Card */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden bg-[#8b1a1a] flex items-center justify-center">
                {property.owner.image ? (
                  <Image
                    src={property.owner.image}
                    alt={property.owner.name || "Owner"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl uppercase">
                    {getInitials(property.owner.name)}
                  </span>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-[17px] font-bold text-[#1a1a2e] truncate">
                  {property.owner.name || "Gonzalo Rodríguez"}
                </p>
                <div className="space-y-0.5">
                  <p className="text-[13px] text-gray-500">
                    Anfitrião desde {new Date(property.owner.createdAt).getFullYear()}
                  </p>
                  {property.licenseNumber && (
                    <p className="text-[13px] text-gray-500">
                      Licença AL: {property.licenseNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Button */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className={`text-[14px] text-gray-600 leading-relaxed ${!hostDescExpanded ? "line-clamp-3" : ""}`}>
                  {property.hostDescription || "O anfitrião está disponível para responder às suas questões sempre que necessário."}
                </div>
                {property.hostDescription && property.hostDescription.length > 150 && (
                  <button 
                    onClick={() => setHostDescExpanded(!hostDescExpanded)}
                    className="text-[13px] font-bold text-primary hover:underline"
                  >
                    {hostDescExpanded ? "Ver menos" : "Ver mais"}
                  </button>
                )}
              </div>

              <button 
                onClick={() => window.Tawk_API?.toggle?.()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#8b1a1a] text-[#8b1a1a] font-bold hover:bg-[#8b1a1a]/5 transition-all text-sm"
              >
                💬 Enviar mensagem
              </button>
            </div>
          </div>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Description ─────────────────────────────────────────────────── */}
        <section className="container-main py-6 space-y-3">
          <h3 className="text-[18px] font-display font-bold">Sobre este alojamento</h3>
          <p className="text-[14px] text-text-muted leading-relaxed whitespace-pre-line">
            {property.description}
          </p>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Services & Amenities ────────────────────────────────────────── */}
        {(() => {
          const includedServicesSet = new Set([
            ...parseJsonArray(property.services),
            ...property.amenities
              .map((a) => AMENITY_TO_SERVICE_KEY[a.amenity.name])
              .filter(Boolean),
          ]);

          const allServices = Object.entries(PROPERTY_SERVICES).flatMap(([catKey, cat]) =>
            cat.services.map((s) => ({ ...s, catKey, catLabel: cat.label.pt }))
          );

          const displayedServices = showAllServices ? allServices : allServices.slice(0, 12);

          // Group displayedServices by catKey
          const groupedServices: Record<string, { label: string; services: typeof allServices }> = {};
          displayedServices.forEach((s) => {
            if (!groupedServices[s.catKey]) {
              groupedServices[s.catKey] = { label: s.catLabel, services: [] };
            }
            groupedServices[s.catKey].services.push(s);
          });

          return (
            <>
              <section id="amenities-section" className="container-main py-8 space-y-6">
                <h3 className="text-[18px] font-display font-bold text-[#1a1a2e]">
                  O que este espaço oferece
                </h3>

                <div className="space-y-8">
                  {Object.entries(groupedServices).map(([catKey, cat]) => (
                    <div key={catKey} className="space-y-4">
                      <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                        {cat.label}
                      </h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                        {cat.services.map((service) => {
                          const isIncluded = includedServicesSet.has(service.key);
                          return (
                            <div
                              key={service.key}
                              className="flex items-center gap-3 transition-all duration-200"
                            >
                              {isIncluded ? (
                                <Check size={20} className="text-green-600 shrink-0" />
                              ) : (
                                <X size={20} className="text-gray-300 shrink-0" />
                              )}
                              <span className={`text-[15px] ${isIncluded
                                  ? "text-gray-800"
                                  : "text-gray-300 line-through decoration-gray-300/50"
                                }`}>
                                {service.label.pt}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {allServices.length > 12 && (
                  <button
                    onClick={() => setShowAllServices(!showAllServices)}
                    className="mt-6 flex items-center gap-2 px-6 py-3 border border-[#1a1a2e]/10 rounded-xl text-[14px] font-bold text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-all"
                  >
                    {showAllServices ? (
                      <>
                        Ver menos
                        <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
                      </>
                    ) : (
                      <>
                        Ver todos os {allServices.length} serviços
                        <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                      </>
                    )}
                  </button>
                )}
              </section>
              <hr className="mx-4 border-surface" />
            </>
          );
        })()}

        {/* ── Reviews Redesign ────────────────────────────────────────────── */}
        <section id="reviews-section" className="container-main py-10 space-y-8">
          {property.reviews.length > 0 ? (
            <>
              {/* Header Grid */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-[#1a1a2e]">
                      {property.avgRating?.toFixed(1)}
                    </span>
                    <div className="space-y-0.5">
                      <StarRating rating={property.avgRating ?? 0} size="md" />
                      <p className="text-[14px] font-medium text-text-muted">
                        {property.reviewCount} avaliações
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 flex-1 max-w-xl">
                  {[
                    { label: "Limpeza", rating: property.avgRating ?? 0 },
                    { label: "Localização", rating: (property.avgRating ?? 0) * 0.95 },
                    { label: "Comunicação", rating: Math.min(5, (property.avgRating ?? 0) * 1.02) },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between gap-4">
                      <span className="text-[13px] text-gray-600 font-medium">{cat.label}</span>
                      <div className="flex items-center gap-2">
                        <StarRating rating={cat.rating} size="sm" />
                        <span className="text-[12px] font-bold w-6">{cat.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(reviewsExpanded ? property.reviews : property.reviews.slice(0, 6)).map((r, idx) => (
                  <div key={r.id} className="space-y-4 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                          style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                        >
                          {getInitials(r.guestName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[14px] text-[#1a1a2e] truncate flex items-center gap-2">
                            {r.guestName}
                            {r.source && r.source !== "WEBSITE" && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${SOURCE_CLASSES[r.source] ?? ""}`}>
                                {SOURCE_LABELS[r.source] ?? r.source}
                              </span>
                            )}
                          </p>
                          <p className="text-[12px] text-text-muted">
                            {format(new Date(r.createdAt), 'MMMM yyyy', { locale: pt })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} size="sm" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[14px] text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-line">
                        "{r.comment}"
                      </p>
                    </div>

                    {r.ownerReply && (
                      <div className="mt-4 pl-4 border-l-2 border-[#8b1a1a] space-y-2 bg-white/50 p-3 rounded-r-xl">
                        <div className="flex items-center gap-2 text-primary">
                          <MessageSquare size={14} />
                          <span className="text-[12px] font-bold uppercase tracking-wider">Resposta do anfitrião:</span>
                        </div>
                        <p className="text-[13px] text-gray-600 italic">
                          "{r.ownerReply}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {property.reviews.length > 6 && (
                <button
                  onClick={() => setReviewsExpanded(!reviewsExpanded)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#8b1a1a] rounded-xl text-[15px] font-bold text-[#8b1a1a] hover:bg-[#8b1a1a]/5 transition-all"
                >
                  {reviewsExpanded ? (
                    <>Ver menos ▲</>
                  ) : (
                    <>Ver todas as {property.reviewCount} avaliações ▼</>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Star size={32} className="text-amber-400" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-[#1a1a2e]">Ainda sem avaliações</p>
                <p className="text-sm text-gray-500">Seja o primeiro a avaliar esta estadia!</p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center pt-4 italic">
            As avaliações são recolhidas automaticamente após o check-out. Apenas hóspedes verificados podem avaliar.
          </p>
        </section>
        <hr className="mx-4 border-surface" />

        {/* ── House Rules FAQ ──────────────────────────────────────────────── */}
        <section className="container-main py-8 space-y-6">
          <h2 className="text-[20px] font-display font-bold text-[#1a1a2e]">Regras da casa</h2>
          
          <div className="border-t border-gray-100">
            <AccordionItem
              title="Chegada"
              icon={DoorOpen}
              isOpen={openFaq === "chegada"}
              onClick={() => setOpenFaq(openFaq === "chegada" ? null : "chegada")}
            >
              <div className="space-y-2 pt-2">
                <p>• Check-in: a partir das <b>{property.checkInTime}</b></p>
                <p>• Check-out: até às <b>{property.checkOutTime}</b></p>
                {property.securityDeposit > 0 && (
                  <p>• Depósito de segurança: <b>€{property.securityDeposit}</b> (devolvido após o check-out)</p>
                )}
                {property.parkingInfo && <p>• Estacionamento: {property.parkingInfo}</p>}
                {property.extraServices && <p>• Serviços extra: {property.extraServices}</p>}
                <p>• Animais de estimação: {property.petsAllowed ? "Permitidos ✓" : "Não permitidos ✗"}</p>
                <p>• Crianças: {property.childrenAllowed ? "Bem-vindas ✓" : "Não recomendado ✗"}</p>
              </div>
            </AccordionItem>

            <AccordionItem
              title="Política de cancelamento"
              icon={CalendarX}
              isOpen={openFaq === "cancellation"}
              onClick={() => setOpenFaq(openFaq === "cancellation" ? null : "cancellation")}
            >
              <div className="space-y-3 pt-2">
                <p className="font-medium">
                  {property.cancellationPolicy === "FLEXIBLE" && "Política Flexível"}
                  {property.cancellationPolicy === "MODERATE" && "Política Moderada"}
                  {property.cancellationPolicy === "STRICT" && "Política Estrita"}
                </p>
                <p>
                  {property.cancellationPolicy === "FLEXIBLE" && "Cancelamento gratuito até 24 horas antes da llegada. Após esse prazo, será cobrada 1 noite."}
                  {property.cancellationPolicy === "MODERATE" && "Cancelamento gratuito até 5 dias antes da llegada. Após esse prazo, reembolso de 50% do valor total."}
                  {property.cancellationPolicy === "STRICT" && "Sem reembolso após a confirmação da reserva. Em casos excecionais, contacte o anfitrião."}
                </p>
                {property.cancellationDays !== null && property.cancellationDays > 0 && (
                  <p className="text-primary font-semibold">
                    Cancelamento gratuito até {property.cancellationDays} dias antes da chegada.
                  </p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem
              title="Normas"
              icon={ScrollText}
              isOpen={openFaq === "normas"}
              onClick={() => setOpenFaq(openFaq === "normas" ? null : "normas")}
            >
              <div className="space-y-3 pt-2">
                <p>{property.smokingAllowed ? "🚬 Permitido fumar" : "🚭 Proibido fumar"}</p>
                <p>{property.petsAllowed ? "🐾 Animais permitidos" : "🚫 Animais não permitidos"}</p>
                <p>{property.childrenAllowed ? "👶 Crianças bem-vindas" : "🔞 Não recomendado para crianças"}</p>
                {property.houseRules && (
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <p className="font-semibold mb-1">Regras adicionais:</p>
                    <p className="whitespace-pre-line">{property.houseRules}</p>
                  </div>
                )}
              </div>
            </AccordionItem>

            <AccordionItem
              title="Acerca de"
              icon={Info}
              isOpen={openFaq === "about"}
              onClick={() => setOpenFaq(openFaq === "about" ? null : "about")}
            >
              <div className="pt-2 whitespace-pre-line">
                {property.description || "Sem descrição disponível."}
              </div>
            </AccordionItem>

            <AccordionItem
              title="Espaço"
              icon={Home}
              isOpen={openFaq === "space"}
              onClick={() => setOpenFaq(openFaq === "space" ? null : "space")}
            >
              <div className="space-y-3 pt-2">
                {property.spaceDescription ? (
                  <div className="whitespace-pre-line">{property.spaceDescription}</div>
                ) : (
                  <p>
                    Este espaço tem capacidade para {property.maxGuests} hóspede(s), com {property.bedrooms} quarto(s) e {property.bathrooms} casa(s) de banho.
                    {property.area && ` Área total de ${property.area} m².`}
                    {property.floors && ` ${property.floors} piso(s).`}
                    {property.hasElevator && " Acessível por elevador."}
                  </p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem
              title="Acesso"
              icon={Key}
              isOpen={openFaq === "access"}
              onClick={() => setOpenFaq(openFaq === "access" ? null : "access")}
            >
              <div className="space-y-3 pt-2">
                <p>
                  {property.arrivalType === 'autonomous' 
                    ? "Chegada autónoma — receberá todas as instruções de acesso após a confirmação da reserva."
                    : property.arrivalType === 'guided'
                    ? "Chegada acompanhada — o anfitrião irá recebê-lo pessoalmente."
                    : "Informação de acesso disponível após reserva."}
                </p>
                {property.accessInfo && <p className="pt-2 border-t border-gray-100">{property.accessInfo}</p>}
              </div>
            </AccordionItem>

            <AccordionItem
              title="Interação"
              icon={MessageCircle}
              isOpen={openFaq === "interaction"}
              onClick={() => setOpenFaq(openFaq === "interaction" ? null : "interaction")}
            >
              <div className="pt-2">
                {property.interactionInfo || "O anfitrião está sempre disponível para responder às suas questões. Para uma resposta mais rápida, utilize o sistema de mensagens da plataforma clicando no botão de chat no canto inferior derecho."}
              </div>
            </AccordionItem>

            {property.additionalInfo && (
              <AccordionItem
                title="Informação adicional"
                icon={FileText}
                isOpen={openFaq === "additional"}
                onClick={() => setOpenFaq(openFaq === "additional" ? null : "additional")}
              >
                <div className="pt-2 whitespace-pre-line">{property.additionalInfo}</div>
              </AccordionItem>
            )}
          </div>
        </section>

        <hr className="mx-4 border-surface" />

        {/* ── Room Selector (if applicable) ────────────────────────────────── */}
        {property.hasRooms && property.rooms.length > 0 && (
          <>
            <section id="room-selector" className="py-8 bg-slate-50">
              <div className="container-main space-y-6">
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
            </div>
          </section>
            <hr className="mx-4 border-surface" />
          </>
        )}

        {/* ── Location ─────────────────────────────────────────────────────── */}
        <section className="container-main py-6 space-y-2">
          <h3 className="text-[18px] font-display font-bold">Localização</h3>
          <p className="text-[13px] text-text-muted mb-4">
            {property.city}, {property.country}
          </p>
          {property.lat && property.lng ? (
            <PropertyMapWrapper
              lat={property.lat}
              lng={property.lng}
              propertyTitle={property.title}
              radius={300}
            />
          ) : (
            <div className="h-[200px] bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <p className="text-[14px]">Localização não disponível</p>
            </div>
          )}
        </section>
      </main>

      {/* ── Sticky Booking Bar ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface shadow-[0_-4px_20px_rgba(26,26,46,0.08)]">
        <div className="container-main py-3">
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
              onClick={() => setShowDatePicker(true)}
              className="shrink-0 bg-primary hover:bg-primary/90 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all text-[14px]"
            >
              Verificar disponibilidade
            </button>
          )}
        </div>
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

      {/* ── Date Picker Panel ────────────────────────────────────────────────── */}
      {showDatePicker && (
        <DatePickerPanel
          localCheckIn={localCheckIn}
          localCheckOut={localCheckOut}
          unavailableDates={unavailableDates}
          onSelect={handleRangeSelect}
          onConfirm={handleConfirmDates}
          onClear={handleClearDates}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* ── Share Modal ──────────────────────────────────────────────────────── */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        propertyTitle={property.title}
        propertyUrl={propertyUrl}
      />
    </div>
  );
}
