'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronDown,
  BookOpen,
  Tag,
  Key,
  CreditCard,
  Home,
  UserCircle,
  MessageCircle,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedSection } from '@/shared/components/ui/AnimatedSection'

// ── Types ──────────────────────────────────────────────────────────────────

type SubQuestion = { q: string; a: string }

type FaqCategory = {
  id: string
  icon: LucideIcon
  title: string
  description: string
  questions: SubQuestion[]
}

// ── Data ───────────────────────────────────────────────────────────────────

const faqCategories: FaqCategory[] = [
  {
    id: 'reservas',
    icon: BookOpen,
    title: 'Reservas',
    description: 'Tudo sobre criar, gerir e cancelar a tua reserva.',
    questions: [
      {
        q: 'Onde posso encontrar o meu código de confirmação?',
        a: 'A tua reserva está associada ao teu endereço de e-mail. Recebeste uma confirmação por e-mail que inclui o código de confirmação (formato RG-XXXXXX) e o PIN de acesso ao portal do hóspede.',
      },
      {
        q: 'Como posso contactar o anfitrião?',
        a: 'Podes contactar-nos através do chat em direto disponível no site ou por e-mail. Respondemos normalmente em menos de 2 horas durante o horário de atendimento.',
      },
      {
        q: 'É possível estender a minha reserva?',
        a: 'Se as datas estiverem disponíveis, podes fazer uma nova reserva para o período adicional. Caso contrário, entra em contacto connosco e tentamos encontrar uma solução.',
      },
      {
        q: 'Como posso cancelar a minha reserva?',
        a: 'Podes cancelar a tua reserva diretamente no portal do hóspede até ao prazo estabelecido pela política de cancelamento. Após esse prazo, a reserva não é reembolsável.',
      },
    ],
  },
  {
    id: 'precos',
    icon: Tag,
    title: 'Preços e descontos',
    description: 'Políticas de preços, descontos por longa estadia e promoções sazonais.',
    questions: [
      {
        q: 'Como são calculados os preços por noite?',
        a: 'O preço por noite pode variar consoante a época do ano, datas especiais e disponibilidade. O preço exato para as tuas datas é sempre indicado antes de confirmares a reserva.',
      },
      {
        q: 'Existe desconto para estadias longas?',
        a: 'Sim. Estadias de 7 noites ou mais têm um desconto automático de 10% aplicado ao preço base por noite. O desconto é visível na simulação de preço antes de pagar.',
      },
      {
        q: 'Há taxas adicionais para além do preço por noite?',
        a: 'O preço final inclui o IVA de 6% sobre o alojamento. Não há taxas de serviço nem comissões adicionais — o que vês é o que pagas.',
      },
    ],
  },
  {
    id: 'checkin',
    icon: Key,
    title: 'Check-in e check-out',
    description: 'Horários, acesso à propriedade e procedimentos de entrada e saída.',
    questions: [
      {
        q: 'Qual é o horário de check-in e check-out?',
        a: 'O check-in é a partir das 15h00 e o check-out até às 11h00. Horários fora deste intervalo podem ser acordados diretamente com o anfitrião, sujeitos a disponibilidade.',
      },
      {
        q: 'Como funciona o acesso à propriedade?',
        a: 'As instruções detalhadas de acesso são enviadas por e-mail 24 horas antes do check-in. Incluem o método de acesso e a localização exata da propriedade.',
      },
      {
        q: 'O que faço se chegar fora do horário combinado?',
        a: 'Contacta-nos com antecedência através do chat. Tentamos sempre acomodar chegadas tardias. Para chegadas após as 22h00, pode ser necessário um arranjo especial.',
      },
    ],
  },
  {
    id: 'pagamentos',
    icon: CreditCard,
    title: 'Pagamentos e devoluções',
    description: 'Métodos de pagamento aceites, faturação e política de reembolsos.',
    questions: [
      {
        q: 'Quais os métodos de pagamento aceites?',
        a: 'Aceitamos cartão de crédito e débito (Visa, Mastercard, American Express) processados de forma segura através da Stripe. Não aceitamos transferências bancárias nem dinheiro.',
      },
      {
        q: 'Quanto tempo demora o reembolso após um cancelamento?',
        a: 'Os reembolsos são processados em 5 a 10 dias úteis após a confirmação do cancelamento, dependendo do banco emissor do cartão.',
      },
      {
        q: 'Posso solicitar uma fatura com NIF?',
        a: 'Sim. Indica o teu NIF e dados de faturação durante o processo de reserva ou contacta-nos após a confirmação. A fatura simplificada é emitida em até 5 dias úteis.',
      },
    ],
  },
  {
    id: 'propriedade',
    icon: Home,
    title: 'A propriedade',
    description: 'WiFi, comodidades, serviços incluídos e regras da casa.',
    questions: [
      {
        q: 'Qual é a capacidade máxima da propriedade?',
        a: 'A capacidade máxima está indicada na página de cada alojamento. Não é permitida a hospedagem de pessoas além da capacidade contratada.',
      },
      {
        q: 'O WiFi está incluído? Qual a velocidade?',
        a: 'Sim, o WiFi de alta velocidade está incluído sem custo adicional. A ligação por fibra garante velocidades adequadas para teletrabalho ou streaming.',
      },
      {
        q: 'São permitidos animais de estimação?',
        a: 'A política de animais de estimação está indicada na ficha do alojamento. Em caso de dúvida, contacta-nos antes de reservar.',
      },
    ],
  },
  {
    id: 'portal',
    icon: UserCircle,
    title: 'Portal do hóspede',
    description: 'Acesso ao portal, histórico de reservas e gestão de dados pessoais.',
    questions: [
      {
        q: 'Como acedo ao portal do hóspede?',
        a: 'O portal está disponível em /portal. O acesso é feito com o teu endereço de e-mail e o código de confirmação da reserva. Não é necessária uma conta.',
      },
      {
        q: 'Posso ver o histórico das minhas reservas anteriores?',
        a: 'Sim. No portal podes consultar todas as reservas associadas ao teu e-mail, incluindo o histórico de estadias passadas e os respetivos documentos.',
      },
      {
        q: 'Como solicito a eliminação dos meus dados pessoais?',
        a: 'Em conformidade com o RGPD, podes solicitar a eliminação dos teus dados através do portal ou por e-mail. Os dados são anonimizados em até 30 dias, preservando os registos financeiros obrigatórios por lei.',
      },
    ],
  },
]

