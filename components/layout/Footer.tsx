import Link from "next/link";
import Icon from "@/components/ui/Icon";

const WHATSAPP_CONTACT_URL = "https://wa.me/573144436688";

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
    <footer className="border-t border-stone-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 rounded-card bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <Icon name="shield" size={20} className="text-amber-600" />
            Tips de seguridad
          </div>
          <ul className="stagger-list grid gap-2 sm:grid-cols-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-amber-700">
                <Icon name="check" size={14} className="mt-0.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-card border border-stone-200 bg-stone-50 px-4 py-4 sm:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-3">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 items-center rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href={WHATSAPP_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            <Icon name="chat" size={17} />
            Contáctanos
          </a>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-stone-400 sm:flex-row">
          <p>© {year} Renty. Todos los derechos reservados.</p>
          <p>Construido con amor en Bogotá.</p>
        </div>
      </div>
    </footer>
  );
}
