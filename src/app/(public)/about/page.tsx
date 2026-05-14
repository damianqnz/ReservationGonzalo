import type { Metadata } from 'next'
import Navbar from '@/shared/components/layout/Navbar'
import Footer from '@/shared/components/layout/Footer'
import AboutUs from '@/shared/components/marketing/AboutUs'

// ── SEO metadata ──────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Sobre mim — ReservationGonzalo | Alojamento Local em Cascais',
  description:
    'Sou o Gonzalo, anfitrião da tua próxima estadia em Cascais, Portugal. Reserva diretamente comigo — sem comissões, sem intermediários, com atenção personalizada.',
  keywords: [
    'alojamento local Cascais',
    'aluguer temporário Cascais',
    'reserva direta Portugal',
    'short-term rental Cascais',
    'férias Lisboa alojamento',
    'casa férias Cascais',
    'Alojamento Local Lisboa',
    'Gonzalo anfitrião Cascais',
  ],
  alternates: {
    canonical: 'https://reservationgonzalo.pt/about', // TODO: Replace with production URL
  },
  openGraph: {
    title: 'Sobre mim — ReservationGonzalo | Alojamento Local em Cascais',
    description:
      'Sou o Gonzalo, anfitrião da tua próxima estadia em Cascais. Reserva diretamente comigo — sem comissões, com atenção personalizada.',
    url: 'https://reservationgonzalo.pt/about', // TODO: Replace with production URL
    siteName: 'ReservationGonzalo',
    type: 'website',
    locale: 'pt_PT',
    images: [
      {
        url: 'https://reservationgonzalo.pt/images/balcon3.jpgs', // TODO: Replace with real OG image (1200x630)
        width: 1200,
        height: 630,
        alt: 'Casa de Gonzalo em Cascais — Alojamento Local com reserva direta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre mim — ReservationGonzalo',
    description:
      'Alojamento local em Cascais. Reserva diretamente com o Gonzalo — sem comissões.',
  },
  other: {
    'geo.region': 'PT-11',
    'geo.placename': 'Cascais',
    'geo.position': '38.6979;-9.4215', // TODO: Replace with exact property coordinates
    ICBM: '38.6979, -9.4215', // TODO: Replace with exact property coordinates
  },
}

// ── Schema.org JSON-LD — LodgingBusiness ─────────────────────────────────
// Safe server-generated data — not user content, dangerouslySetInnerHTML is intentional here

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'ReservationGonzalo',
  description:
    'Alojamento local em Cascais, Portugal. Casa tradicional portuguesa com piscina, jardim e terraço. Reserva direta com o anfitrião Gonzalo.',
  url: 'https://reservationgonzalo.pt', // TODO: Replace with production URL
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Cascais',
    addressRegion: 'Lisboa',
    addressCountry: 'PT',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 38.6979, // TODO: Replace with exact property coordinates
    longitude: -9.4215, // TODO: Replace with exact property coordinates
  },
  image: 'https://reservationgonzalo.pt/images/og-about.jpg', // TODO: Replace with real hero image URL
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Credit Card',
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Piscina exterior', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'WiFi alta velocidade', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Terraço exterior', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Jardim privado', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Área de BBQ', value: true },
  ],
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- safe: hardcoded server-side JSON-LD, not user content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <div className="pt-20">
        <AboutUs />
      </div>
      <Footer />
    </>
  )
}
