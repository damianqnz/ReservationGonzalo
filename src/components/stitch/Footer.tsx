import Link from 'next/link'

const navLinks = [
  { label: 'Sobre mim',            href: '/about'   },
  { label: 'Os meus alojamentos',  href: '/#propriedades' },
  { label: 'Termos e Condições',   href: '/terms'   },
  { label: 'Política de Privacidade', href: '/privacy' },
  { label: 'Contacto',             href: 'mailto:reservas@reservationgonzalo.pt' },
]

export default function Footer() {
  return (
    <footer className="bg-surface pt-12 pb-8 border-t border-gray-200">
      <div className="container-main flex flex-col gap-8">
        <div>
          <Link
            href="/"
            className="font-display font-bold text-[20px] tracking-tight text-text-main mb-4 block"
          >
            Reservation Gonzalo
          </Link>
          <p className="text-[14px] text-text-muted max-w-[280px]">
            Estadias exclusivas e memoráveis. Reserve diretamente comigo e
            garanta as melhores tarifas.
          </p>
        </div>

        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-medium text-text-main hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Social row */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-text-muted">
            © 2026 ReservationGonzalo. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <a
              aria-label="Instagram"
              href="#"
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
            <a
              aria-label="Facebook"
              href="#"
              className="text-text-muted hover:text-text-main transition-colors"
            >
              <span className="material-symbols-outlined">thumb_up</span>
            </a>
          </div>
        </div>

        {/* Legal bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <p className="text-[12px] text-text-muted">
            AL: [AL-NÚMERO]
          </p>
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Link href="/privacy" className="hover:text-text-main transition-colors">
              Privacidade
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-text-main transition-colors">
              Termos
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/cookies" className="hover:text-text-main transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
