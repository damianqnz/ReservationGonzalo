import type { Metadata } from 'next'
import Navbar from '@/shared/components/layout/Navbar'
import Footer from '@/shared/components/layout/Footer'
import HelpFaq from '@/shared/components/marketing/HelpFaq'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes — ReservationGonzalo | Alojamento em Cascais',
  description:
    'Respostas às perguntas mais comuns sobre reservas, check-in, pagamentos, cancelamentos e a propriedade em Cascais. Apoio direto com o anfitrião Gonzalo.',
  alternates: {
    canonical: 'https://reservationgonzalo.pt/faq', // TODO: Replace with production URL
  },
  openGraph: {
    title: 'Perguntas Frequentes — ReservationGonzalo',
    description:
      'Tudo o que precisas de saber sobre reservas, pagamentos, check-in e a propriedade em Cascais.',
    url: 'https://reservationgonzalo.pt/faq', // TODO: Replace with production URL
    siteName: 'ReservationGonzalo',
    type: 'website',
    locale: 'pt_PT',
  },
}

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <div className="pt-20">
        <HelpFaq />
      </div>
      <Footer />
    </>
  )
}
