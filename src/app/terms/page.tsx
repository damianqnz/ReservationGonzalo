import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/stitch/Navbar'
import Footer from '@/components/stitch/Footer'

export const metadata: Metadata = {
  title: 'Termos e Condições',
  description: 'Termos e condições de utilização e reserva na ReservationGonzalo.',
}

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#8b1a1a] mb-8 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Voltar ao início
          </Link>

          <header className="mb-10">
            <h1 className="text-4xl font-extrabold text-[#1a1a2e] tracking-tight mb-3">
              Termos e Condições
            </h1>
            <p className="text-sm text-slate-400">Última atualização: Março 2026</p>
          </header>

          <div className="prose-legal">

            {/* 1 */}
            <section className="mb-8">
              <h2>1. Identificação</h2>
              <p>
                Os presentes Termos e Condições regulam a utilização da plataforma e os serviços
                de reserva prestados por:
              </p>
              <ul>
                <li><strong>Entidade:</strong> ReservationGonzalo</li>
                <li><strong>Sede:</strong> Lisboa, Portugal</li>
                <li><strong>Email:</strong>{' '}
                  <a href="mailto:reservas@reservationgonzalo.pt">
                    reservas@reservationgonzalo.pt
                  </a>
                </li>
                <li><strong>Registo de Alojamento Local:</strong> [AL-NÚMERO]</li>
              </ul>
              <p>
                Ao efetuar uma reserva na nossa plataforma, o hóspede declara ter lido, compreendido
                e aceite os presentes Termos e Condições.
              </p>
            </section>

            {/* 2 */}
            <section className="mb-8">
              <h2>2. Processo de Reserva</h2>
              <h3>2.1 Como fazer uma reserva</h3>
              <p>
                Para efetuar uma reserva, o hóspede deverá selecionar as datas pretendidas,
                indicar o número de hóspedes, preencher os dados de identificação e proceder
                ao pagamento através da nossa plataforma segura.
              </p>
              <h3>2.2 Confirmação</h3>
              <p>
                A reserva considera-se confirmada apenas após a receção do pagamento integral.
                Após confirmação, o hóspede receberá um email com o <strong>código de confirmação
                no formato RG-XXXXXX</strong>, que servirá de comprovativo da reserva.
              </p>
              <h3>2.3 Disponibilidade</h3>
              <p>
                A disponibilidade apresentada na plataforma é atualizada em tempo real. Em caso
                de indisponibilidade após o pagamento (situação excecional), o hóspede será
                reembolsado na totalidade.
              </p>
              <h3>2.4 Reservas pendentes</h3>
              <p>
                Uma reserva iniciada mas não paga fica em estado pendente durante 15 minutos,
                após os quais é automaticamente cancelada e as datas ficam novamente disponíveis.
              </p>
            </section>

            {/* 3 */}
            <section className="mb-8">
              <h2>3. Pagamentos</h2>
              <ul>
                <li>
                  Todos os pagamentos são processados de forma segura pela <strong>Stripe, Inc.</strong>,
                  em conformidade com o padrão PCI DSS.
                </li>
                <li>A moeda de faturação é o <strong>Euro (EUR)</strong>.</li>
                <li>
                  O preço total apresentado inclui o preço por noite, a taxa de limpeza e o
                  depósito de segurança aplicável, bem como todas as taxas legalmente exigidas.
                </li>
                <li>
                  Poderão ser aplicados descontos automáticos para estadias iguais ou superiores
                  a 7 noites.
                </li>
                <li>
                  O IVA aplicável (taxa reduzida de 6% sobre alojamento) está incluído no preço
                  apresentado, conforme a legislação fiscal portuguesa.
                </li>
              </ul>
            </section>

            {/* 4 */}
            <section className="mb-8">
              <h2>4. Política de Cancelamento</h2>
              <p>
                A política de cancelamento aplicável a cada reserva é indicada na página da
                propriedade antes da confirmação. Existem três políticas possíveis:
              </p>
              <h3>Flexível</h3>
              <p>
                Reembolso total (exceto taxas de serviço não reembolsáveis) se o cancelamento
                for efetuado <strong>até 24 horas antes do check-in</strong>. Cancelamentos
                posteriores não têm direito a reembolso.
              </p>
              <h3>Moderada</h3>
              <p>
                Reembolso de 50% do valor da estadia se o cancelamento for efetuado
                <strong> até 5 dias antes do check-in</strong>. Cancelamentos mais tardios não
                têm direito a reembolso.
              </p>
              <h3>Rigorosa</h3>
              <p>
                <strong>Sem reembolso</strong> após confirmação da reserva, independentemente
                da data de cancelamento. Recomendamos a contratação de seguro de viagem.
              </p>
              <p>
                Para cancelar uma reserva, contacte-nos através do email
                reservas@reservationgonzalo.pt indicando o código de confirmação.
              </p>
            </section>

            {/* 5 */}
            <section className="mb-8">
              <h2>5. Check-in e Check-out</h2>
              <ul>
                <li>
                  <strong>Check-in:</strong> a partir das <strong>15:00</strong>, salvo indicação
                  contrária na página da propriedade. Check-in antecipado sujeito a disponibilidade.
                </li>
                <li>
                  <strong>Check-out:</strong> até às <strong>11:00</strong>. Check-out tardio
                  sujeito a disponibilidade e pode implicar custos adicionais.
                </li>
                <li>
                  As instruções de acesso à propriedade (código de entrada, localização das
                  chaves, etc.) serão enviadas por email <strong>48 horas antes do check-in</strong>.
                </li>
                <li>
                  O hóspede deve apresentar documento de identificação válido no momento
                  do check-in, conforme exigido pela legislação de Alojamento Local.
                </li>
              </ul>
            </section>

            {/* 6 */}
            <section className="mb-8">
              <h2>6. Responsabilidades do Hóspede</h2>
              <ul>
                <li>
                  O hóspede é responsável por quaisquer danos causados na propriedade durante
                  a sua estadia, incluindo danos causados por acompanhantes.
                </li>
                <li>
                  O <strong>depósito de segurança</strong> (quando aplicável) será cobrado no
                  momento da reserva e devolvido no prazo de <strong>7 dias úteis</strong> após
                  o check-out, desde que não existam danos a reportar.
                </li>
                <li>
                  É proibido organizar festas, eventos ou reuniões que perturbem o sossego
                  dos vizinhos, sob pena de cancelamento imediato da reserva sem reembolso.
                </li>
                <li>
                  O número máximo de hóspedes indicado na reserva não pode ser excedido.
                </li>
                <li>
                  O hóspede deve respeitar as regras de condomínio e as normas locais aplicáveis.
                </li>
              </ul>
            </section>

            {/* 7 */}
            <section className="mb-8">
              <h2>7. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo presente nesta plataforma — incluindo textos, fotografias, logótipos,
                design e código — é propriedade da ReservationGonzalo ou dos seus licenciadores,
                estando protegido pelas leis de propriedade intelectual aplicáveis.
              </p>
              <p>
                É proibida a reprodução, distribuição ou utilização comercial de qualquer
                conteúdo sem autorização prévia e escrita.
              </p>
            </section>

            {/* 8 */}
            <section className="mb-8">
              <h2>8. Lei Aplicável e Foro Competente</h2>
              <p>
                Os presentes Termos e Condições são regidos pela <strong>lei portuguesa</strong>.
                Em caso de litígio, as partes acordam submeter-se à jurisdição exclusiva dos
                <strong> Tribunais de Lisboa</strong>, sem prejuízo do direito do consumidor
                a recorrer a meios alternativos de resolução de litígios.
              </p>
              <p>
                Para resolução extrajudicial de conflitos, o hóspede pode recorrer ao Centro
                de Arbitragem de Conflitos de Consumo de Lisboa (CACCL) em{' '}
                <a href="https://www.centroarbitragemlisboa.pt" target="_blank" rel="noopener noreferrer">
                  centroarbitragemlisboa.pt
                </a>.
              </p>
            </section>

          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
