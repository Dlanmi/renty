import Link from "next/link";
import { getRentyPublishWhatsAppUrl } from "@/lib/domain/contact";
import Icon from "@/components/ui/Icon";

const WHATSAPP_CONTACT_URL = getRentyPublishWhatsAppUrl();

const TIPS = [
  "Nunca pagues sin visitar el inmueble",
  "Desconfía de precios demasiado bajos",
  "Exige contrato de arrendamiento firmado",
  "Verifica la identidad del propietario",
];

const FOOTER_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Publicar inmueble", href: "/publicar" },
  { label: "Sobre nosotros", href: "/nosotros" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-bg-border bg-bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 rounded-card border border-bg-border bg-bg-elevated p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
            <Icon name="shield" size={20} />
            Tips de seguridad
          </div>
          <ul className="stagger-list grid gap-2 sm:grid-cols-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-t-secondary">
                <Icon name="check" size={14} className="mt-0.5 shrink-0 text-accent" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-card border border-bg-border bg-bg-elevated px-4 py-4 sm:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-3">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 items-center rounded-full border border-bg-border bg-bg-surface px-4 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated hover:text-t-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href={WHATSAPP_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-whatsapp px-4 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
          >
            <Icon name="chat" size={17} />
            Contáctanos
            <span className="sr-only">(abre en nueva pestaña)</span>
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-t-muted sm:flex-row">
          <p>&copy; {year} Renty. Todos los derechos reservados.</p>
          <p>
            Construido con{" "}
            <span className="text-accent">&#9829;</span>{" "}
            en Bogotá.
          </p>
        </div>
      </div>
    </footer>
  );
}
