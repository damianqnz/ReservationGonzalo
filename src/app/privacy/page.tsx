import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/stitch/Navbar'
import Footer from '@/components/stitch/Footer'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Saiba como a ReservationGonzalo recolhe, utiliza e protege os seus dados pessoais.',
}

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 container-main px-0">
        <article className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#8b1a1a] mb-8 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Voltar ao início
          </Link>

          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-[#1a1a2e] tracking-tight mb-3">
              Política de Privacidade
            </h1>
            <p className="text-sm text-slate-400">Última atualização: Março 2026</p>
          </header>

          <div className="prose-legal">

            {/* 1 */}
            <section className="mb-8">
              <h2>1. Responsável pelo Tratamento</h2>
              <p>
                O responsável pelo tratamento dos seus dados pessoais é:
              </p>
              <ul>
                <li><strong>Entidade:</strong> ReservationGonzalo</li>
                <li><strong>Email:</strong>{' '}
                  <a href="mailto:reservas@reservationgonzalo.pt">
                    reservas@reservationgonzalo.pt
                  </a>
                </li>
                <li><strong>Morada:</strong> Lisboa, Portugal</li>
              </ul>
              <p>
                Para qualquer questão relacionada com a proteção dos seus dados, contacte-nos
                através do email acima indicado.
              </p>
            </section>

            {/* 2 */}
            <section className="mb-8">
              <h2>2. Dados que Recolhemos</h2>
              <p>Recolhemos apenas os dados estritamente necessários para a prestação dos nossos serviços:</p>
              <h3>Dados de identificação</h3>
              <ul>
                <li>Nome completo</li>
                <li>Endereço de email</li>
                <li>Número de telefone (opcional)</li>
                <li>País de residência</li>
              </ul>
              <h3>Dados de reserva</h3>
              <ul>
                <li>Datas de check-in e check-out</li>
                <li>Número de hóspedes</li>
                <li>Mensagens trocadas no processo de reserva</li>
                <li>Código de confirmação da reserva</li>
              </ul>
              <h3>Dados de pagamento</h3>
              <p>
                Os dados de pagamento (número de cartão, CVV, etc.) são processados diretamente
                pela <strong>Stripe, Inc.</strong> e nunca são armazenados nos nossos servidores.
                Apenas guardamos o identificador da intenção de pagamento para rastreabilidade.
              </p>
              <h3>Dados de navegação</h3>
              <ul>
                <li>Endereço IP</li>
                <li>Informação do browser e dispositivo</li>
                <li>Páginas visitadas (mediante consentimento para cookies de análise)</li>
              </ul>
            </section>

            {/* 3 */}
            <section className="mb-8">
              <h2>3. Finalidade do Tratamento</h2>
              <p>Os seus dados são tratados para as seguintes finalidades:</p>
              <ul>
                <li>
                  <strong>Gestão de reservas:</strong> processar, confirmar e gerir a sua reserva,
                  incluindo comunicações sobre check-in, check-out e instruções da propriedade.
                </li>
                <li>
                  <strong>Processamento de pagamentos:</strong> garantir a segurança e rastreabilidade
                  das transações financeiras.
                </li>
                <li>
                  <strong>Comunicações sobre a reserva:</strong> envio de confirmações, lembretes
                  e informações relevantes para a sua estadia.
                </li>
                <li>
                  <strong>Marketing e promoções:</strong> apenas com o seu consentimento expresso,
                  poderemos enviar informações sobre ofertas e novidades. Pode retirar o
                  consentimento a qualquer momento.
                </li>
                <li>
                  <strong>Cumprimento de obrigações legais:</strong> faturação, obrigações fiscais
                  e comunicações legalmente exigidas.
                </li>
              </ul>
            </section>

            {/* 4 */}
            <section className="mb-8">
              <h2>4. Base Legal do Tratamento</h2>
              <ul>
                <li>
                  <strong>Execução de contrato</strong> (artigo 6.º, n.º 1, al. b) do RGPD) —
                  para o processamento de reservas e comunicações associadas.
                </li>
                <li>
                  <strong>Consentimento</strong> (artigo 6.º, n.º 1, al. a) do RGPD) —
                  para o envio de comunicações de marketing. Pode retirar o consentimento
                  a qualquer momento sem prejuízo para o contrato.
                </li>
                <li>
                  <strong>Obrigação legal</strong> (artigo 6.º, n.º 1, al. c) do RGPD) —
                  para cumprimento de obrigações fiscais e contabilísticas previstas na lei
                  portuguesa.
                </li>
              </ul>
            </section>

            {/* 5 */}
            <section className="mb-8">
              <h2>5. Partilha de Dados com Terceiros</h2>
              <p>
                Os seus dados podem ser partilhados com os seguintes subcontratantes, exclusivamente
                para as finalidades indicadas:
              </p>
              <ul>
                <li>
                  <strong>Stripe, Inc.</strong> — processamento de pagamentos. Política de
                  privacidade disponível em stripe.com/privacy.
                </li>
                <li>
                  <strong>Resend</strong> — envio de emails transacionais (confirmações, lembretes).
                </li>
                <li>
                  <strong>Cloudinary</strong> — alojamento de imagens das propriedades (não
                  inclui dados pessoais dos hóspedes).
                </li>
              </ul>
              <p>
                <strong>Não vendemos, alugamos nem cedemos os seus dados pessoais a terceiros</strong>{' '}
                para fins comerciais ou de marketing sem o seu consentimento expresso.
              </p>
            </section>

            {/* 6 */}
            <section className="mb-8">
              <h2>6. Conservação dos Dados</h2>
              <ul>
                <li>
                  <strong>Dados de reserva e faturação:</strong> conservados durante <strong>10 anos</strong>,
                  conforme as obrigações fiscais previstas no Código do IVA e no Código do IRC.
                </li>
                <li>
                  <strong>Dados de marketing:</strong> conservados até à retirada do consentimento.
                  Após retirada, os dados serão eliminados no prazo de 30 dias.
                </li>
                <li>
                  <strong>Dados de navegação (cookies):</strong> conforme definido na nossa{' '}
                  <Link href="/cookies">Política de Cookies</Link>.
                </li>
              </ul>
            </section>

            {/* 7 */}
            <section className="mb-8">
              <h2>7. Os Seus Direitos</h2>
              <p>
                Nos termos do RGPD, tem os seguintes direitos relativamente aos seus dados pessoais:
              </p>
              <ul>
                <li><strong>Direito de acesso</strong> — saber quais os dados que tratamos sobre si.</li>
                <li><strong>Direito de retificação</strong> — corrigir dados incorretos ou incompletos.</li>
                <li>
                  <strong>Direito ao apagamento ("direito a ser esquecido")</strong> — solicitar
                  a eliminação dos seus dados, exceto quando existam obrigações legais que o impeçam.
                </li>
                <li>
                  <strong>Direito à portabilidade</strong> — receber os seus dados num formato
                  estruturado e legível por máquina.
                </li>
                <li>
                  <strong>Direito de oposição</strong> — opor-se ao tratamento para fins de
                  marketing direto.
                </li>
                <li>
                  <strong>Direito de limitação</strong> — solicitar a suspensão temporária do
                  tratamento em determinadas circunstâncias.
                </li>
              </ul>
              <p>
                Para exercer qualquer um destes direitos, contacte-nos por email:{' '}
                <a href="mailto:reservas@reservationgonzalo.pt">
                  reservas@reservationgonzalo.pt
                </a>.
                Responderemos no prazo máximo de 30 dias.
              </p>
              <p>
                Tem também o direito de apresentar reclamação à{' '}
                <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> em{' '}
                <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">
                  cnpd.pt
                </a>.
              </p>
            </section>

            {/* 8 */}
            <section className="mb-8">
              <h2>8. Cookies</h2>
              <p>
                Utilizamos cookies para melhorar a sua experiência de navegação. Para informação
                detalhada sobre os cookies que utilizamos e como os gerir, consulte a nossa{' '}
                <Link href="/cookies">Política de Cookies</Link>.
              </p>
            </section>

            {/* 9 */}
            <section className="mb-8">
              <h2>9. Alterações a Esta Política</h2>
              <p>
                Reservamo-nos o direito de atualizar esta Política de Privacidade para refletir
                alterações legais, técnicas ou de negócio. Em caso de alterações significativas,
                notificaremos os hóspedes com reservas ativas por email. A data da última
                atualização está indicada no topo desta página.
              </p>
            </section>

          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
