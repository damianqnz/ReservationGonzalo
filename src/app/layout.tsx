import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const outfit = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ReservationGonzalo',
    template: '%s | ReservationGonzalo',
  },
  description: 'Estadias exclusivas e memoráveis. Reserve diretamente connosco e garanta as melhores tarifas.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${outfit.variable} font-body text-text-main antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
