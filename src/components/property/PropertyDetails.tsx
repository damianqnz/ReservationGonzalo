"use client";

import { useState } from "react";

const galleryImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCoXdaAUAYRCRydVwDXyaY-8xehZKNZbHysDV2cumSp4mR2AGOsoYhRJQaKa6c3jYPgMf11xgfZSXgTvoDPTnzDMraePrwN0yRmsKqm6f_tynxKZOAlpbs4wCke92g1MuZrwiUfGk4P7D-MkodIkqKXZj6UpKOo91PpD9_KZUXcQKvC2euf3TkG7yqsqmmFqMJo1P6rHts9DAvlC1TEpgUJKtgJEUPWjqS5rRM51GW7UpOOqk9W19KvqFAWlfgxS9XS9TvPrJOCyrt6",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAA6WQJ_Kv4nBj-dmyXEo405icr50_zIY9t7Z1Ii93szisirAT-A_76xoclb5lL5hbtLO55AGqEZ5e0bXjJqLRW6cpAsgAh-JZsVgBRWmFZQqi_thGSDIIjntqz16Pg2vOocz5l4hcgHairqGwB29bc0mtExscM4G2ErnFbWxZ1OAEtC74I2N3loVhlvoO6Si24CXH0eNsvIF5ds3lSuFNX3lk54TjzfrK3N7au4d8I1TuLLtnTNMsNmOrXzlNWNr4GZjSsTrEQ4GS-",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCtyr2RzaWhlyIdeDFWAFV0cGj3CW6xo11qcaVgSNbRfubBoynHUMNA6bXZOuu3MDo5UvR5WMI34q3eh0mRtmEMO8aGqToX68o6yMzdBIovB5BuFVh0sOsssAG0z1NItL-X4z6cA8Pb0N7268awtxv90rrKYX6McnEB0wCXNqVoXXw7HtOMuTmAaNE5n-d_aLp9Cs2BQVAuqWUQcpGcBvBLgjz6mXoWdPOfNA6zMJSiNU42W7eyM8WOHYhmOJeipRMv4xVpgQ1zqvy4",
];

const amenities = [
  { icon: "wifi", label: "WiFi de alta velocidad" },
  { icon: "kitchen", label: "Cocina equipada" },
  { icon: "local_laundry_service", label: "Lavadora" },
  { icon: "ac_unit", label: "Aire acondicionado" },
  { icon: "tv", label: "Smart TV 55\"" },
  { icon: "iron", label: "Plancha" },
  { icon: "local_parking", label: "Parking privado" },
  { icon: "balcony", label: "Balcón con vistas" },
];

const houseRules = [
  { icon: "schedule", label: "Check-in: 15:00 – 22:00" },
  { icon: "logout", label: "Check-out: antes de las 11:00" },
  { icon: "smoke_free", label: "No fumar" },
  { icon: "pets", label: "No se admiten mascotas" },
  { icon: "volume_off", label: "No fiestas ni eventos" },
];

const reviews = [
  { author: "María L.", date: "Marzo 2026", rating: 5, text: "Apartamento increíble, muy limpio y bien ubicado. Gonzalo fue un anfitrión excepcional." },
  { author: "James K.", date: "Febrero 2026", rating: 5, text: "Perfect location, beautiful apartment. Would definitely stay again!" },
  { author: "Sophie D.", date: "Enero 2026", rating: 4, text: "Très bel appartement, bien équipé. Quartier calme et agréable." },
];

export default function PropertyDetails() {
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="bg-background text-text-main antialiased pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <button aria-label="Voltar" className="p-2 -ml-2">
            <span className="material-symbols-outlined text-navy">arrow_back</span>
          </button>
          <h1 className="text-lg font-display text-navy font-semibold">Detalhes da Propriedade</h1>
        </div>
        <div className="flex space-x-2">
          <button aria-label="Partilhar" className="p-2">
            <span className="material-symbols-outlined text-navy">share</span>
          </button>
          <button aria-label="Guardar" className="p-2">
            <span className="material-symbols-outlined text-navy">favorite_border</span>
          </button>
        </div>
      </header>

      <main>
        {/* Hero Image Gallery */}
        <section className="relative">
          <div className="w-full aspect-[4/3] overflow-hidden">
            <img
              alt="Vista principal do apartamento"
              className="w-full h-full object-cover transition-all duration-500"
              src={galleryImages[activeImg]}
            />
          </div>
          {/* Thumbnails */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? "border-white shadow-lg scale-110" : "border-transparent opacity-70"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {/* Photo count badge */}
          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <span>{activeImg + 1}/{galleryImages.length}</span>
          </div>
        </section>

        {/* Property Info */}
        <section className="px-4 py-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Apartamento entero</p>
              <h2 className="text-2xl font-display font-bold leading-tight">
                Lindo piso en zona Hortaleza
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>Hortaleza, Madrid, España</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
              <span className="text-sm font-bold">4.92</span>
            </div>
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {["4 huéspedes", "2 habitaciones", "2 camas", "1 baño"].map(tag => (
              <span key={tag} className="bg-surface text-sm font-medium px-3 py-1.5 rounded-full text-gray-700">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <hr className="mx-4 border-gray-100" />

        {/* Host */}
        <section className="px-4 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">person</span>
          </div>
          <div>
            <p className="font-semibold text-lg">Anfitrión: Gonzalo</p>
            <p className="text-sm text-gray-500">Superanfitrión · 3 años de experiencia</p>
          </div>
          <button className="ml-auto border border-gray-200 rounded-full px-4 py-2 text-sm font-medium hover:bg-surface transition-colors">
            Contactar
          </button>
        </section>

        <hr className="mx-4 border-gray-100" />

        {/* Description */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-xl font-display font-bold">Sobre este alojamiento</h3>
          <p className="text-gray-600 leading-relaxed">
            Disfruta de un amplio y luminoso apartamento en el corazón de Hortaleza. 
            Perfectamente equipado para familias y parejas, con acceso directo al transporte 
            público y a pocos minutos del centro de Madrid. Decoración moderna y todas las 
            comodidades necesarias para una estancia inolvidable.
          </p>
        </section>

        <hr className="mx-4 border-gray-100" />

        {/* Amenities */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-xl font-display font-bold">Qué ofrece este espacio</h3>
          <div className="grid grid-cols-2 gap-4">
            {amenities.map(a => (
              <div key={a.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                <span className="material-symbols-outlined text-primary">{a.icon}</span>
                <span className="text-sm font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </section>

        <hr className="mx-4 border-gray-100" />

        {/* Reviews */}
        <section className="px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold">Reseñas</h3>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
              <span className="font-bold">4.92</span>
              <span className="text-gray-500 text-sm">(128)</span>
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.author} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400">person</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.author}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="mx-4 border-gray-100" />

        {/* House Rules */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-xl font-display font-bold">Reglas de la casa</h3>
          <div className="space-y-3">
            {houseRules.map(rule => (
              <div key={rule.label} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-500">{rule.icon}</span>
                <span className="text-sm">{rule.label}</span>
              </div>
            ))}
          </div>
        </section>

        <hr className="mx-4 border-gray-100" />

        {/* Location */}
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-xl font-display font-bold">Ubicación</h3>
          <div className="bg-surface rounded-2xl h-48 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <span className="material-symbols-outlined text-4xl">map</span>
              <p className="text-sm mt-2">Hortaleza, Madrid</p>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold">120€</span>
              <span className="text-sm text-gray-500 font-medium">/ noche</span>
            </div>
            <p className="text-xs text-gray-400">13 - 19 abr · 2 huéspedes</p>
          </div>
          <button className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all">
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}
