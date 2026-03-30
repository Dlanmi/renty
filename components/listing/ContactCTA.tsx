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
              className="lift-hover flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
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

      <div
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-bg-border bg-bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[22px] font-extrabold leading-tight tracking-tight text-t-primary">
              {formatCOP(price)}
              <span className="text-[13px] font-normal text-t-muted">
                {formatBillingPeriod(billingPeriod)}
              </span>
            </p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-2 py-0.5 text-[11px] font-semibold text-[#25D366]">
              <Icon name="check_circle" size={12} />
              Sin intermediarios
            </span>
          </div>

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-[#20bd5a] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>
      </div>

      {/* Floating WhatsApp Button for desktop */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-[90] hidden h-14 w-14 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base lg:flex"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>
    </>
  );
}
