import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin,
  Shield,
  Wallet,
  MessageCircle,
  Eye,
  CalendarCheck,
  Star,
  CreditCard,
  CheckCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedSection } from '@/shared/components/ui/AnimatedSection'

// ── Static data ────────────────────────────────────────────────────────────

type Benefit = { icon: LucideIcon; title: string; description: string }
type TrustBadge = { icon: LucideIcon; label: string; value: string }
type Review = { text: string; author: string; country: string; stars: number }

const directBookingBenefits: Benefit[] = [
  {
    icon: Wallet,
    title: 'Sem comissões',
    description:
      'Quando reservas diretamente comigo, pagas o preço real — sem taxas de serviço nem comissões de plataformas.',
  },
  {
    icon: MessageCircle,
    title: 'Trato pessoal',
    description:
      'Falo diretamente contigo. Sem call centers nem chatbots — sou eu que respondo às tuas perguntas.',
  },
  {
    icon: Eye,
    title: 'Preços transparentes',
    description:
      'O que vês é o que pagas. Desagregação completa do preço antes de confirmares a reserva.',
  },
  {
    icon: CalendarCheck,
    title: 'Cancelamento flexível',
    description:
      'Políticas claras e flexíveis. Se precisares de ajuda, estou aqui para encontrar uma solução.',
  },
]

const guestReviews: Review[] = [
  {
    text: 'A casa do Gonzalo é um lugar incrível. A decoração, a piscina e a simpatia do anfitrião fizeram da nossa estadia algo inesquecível.',
    author: 'Maria S.',
    country: 'Portugal',
    stars: 5,
  },
  {
    text: 'Booking directly with Gonzalo was the best decision. Clear communication, fair prices, and a house that felt like home.',
    author: 'James & Lucy T.',
    country: 'United Kingdom',
    stars: 5,
  },
  {
    text: 'La casa superó todas nuestras expectativas. Gonzalo estuvo siempre disponible y la ubicación en Cascais es perfecta.',
    author: 'Carlos R.',
    country: 'España',
    stars: 5,
  },
]

const trustBadges: TrustBadge[] = [
  {
    icon: Shield,
    label: 'Licença AL',
    value: 'nº XXXXX', // TODO: Replace with real AL license number
  },
  {
    icon: CreditCard,
    label: 'Pagamentos seguros',
    value: 'powered by Stripe',
  },
  {
    icon: CheckCircle,
    label: 'Reserva direta',
    value: 'sem intermediários',
  },
  {
    icon: Star,
    label: 'Anfitrião desde',
    value: '20XX', // TODO: Replace with real year
  },
]

