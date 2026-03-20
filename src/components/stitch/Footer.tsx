const navLinks = [
  { label: "Sobre mim", href: "#" },
  { label: "O meus alojamentos", href: "#" },
  { label: "Termos e Condições", href: "#" },
  { label: "Política de Privacidade", href: "#" },
  { label: "Contacto", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-surface pt-12 pb-8 border-t border-gray-200">
      <div className="container-main flex flex-col gap-8">
        <div>
          <a
            href="#"
            className="font-display font-bold text-[20px] tracking-tight text-text-main mb-4 block"
          >
            Reservation Gonzalo
          </a>
          <p className="text-[14px] text-text-muted max-w-[280px]">
            Estadias exclusivas e memoráveis. Reserve diretamente comigo e
            garanta as melhores tarifas.
          </p>
        </div>

        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] font-medium text-text-main hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

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
      </div>
    </footer>
  );
}
