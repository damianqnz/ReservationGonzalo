export default function CheckoutPayment() {
  return (
    <div className="bg-white text-text-main antialiased">
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold tracking-tight font-display">ReservationGonzalo</span>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-primary">PT</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="font-bold text-text-main">EN</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-primary">ES</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-10">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 hover:bg-surface">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h1 className="text-3xl font-bold font-display">Confirmar y pagar</h1>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-12">
            <TimerBanner />
            <GuestDetailsStep />
            <hr className="border-gray-100" />
            <PaymentDetailsStep />
            <hr className="border-gray-100" />
            <PoliciesAndCta />
          </div>
          {/* Right Column */}
          <div className="lg:col-span-5">
            <SummaryCard />
          </div>
        </div>
      </main>
    </div>
  );
}

function TimerBanner() {
  return (
    <div className="flex items-center gap-3 bg-accent text-white px-5 py-3.5 rounded-lg shadow-sm">
      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
      <p className="text-[15px] font-medium tracking-wide">Tienes 14:51 minutos para completar la reserva</p>
    </div>
  );
}

function GuestDetailsStep() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-text-main text-white text-sm font-bold">1</span>
        <h2 className="text-xl font-semibold font-display">Añadir detalles del huésped</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <InputField label="Nombre" placeholder="Ej. Juan" />
        <InputField label="Apellidos" placeholder="Ej. García" />
        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-700">Número de teléfono</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+34</span>
            <input className="w-full rounded-2xl border-gray-200 py-3 pl-12 pr-4 focus:border-primary focus:ring-primary" placeholder="600 000 000" type="tel" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentDetailsStep() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-text-main text-white text-sm font-bold">2</span>
        <h2 className="text-xl font-semibold font-display">Añadir detalles del pago</h2>
      </div>
      <div className="space-y-6">
        <InputField label="Correo electrónico" placeholder="tu@email.com" type="email" />
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Número de tarjeta</label>
          <div className="relative">
            <input className="w-full rounded-2xl border-gray-200 py-3 pl-4 pr-12 focus:border-primary focus:ring-primary" placeholder="0000 0000 0000 0000" />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">credit_card</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <InputField label="Caducidad" placeholder="MM / AA" />
          <InputField label="CVC" placeholder="123" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">País o región</label>
          <select className="w-full rounded-2xl border-gray-200 py-3 px-4 focus:border-primary focus:ring-primary bg-white appearance-none">
            <option>España</option><option>México</option><option>Argentina</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function PoliciesAndCta() {
  return (
    <section className="space-y-8">
      <div className="flex items-start gap-3">
        <input className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" id="terms" type="checkbox" />
        <label className="text-sm text-gray-600 leading-relaxed" htmlFor="terms">
          He leído y acepto los <a className="font-semibold text-text-main underline" href="#">términos y condiciones</a>, la <a className="font-semibold text-text-main underline" href="#">política de privacidad</a> y las reglas de la casa.
        </label>
      </div>
      <button className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-xl shadow-primary/20 hover:bg-primary/80 transition-all hover:scale-[1.01] active:scale-[0.99]">
        Confirmar y pagar
      </button>
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <span className="material-symbols-outlined text-sm">lock</span>
        <span>Pago seguro encriptado de 256 bits</span>
      </div>
    </section>
  );
}

function SummaryCard() {
  return (
    <div className="sticky top-32 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl shadow-gray-200/50">
      <div className="flex gap-4 mb-8">
        <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface" />
        <div className="flex flex-col justify-between py-1">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Apartamento entero</span>
            <h3 className="text-lg font-bold font-display leading-tight mt-1">Lindo piso en zona Hortaleza - Madrid</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
            <span className="text-sm font-bold">4.92</span>
            <span className="text-sm text-gray-500">(128 reseñas)</span>
          </div>
        </div>
      </div>
      <hr className="border-gray-100 my-6" />
      <div className="space-y-4 mb-8">
        <SummaryRow icon="calendar_today" label="Fechas" value="13 abr / 19 abr 2026" />
        <SummaryRow icon="group" label="Huéspedes" value="6 noches, 2 adultos" />
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-bold">Detalle del precio</h4>
        <div className="space-y-3">
          <PriceLine label="120€ x 6 noches" value="720€" />
          <PriceLine label="Gastos de limpieza" value="45€" underline />
          <div className="flex justify-between font-bold pt-3 border-t border-gray-100 text-lg">
            <span>Total (EUR)</span><span>765€</span>
          </div>
        </div>
      </div>
      <button className="mt-6 text-sm font-bold underline decoration-primary underline-offset-4">¿Tienes un código promocional?</button>
      <div className="mt-8 flex items-center gap-3 rounded-xl bg-green-50 p-4 border border-green-100">
        <span className="material-symbols-outlined text-green-600">verified</span>
        <div>
          <p className="text-sm font-bold text-green-800">Cancelamento gratuito</p>
          <p className="text-xs text-green-700">Hasta el 10 de abr. de 2026</p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input className="w-full rounded-2xl border-gray-200 py-3 px-4 focus:border-primary focus:ring-primary" placeholder={placeholder} type={type} />
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

function PriceLine({ label, value, underline }: { label: string; value: string; underline?: boolean }) {
  return (
    <div className="flex justify-between text-sm text-gray-600">
      <span className={underline ? "underline cursor-help" : ""}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