const houseFeatures = [
  'Terraço exterior',
  'Piscina exterior',
  'Jardim com buganvílias',
  'WiFi alta velocidade',
  'Casa de banho em mármore',
  'A 5 min da praia',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${count} de 5 estrelas`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="text-primary fill-primary" strokeWidth={0} />
      ))}
    </div>
  )
}

/**
 * SVG wave divider between sections.
 * fromBg: Tailwind bg class of the current section (wrapper background).
 * toColorVar: CSS custom property of the next section's color.
 * variant: wave shape — 'arch' | 'scurve' | 'tilt'.
 */
function WaveDivider({
  fromBg,
  toColorVar,
  variant = 'arch',
}: {
  fromBg: string
  toColorVar: string
  variant?: 'arch' | 'scurve' | 'tilt'
}) {
  const paths: Record<string, string> = {
    arch: 'M0,0 Q720,48 1440,0 L1440,48 L0,48 Z',
    scurve: 'M0,24 C360,48 720,0 1080,32 C1260,40 1380,20 1440,28 L1440,48 L0,48 Z',
    tilt: 'M0,0 L1440,32 L1440,48 L0,48 Z',
  }
  return (
    <div className={`${fromBg} -mb-px leading-[0]`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-8 md:h-10 lg:h-12"
      >
        <path d={paths[variant]} style={{ fill: `var(${toColorVar})` }} />
      </svg>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AboutUs() {
  return (
    <main>
      {/* ── 1. HERO — no animation: above the fold, loads immediately ────── */}
      <section className="bg-cream py-12 md:py-16 lg:py-20">
        <div className="container-main space-y-8">

          {/* Text block */}
          <div className="space-y-5 max-w-2xl">
            {/* Eyebrow */}
            <p className="text-sm font-medium text-secondary uppercase tracking-widest">
              {/* i18n: about.hero.eyebrow */}
              O teu próximo refúgio em Portugal
            </p>

            {/* Heading with decorative left accent */}
            <div className="flex items-start gap-4">
              <div className="hidden sm:block w-1 self-stretch rounded-full bg-primary mt-1 mb-1 shrink-0" aria-hidden="true" />
              <h1 className="font-display font-extrabold text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-tight text-text-main">
                {/* i18n: about.hero.title */}
                Sobre mim
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg text-text-secondary leading-relaxed max-w-prose">
              {/* i18n: about.hero.subtitle */}
              Sou o Gonzalo, e abri as portas da minha casa em Cascais para
              viajantes que procuram uma experiência autêntica — longe dos hotéis
              sem alma e das plataformas impessoais.
            </p>

            {/* Credential pills — decorative trust anchors */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-text-secondary shadow-soft">
                <MapPin size={13} className="text-secondary shrink-0" aria-hidden="true" />
                Cascais, Portugal
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-light border border-accent/30 text-sm text-accent-dark shadow-soft">
                <CheckCircle size={13} className="text-accent shrink-0" aria-hidden="true" />
                {/* i18n: about.hero.pill.verified */}
                Anfitrião verificado
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light border border-primary/20 text-sm text-primary-dark shadow-soft">
                <Shield size={13} className="text-primary-dark shrink-0" aria-hidden="true" />
                {/* i18n: about.hero.pill.direct */}
                Reserva direta
              </span>
            </div>
          </div>

          {/*
           * IMAGEM HERO PLACEHOLDER — Substituir por imagem real da propriedade.
           * Foto recomendada: exterior da casa com fachada amarelo-ocre, terraço ou jardim.
           * Formato: 16:9, mínimo 1280×720 px, WebP. Fazer upload no Cloudinary e
           * substituir o src pela URL de Cloudinary (https://res.cloudinary.com/...).
           */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary-light to-secondary-light shadow-medium">
            <Image
              src="https://picsum.photos/seed/portugal-house-exterior/1280/720"
              alt="Casa de Gonzalo em Cascais — fachada exterior com paredes amarelo-ocre e jardim com buganvílias"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            {/* Subtle gradient overlay at the bottom for depth */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-text-main/20 to-transparent pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Wave: cream → surface */}
      <WaveDivider fromBg="bg-cream" toColorVar="--color-surface" variant="arch" />

      {/* ── 2. A MINHA HISTÓRIA ─────────────────────────────────────────── */}
      <section className="bg-surface py-12 md:py-16 lg:py-20">
        <div className="container-main grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text — slides up first */}
          <AnimatedSection>
            <div className="space-y-6">
              <h2 className="font-display font-bold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.2] text-text-main">
                {/* i18n: about.story.title */}
                A minha história
              </h2>
              <div className="space-y-4 text-base text-text-secondary leading-relaxed">
                <p>
                  {/* i18n: about.story.p1 */}
                  Sempre vivi em Cascais e sempre me orgulhei desta casa — das suas
                  paredes de ocre, do jardim com calçada portuguesa, das buganvílias
                  que trepam pela varanda. Um dia percebi que queria partilhá-la com
                  pessoas que soubessem apreciar tudo isso.
                </p>
                <p>
                  {/* i18n: about.story.p2 */}
                  Comecei por estar em plataformas, mas rapidamente percebi que
                  prefiro o contacto direto: conhecer quem vai ficar na minha casa,
                  responder pessoalmente às perguntas e garantir que tudo está
                  perfeito à tua chegada.
                </p>
                <p>
                  {/* i18n: about.story.p3 */}
                  Reservar diretamente comigo significa preços mais justos para ti
                  e uma experiência mais pessoal para ambos. É por isso que
                  construí este site.
                </p>
              </div>

              {/* Host profile card */}
              <div className="inline-flex items-center gap-4 bg-surface-warm border border-border rounded-xl px-4 py-3 shadow-soft mt-2">
                {/*
                 * IMAGEM DO ANFITRIÃO PLACEHOLDER — Substituir por foto real do Gonzalo.
                 * Formato: quadrado, mínimo 128×128 px, rosto centrado. Upload no Cloudinary.
                 * Esta imagem deve ser mantida permanentemente (não é placeholder de layout).
                 */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary-light to-secondary-light ring-2 ring-primary/30 shadow-soft shrink-0">
                  <Image
                    src="https://picsum.photos/seed/host-portrait-male/200/200"
                    alt="Gonzalo, anfitrião da casa em Cascais"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div>
                  <p className="font-display font-semibold text-text-main leading-tight">
                    {/* i18n: about.host.name */}
                    Gonzalo
                  </p>
                  <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                    <Shield size={12} className="text-accent shrink-0" aria-hidden="true" />
                    {/* i18n: about.host.verified */}
                    Anfitrião verificado · Cascais, Portugal
                  </p>
                </div>
                <div className="ml-auto pl-4 border-l border-border shrink-0">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-soft">
                    <Shield size={14} className="text-text-inverse" />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Image — slides up with delay */}
          <AnimatedSection delay={150}>
            {/*
             * IMAGEM INTERIOR PLACEHOLDER — Substituir por foto real da casa.
             * Foto recomendada: sala de estar com pavimento de madeira, luz natural,
             * terraço ou espaço com carácter português. Formato: 3:2. Upload no Cloudinary.
             */}
            <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-light to-secondary-light shadow-medium">
              <Image
                src="https://picsum.photos/seed/warm-interior-living/900/600"
                alt="Interior da casa em Cascais — sala de estar com pavimento de madeira e decoração portuguesa"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Wave: surface → surface-warm */}
      <WaveDivider fromBg="bg-surface" toColorVar="--color-surface-warm" variant="scurve" />

      {/* ── 3. A MINHA CASA ─────────────────────────────────────────────── */}
      <section className="bg-surface-warm py-12 md:py-16 lg:py-20">
        <div className="container-main grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Image first on mobile, first on desktop too */}
          <AnimatedSection>
            {/*
             * IMAGEM JARDIM/PISCINA PLACEHOLDER — Substituir por foto real.
             * Foto recomendada: piscina exterior, jardim com buganvílias, área de lazer,
             * ou vista do terraço. Formato: 3:2. Upload no Cloudinary.
             */}
            <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-light to-secondary-light shadow-medium">
              <Image
                src="https://picsum.photos/seed/mediterranean-garden-pool/900/600"
                alt="Jardim e piscina exterior da casa em Cascais — área de lazer com buganvílias e mobiliário em vime"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="space-y-6">
              <h2 className="font-display font-bold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.2] text-text-main">
                {/* i18n: about.house.title */}
                A minha casa
              </h2>
              <div className="space-y-4 text-base text-text-secondary leading-relaxed">
                <p>
                  {/* i18n: about.house.p1 */}
                  É uma casa portuguesa tradicional em Cascais, com as paredes de
                  ocre que lhe dão aquele calor mediterrânico. A varanda e a piscina
                  são o lugar perfeito para as tardes de verão — e o jardim com
                  buganvílias cria uma atmosfera que não se inventa.
                </p>
                <p>
                  {/* i18n: about.house.p2 */}
                  Lá dentro, misturei o conforto moderno com a alma portuguesa:
                  pavimentos de madeira, tapetes artesanais, camas de ferro forjado
                  e uma casa de banho em mármore com chuveiro envidraçado. Confortável
                  sem perder o carácter.
                </p>
              </div>

              {/* Feature grid with stagger */}
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3" role="list">
                {houseFeatures.map((feature, i) => (
                  <AnimatedSection key={feature} delay={i * 60}>
                    <li className="flex items-center gap-2 text-sm text-text-secondary">
                      <div className="w-5 h-5 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                        <CheckCircle size={12} className="text-accent" aria-hidden="true" />
                      </div>
                      {/* i18n: about.house.feature */}
                      <span>{feature}</span>
                    </li>
                  </AnimatedSection>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Wave: surface-warm → surface */}
      <WaveDivider fromBg="bg-surface-warm" toColorVar="--color-surface" variant="tilt" />

      {/* ── 4. POR QUE RESERVAR DIRETAMENTE ────────────────────────────── */}
      <section className="bg-surface py-12 md:py-16 lg:py-20">
        <div className="container-main space-y-10">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="font-display font-bold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.2] text-text-main">
                {/* i18n: about.direct.title */}
                Por que reservar diretamente comigo?
              </h2>
              <p className="text-base text-text-secondary">
                {/* i18n: about.direct.subtitle */}
                Quando reservas comigo diretamente, ganhas muito mais do que um
                alojamento.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {directBookingBenefits.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <AnimatedSection key={benefit.title} delay={i * 80}>
                  {/* group enables icon scale on card hover */}
                  <div className="group bg-surface border border-border rounded-xl p-6 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-200 space-y-3 h-full cursor-default">
                    {/* Icon scales up on card hover via group */}
                    <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/20 transition-transform duration-200">
                      <Icon size={20} className="text-accent-dark" aria-hidden="true" />
                    </div>
                    <h3 className="font-display font-semibold text-xl text-text-main">
                      {/* i18n: about.direct.card.title */}
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {/* i18n: about.direct.card.desc */}
                      {benefit.description}
                    </p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Wave: surface → cream */}
      <WaveDivider fromBg="bg-surface" toColorVar="--color-cream" variant="arch" />

      {/* ── 5. O QUE DIZEM OS HÓSPEDES ──────────────────────────────────── */}
      <section className="bg-cream py-12 md:py-16 lg:py-20">
        <div className="container-main space-y-10">
          <AnimatedSection>
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="font-display font-bold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.2] text-text-main">
                {/* i18n: about.reviews.title */}
                O que dizem os hóspedes
              </h2>
              <p className="text-base text-text-secondary">
                {/* i18n: about.reviews.subtitle */}
                Experiências reais de quem ficou na minha casa.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guestReviews.map((review, i) => (
              <AnimatedSection key={review.author} delay={i * 100}>
                {/* Review card with decorative oversized quote mark */}
                <article className="relative bg-surface border border-border rounded-xl p-6 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-200 space-y-4 h-full overflow-hidden">
                  {/* Decorative large quote mark — purely visual */}
                  <span
                    className="absolute -top-3 -left-0.5 font-display font-bold text-[96px] leading-none text-primary/10 select-none pointer-events-none"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>

                  <div className="relative space-y-4">
                    <StarRating count={review.stars} />
                    <blockquote>
                      <p className="text-base text-text-secondary italic leading-relaxed">
                        {/* i18n: about.reviews.card.text */}
                        &ldquo;{review.text}&rdquo;
                      </p>
                    </blockquote>
                    <footer className="pt-2 border-t border-border-light">
                      <p className="text-sm font-semibold text-text-main font-display">
                        {/* i18n: about.reviews.card.author */}
                        {review.author}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {/* i18n: about.reviews.card.country */}
                        {review.country}
                      </p>
                    </footer>
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Wave: cream → surface-warm */}
      <WaveDivider fromBg="bg-cream" toColorVar="--color-surface-warm" variant="scurve" />

      {/* ── 6. TRUST BADGES ─────────────────────────────────────────────── */}
      <section className="bg-surface-warm py-10 md:py-14">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge, i) => {
              const Icon = badge.icon
              return (
                <AnimatedSection key={badge.label} delay={i * 70}>
                  <div className="group bg-surface border border-border rounded-xl p-4 md:p-5 flex flex-col items-center text-center gap-3 shadow-soft hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 h-full">
                    <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-transform duration-200">
                      <Icon size={20} className="text-primary-dark" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        {/* i18n: about.trust.label */}
                        {badge.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {/* i18n: about.trust.value */}
                        {badge.value}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Wave: surface-warm → accent-dark */}
      <WaveDivider fromBg="bg-surface-warm" toColorVar="--color-accent-dark" variant="tilt" />

      {/* ── 7. CTA FINAL ────────────────────────────────────────────────── */}
      {/* bg-accent-dark + text-inverse: contrast 7.3:1 — WCAG AAA ✅ */}
      <section className="bg-accent-dark py-16 md:py-20 lg:py-24 relative overflow-hidden">

        {/* Decorative dot grid overlay — purely visual texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(var(--color-text-inverse) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        {/* Decorative blurred ochre circle — depth accent */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-secondary/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <AnimatedSection>
          <div className="relative container-main flex flex-col items-center text-center gap-6">
            <h2 className="font-display font-bold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.2] text-text-inverse max-w-2xl">
              {/* i18n: about.cta.title */}
              Pronto para a tua próxima aventura em Portugal?
            </h2>
            <p className="text-lg text-text-inverse/80 max-w-prose">
              {/* i18n: about.cta.subtitle */}
              Espero receber-te em breve e mostrar-te o melhor de Cascais.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center justify-center h-12 min-h-[44px] px-8 bg-text-inverse text-accent-dark font-semibold rounded-lg hover:bg-primary-light transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-accent-dark cursor-pointer"
            >
              {/* i18n: about.cta.button */}
              Explorar a propriedade
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </main>
  )
}
