import { formatCOP, formatBillingPeriod, whatsappLink } from "@/lib/domain/format";
import Icon from "@/components/ui/Icon";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import ShareListingButton from "@/components/listing/ShareListingButton";

interface ContactCTAProps {
  price: number;
  billingPeriod: string;
  phone: string;
  title: string;
  shareUrl: string;
  shareDescription: string;
}

export default function ContactCTA({
  price,
  billingPeriod,
  phone,
  title,
  shareUrl,
  shareDescription,
}: ContactCTAProps) {
  const message = `Hola, estoy interesado(a) en el arriendo: "${title}". ¿Está disponible?`;
  const href = whatsappLink(phone, message);
  const shareTitle = `${title} | Renty`;

  return (
    <>
      <div className="hidden lg:block">
        <div className="lift-hover sticky top-24 overflow-hidden rounded-[24px] border border-bg-border bg-bg-surface shadow-card">
          <div className="border-b border-bg-border bg-gradient-to-br from-accent-dark/20 via-bg-surface to-bg-elevated px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-t-muted">
              Contacto directo
            </p>
            <p className="mt-1 text-2xl font-bold text-t-primary">
              {formatCOP(price)}
              <span className="text-base font-normal text-t-muted">
                {formatBillingPeriod(billingPeriod)}
              </span>
            </p>
          </div>

          <div className="space-y-4 p-6">
            <ul className="space-y-2 text-sm text-t-secondary">
              <li className="flex items-center gap-2">
                <Icon name="bolt" size={16} className="text-accent" />
                Respuesta rapida por WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <Icon name="task_alt" size={16} className="text-accent" />
                Sin intermediarios
              </li>
            </ul>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="lift-hover flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Contactar por WhatsApp
            </a>

            <ShareListingButton
              url={shareUrl}
              title={shareTitle}
              description={shareDescription}
              className="rounded-xl"
            />

            <p className="text-center text-xs text-t-muted">
              Respuesta tipica en menos de 1 hora
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-bg-border bg-bg-surface/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-t-muted">
              Desde
            </p>
            <p className="text-lg font-bold text-t-primary">
              {formatCOP(price)}
              <span className="text-sm font-normal text-t-muted">
                {formatBillingPeriod(billingPeriod)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ShareListingButton
              url={shareUrl}
              title={shareTitle}
              description={shareDescription}
              compact
            />
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="lift-hover inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button for desktop */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-[90] hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base lg:flex"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>
    </>
  );
}