// ── Wave divider (reutilizada do AboutUs) ──────────────────────────────────

function WaveDivider({
  fromBg,
  toColorVar,
}: {
  fromBg: string
  toColorVar: string
}) {
  return (
    <div className={`${fromBg} -mb-px leading-[0]`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-8 md:h-10"
      >
        <path
          d="M0,0 Q720,48 1440,0 L1440,48 L0,48 Z"
          style={{ fill: `var(${toColorVar})` }}
        />
      </svg>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function HelpFaq() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openCat, setOpenCat] = useState<string | null>('reservas')
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set())

  // Real-time filter: when searching, show all matching categories expanded
  const displayed = useMemo<FaqCategory[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return faqCategories
    return faqCategories
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
        ),
      }))
      .filter(
        (cat) =>
          cat.questions.length > 0 ||
          cat.title.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q),
      )
  }, [searchQuery])

  const isSearching = searchQuery.trim().length > 0

  function handleSearch(value: string) {
    setSearchQuery(value)
    // When searching: open first match automatically
    if (value.trim()) {
      const q = value.toLowerCase()
      const first = faqCategories.find(
        (cat) =>
          cat.questions.some(
            (item) =>
              item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
          ) ||
          cat.title.toLowerCase().includes(q),
      )
      if (first) setOpenCat(first.id)
    } else {
      setOpenCat('reservas')
    }
  }

  function toggleCat(id: string) {
    setOpenCat((prev) => (prev === id ? null : id))
    // Clear open questions when closing a category
    setOpenQuestions(new Set())
  }

  function toggleQuestion(key: string) {
    setOpenQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleCategoryPill(id: string) {
    setSearchQuery('')
    setOpenCat(id)
    setOpenQuestions(new Set())
    // Scroll to FAQ accordion
    document.getElementById('faq-accordion')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="bg-cream text-text-main antialiased">
      <main>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="bg-cream py-12 md:py-16 lg:py-20">
          <div className="container-main">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <AnimatedSection>
                <p className="text-sm font-medium text-secondary uppercase tracking-widest">
                  {/* i18n: faq.hero.eyebrow */}
                  Ajuda e suporte
                </p>
                <h1 className="font-display font-extrabold text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-tight text-text-main mt-2">
                  {/* i18n: faq.hero.title */}
                  Perguntas frequentes
                </h1>
                <p className="text-base text-text-secondary leading-relaxed mt-3 max-w-lg mx-auto">
                  {/* i18n: faq.hero.subtitle */}
                  Encontra respostas sobre reservas, pagamentos, check-in e muito mais.
                </p>
              </AnimatedSection>

              {/* Search bar */}
              <AnimatedSection delay={100}>
                <div className="relative max-w-lg mx-auto mt-6">
                  <label htmlFor="faq-search" className="sr-only">
                    {/* i18n: faq.search.label */}
                    Pesquisar perguntas
                  </label>
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="faq-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Pesquisar perguntas…"
                    className="w-full h-12 pl-11 pr-10 bg-surface border border-border rounded-xl text-base text-text-main placeholder:text-text-muted shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-shadow duration-150"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      aria-label="Limpar pesquisa"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted hover:text-text-main hover:bg-surface-warm transition-colors duration-150 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <WaveDivider fromBg="bg-cream" toColorVar="--color-surface" />

        {/* ── CATEGORY PILLS ────────────────────────────────────────────── */}
        <section className="bg-surface border-b border-border py-4">
          <div className="container-main">
            <div
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
              role="navigation"
              aria-label="Categorias de perguntas"
            >
              {faqCategories.map((cat) => {
                const Icon = cat.icon
                const isActive = openCat === cat.id && !isSearching
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryPill(cat.id)}
                    aria-pressed={isActive}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                      whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                      ${isActive
                        ? 'bg-primary text-text-inverse shadow-soft'
                        : 'bg-surface-warm border border-border text-text-secondary hover:border-primary/30 hover:text-primary hover:bg-primary-light/50'
                      }
                    `}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {/* i18n: faq.category.title */}
                    {cat.title}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ACCORDION ─────────────────────────────────────────────── */}
        <section
          id="faq-accordion"
          className="bg-surface py-12 md:py-16 scroll-mt-24"
        >
          <div className="container-main max-w-3xl mx-auto space-y-3">

            {/* Search result count */}
            {isSearching && (
              <p className="text-sm text-text-muted mb-4">
                {displayed.reduce((acc, cat) => acc + cat.questions.length, 0)} resultado(s) para&nbsp;
                <span className="font-medium text-text-main">&ldquo;{searchQuery}&rdquo;</span>
              </p>
            )}

            {/* No results state */}
            {displayed.length === 0 && (
              <AnimatedSection>
                <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
                  <Search size={32} className="text-text-muted mx-auto" aria-hidden="true" />
                  <p className="font-display font-semibold text-text-main">
                    {/* i18n: faq.search.noResults.title */}
                    Nenhum resultado encontrado
                  </p>
                  <p className="text-sm text-text-muted max-w-xs mx-auto">
                    {/* i18n: faq.search.noResults.hint */}
                    Tenta outras palavras ou{' '}
                    <button
                      onClick={() => handleSearch('')}
                      className="text-primary underline underline-offset-2 cursor-pointer hover:text-primary-dark transition-colors"
                    >
                      limpa a pesquisa
                    </button>
                    .
                  </p>
                </div>
              </AnimatedSection>
            )}

            {/* Category cards */}
            {displayed.map((cat, catIdx) => {
              const Icon = cat.icon
              const isCatOpen = isSearching || openCat === cat.id

              return (
                <AnimatedSection key={cat.id} delay={catIdx * 50}>
                  <div
                    id={cat.id}
                    className={`
                      bg-surface border rounded-2xl overflow-hidden
                      transition-[border-color,box-shadow] duration-200
                      ${isCatOpen
                        ? 'border-primary/30 shadow-medium'
                        : 'border-border shadow-soft hover:border-border hover:shadow-medium'
                      }
                    `}
                  >
                    {/* ── Category header (outer accordion trigger) ── */}
                    <button
                      id={`cat-btn-${cat.id}`}
                      aria-expanded={isCatOpen}
                      aria-controls={`cat-region-${cat.id}`}
                      onClick={() => !isSearching && toggleCat(cat.id)}
                      disabled={isSearching}
                      className={`
                        w-full flex items-center gap-4 px-5 py-4 md:px-6 md:py-5 text-left
                        transition-colors duration-150
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset
                        ${isSearching ? 'cursor-default' : 'cursor-pointer hover:bg-surface-warm'}
                        ${isCatOpen ? 'bg-primary-light/40' : 'bg-surface'}
                      `}
                    >
                      {/* Category icon */}
                      <div
                        className={`
                          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                          transition-colors duration-200
                          ${isCatOpen ? 'bg-primary text-text-inverse' : 'bg-primary-light text-primary-dark'}
                        `}
                        aria-hidden="true"
                      >
                        <Icon size={18} />
                      </div>

                      {/* Title + description */}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-base text-text-main leading-tight">
                          {/* i18n: faq.category.title */}
                          {cat.title}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 leading-snug hidden sm:block">
                          {/* i18n: faq.category.description */}
                          {cat.description}
                        </p>
                      </div>

                      {/* Question count badge */}
                      <span className="text-xs font-medium text-text-muted bg-surface-warm border border-border px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                        {cat.questions.length}
                      </span>

                      {/* Chevron — rotates when open */}
                      {!isSearching && (
                        <ChevronDown
                          size={18}
                          className={`text-text-muted shrink-0 transition-transform duration-300 ${
                            isCatOpen ? 'rotate-180' : 'rotate-0'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {/* ── Category expand/collapse region (CSS Grid trick) ── */}
                    <div
                      id={`cat-region-${cat.id}`}
                      role="region"
                      aria-labelledby={`cat-btn-${cat.id}`}
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isCatOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-border-light divide-y divide-border-light">
                          {cat.questions.map((item, qIdx) => {
                            const questionKey = `${cat.id}-${qIdx}`
                            const isQOpen = openQuestions.has(questionKey)

                            return (
                              <div key={questionKey}>
                                {/* ── Question header (inner accordion trigger) ── */}
                                <button
                                  id={`q-btn-${questionKey}`}
                                  aria-expanded={isQOpen}
                                  aria-controls={`q-region-${questionKey}`}
                                  onClick={() => toggleQuestion(questionKey)}
                                  className="w-full flex items-start gap-3 px-5 py-4 md:px-6 text-left cursor-pointer
                                    hover:bg-primary-light/20 transition-colors duration-150
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                                >
                                  {/* Inner chevron */}
                                  <ChevronDown
                                    size={16}
                                    className={`text-primary shrink-0 mt-0.5 transition-transform duration-200 ${
                                      isQOpen ? 'rotate-180' : 'rotate-0'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  {/* Question text */}
                                  <span
                                    className={`text-sm leading-snug transition-colors duration-150 ${
                                      isQOpen
                                        ? 'font-semibold text-text-main'
                                        : 'font-medium text-text-secondary hover:text-text-main'
                                    }`}
                                  >
                                    {/* i18n: faq.question.text */}
                                    {item.q}
                                  </span>
                                </button>

                                {/* ── Answer region (CSS Grid trick) ── */}
                                <div
                                  id={`q-region-${questionKey}`}
                                  role="region"
                                  aria-labelledby={`q-btn-${questionKey}`}
                                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                                    isQOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                  }`}
                                >
                                  <div className="overflow-hidden">
                                    <div className="px-5 md:px-6 pb-4 pl-[2.75rem] md:pl-12">
                                      <div className="bg-accent-light/50 border-l-2 border-accent rounded-r-lg px-4 py-3">
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                          {/* i18n: faq.answer.text */}
                                          {item.a}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </section>

        <WaveDivider fromBg="bg-surface" toColorVar="--color-cream" />

        {/* ── CONTACT CTA ───────────────────────────────────────────────── */}
        <section className="bg-cream py-12 md:py-16">
          <div className="container-main max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  <MessageCircle size={22} className="text-primary-dark" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-text-main">
                    {/* i18n: faq.cta.title */}
                    Não encontraste a resposta que procuravas?
                  </p>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {/* i18n: faq.cta.subtitle */}
                    Entra em contacto connosco diretamente. Respondemos em menos de 2 horas.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    href="/portal"
                    className="inline-flex items-center justify-center h-10 min-h-[44px] px-5 bg-primary text-text-inverse text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {/* i18n: faq.cta.portal */}
                    Gerir a minha reserva
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

      </main>
    </div>
  )
}
