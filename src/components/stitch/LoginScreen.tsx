'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginScreen() {
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
    setGoogleLoading(false)
  }
  return (
    <div className="bg-white text-text-main antialiased min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between">
        <span className="font-display font-bold text-xl tracking-tight">
          ReservationGonzalo
        </span>
        <button className="flex items-center gap-2 border border-gray-200 rounded-full py-1.5 px-3 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-xl">menu</span>
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_circle
          </span>
        </button>
      </header>

      <main className="min-h-screen pt-16 flex flex-col md:flex-row">
        {/* Left: Benefits Panel */}
        <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-surface p-12 items-center justify-center">
          <div className="absolute inset-0 z-0">
            <img
              alt="Luxury property interior"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5BJ29ReJymoGJD4GLMUS06ilJ9XHqehSRU4Z4hdd_1ONhmaYtS0RyxqeEuHu88TKUx4oOL0RfFDL0Heok7OTTuMv8fYIxx-4ZbwUG7HTlII13WGTYV6Kdq1gQ9rDMaCZq27okb3Ms4GNxl1sz9-Cde9noohS_P_XdGlNvysyUIiAu-pFqmoZWvSO8-vSgwIhLsM6TME2n3gTc7a4nKDuk00MykrRRo-Ah9mtVKgSKmFUG57aJ4o6a7R30CZIdyXl-fK7S6avcfRuk"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="relative z-10 max-w-lg">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-xl shadow-2xl">
              <h2 className="font-display text-3xl font-bold mb-6">
                Tu estancia perfecta comienza aquí.
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    icon: "check_circle",
                    title: "Resumo de todas tus reservas",
                    desc: "Gestiona tus fechas y alojamientos en un solo lugar.",
                  },
                  {
                    icon: "support_agent",
                    title: "Soporte 24/7",
                    desc: "Estamos aquí para ayudarte en cada paso de tu viaje.",
                  },
                  {
                    icon: "key",
                    title: "Check-in simplificado",
                    desc: "Accede a las instrucciones de entrada al instante.",
                  },
                ].map((item) => (
                  <li key={item.icon} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary mt-1">
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-lg">{item.title}</p>
                      <p className="text-text-muted text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Right: Login Form */}
        <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">
          <div className="max-w-md w-full mx-auto">
            <h1 className="font-display text-2xl font-semibold mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-text-muted mb-8">
              Inicia sesión para gestionar tus estancias.
            </p>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button className="flex-1 pb-3 text-sm font-medium border-b-2 border-primary text-text-main">
                Correo electrónico
              </button>
              <button className="flex-1 pb-3 text-sm font-medium border-b-2 border-transparent text-text-muted hover:text-text-main transition-colors">
                ID de reserva
              </button>
            </div>

            {/* Form */}
            <form className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1 px-1"
                  htmlFor="login-email"
                >
                  Correo electrónico
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                  id="login-email"
                  placeholder="nombre@ejemplo.com"
                  type="email"
                />
              </div>
              <button
                className="w-full bg-primary text-white font-semibold py-3.5 rounded-lg hover:bg-primary/80 transition-colors shadow-lg mt-2"
                type="submit"
              >
                Continuar con correo electrónico
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-text-muted uppercase tracking-widest">
                ou
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Sign In */}
            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-3 rounded-lg text-sm font-medium text-text-main hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {/* Google SVG icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {googleLoading ? 'A redirecionar...' : 'Continuar com Google'}
              </button>
            </div>

            <p className="mt-10 text-center text-sm text-text-muted">
              ¿No tienes una cuenta?{" "}
              <a
                className="text-text-main font-semibold hover:underline"
                href="#"
              >
                Regístrate
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-gray-200 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-text-muted">
            © 2026 ReservationGonzalo. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {["Privacy", "Terms", "Support", "About"].map((link) => (
              <a
                key={link}
                className="text-sm text-text-muted hover:text-text-main transition-colors"
                href="#"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
