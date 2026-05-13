import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/shared/components/layout/Navbar'
import Footer from '@/shared/components/layout/Footer'
import CookiePreferencesReset from './CookiePreferencesReset'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Saiba quais os cookies que utilizamos e como os gerir.',
}

export default function CookiesPage() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 container-main px-0">
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
              Política de Cookies
            </h1>
            <p className="text-sm text-slate-400">Última atualização: Março 2026</p>
          </header>

          <div className="prose-legal">

            {/* 1 */}
            <section className="mb-8">
              <h2>1. O que são cookies?</h2>
              <p>
                Os cookies são pequenos ficheiros de texto que são colocados no seu dispositivo
                (computador, smartphone ou tablet) quando visita um website. Permitem que o site
                memorize as suas preferências e comportamentos de navegação para melhorar a sua
                experiência.
              </p>
              <p>
                Os cookies não contêm vírus nem executam programas. São completamente seguros
                e amplamente utilizados em toda a internet.
              </p>
            </section>

            {/* 2 */}
            <section className="mb-8">
              <h2>2. Cookies que utilizamos</h2>

              <h3>Cookies Essenciais</h3>
              <p>
                Estes cookies são necessários para o funcionamento básico do site e não podem
                ser desativados. Não requerem consentimento.
              </p>
              <div className="overflow-x-auto mb-6">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Finalidade</th>
                      <th>Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>rg-cookie-consent</code></td>
                      <td>Essencial</td>
                      <td>Guardar preferências de cookies do utilizador</td>
                      <td>1 ano</td>
                    </tr>
                    <tr>
                      <td><code>next-auth.session-token</code></td>
                      <td>Essencial</td>
                      <td>Manter a sessão autenticada no painel de administração</td>
                      <td>30 dias</td>
                    </tr>
                    <tr>
                      <td><code>__Secure-next-auth.session-token</code></td>
                      <td>Essencial</td>
                      <td>Versão segura (HTTPS) do token de sessão</td>
                      <td>30 dias</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Cookies de Análise</h3>
              <p>
                Estes cookies permitem-nos compreender como os visitantes interagem com o site,
                ajudando-nos a melhorá-lo. Apenas são ativados com o seu consentimento.
              </p>
              <div className="overflow-x-auto mb-6">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Finalidade</th>
                      <th>Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>_ga</code></td>
                      <td>Análise</td>
                      <td>Google Analytics — identificar utilizadores únicos</td>
                      <td>2 anos</td>
                    </tr>
                    <tr>
                      <td><code>_gid</code></td>
                      <td>Análise</td>
                      <td>Google Analytics — distinguir utilizadores</td>
                      <td>24 horas</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3>Cookies de Marketing</h3>
              <p>
                De momento, <strong>não utilizamos cookies de marketing ou publicidade</strong>{' '}
                de terceiros neste website.
              </p>
            </section>

            {/* 3 */}
            <section className="mb-8">
              <h2>3. Como gerir os cookies</h2>

              <h3>Preferências neste site</h3>
              <p>
                Pode alterar as suas preferências de cookies a qualquer momento:
              </p>
              <CookiePreferencesReset />

              <h3>Configurações do browser</h3>
              <p>
                Também pode gerir os cookies diretamente no seu browser. Consulte as instruções
                para o seu browser:
              </p>
              <ul>
                <li>
                  <strong>Google Chrome:</strong> Definições → Privacidade e segurança →
                  Cookies e outros dados de sites
                </li>
                <li>
                  <strong>Mozilla Firefox:</strong> Definições → Privacidade e Segurança →
                  Cookies e dados de sites
                </li>
                <li>
                  <strong>Safari:</strong> Preferências → Privacidade → Gerir dados de websites
                </li>
                <li>
                  <strong>Microsoft Edge:</strong> Definições → Privacidade, pesquisa e serviços →
                  Cookies e permissões de sites
                </li>
              </ul>
              <p>
                Tenha em atenção que desativar todos os cookies pode afetar o funcionamento
                de algumas funcionalidades do site.
              </p>
            </section>

            {/* 4 */}
            <section className="mb-8">
              <h2>4. Alterações a Esta Política</h2>
              <p>
                Esta Política de Cookies pode ser atualizada para refletir alterações nos cookies
                que utilizamos ou por outros motivos operacionais, legais ou regulatórios.
                Recomendamos que consulte esta página periodicamente.
              </p>
              <p>
                Para qualquer questão sobre os cookies que utilizamos, contacte-nos em{' '}
                <a href="mailto:reservas@reservationgonzalo.pt">
                  reservas@reservationgonzalo.pt
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
