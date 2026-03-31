import { formatCOP, formatBillingPeriod, whatsappLink } from "@/lib/domain/format";
import { buildListingCostSummary } from "@/lib/domain/listing-insights";
import type { Listing } from "@/lib/domain/types";
import Icon from "@/components/ui/Icon";
import MobilePriceInsight from "@/components/listing/MobilePriceInsight";
import PriceInsightCallout from "@/components/listing/PriceInsightCallout";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import ShareListingButton from "@/components/listing/ShareListingButton";

interface ContactCTAProps {
  listing: Pick<
    Listing,
    | "price_cop"
    | "billing_period"
    | "title"
    | "admin_fee_cop"
    | "utilities_cop_min"
    | "utilities_cop_max"
  >;
  phone: string;
  shareUrl: string;
  shareDescription: string;
}

export default function ContactCTA({
  listing,
  phone,
  shareUrl,
  shareDescription,
}: ContactCTAProps) {
  const { price_cop: price, billing_period: billingPeriod, title } = listing;
  const message = `Hola, estoy interesado(a) en el arriendo: "${title}". ¿Está disponible?`;
  const href = whatsappLink(phone, message);
  const shareTitle = `${title} | Renty`;
  const costSummary = buildListingCostSummary(listing);

  return (
    <>
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          {costSummary.hasBreakdown && (
            <PriceInsightCallout message={costSummary.insightLabel} />
          )}

          <div className="lift-hover overflow-hidden rounded-card-lg border border-bg-border bg-bg-surface shadow-card">
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
              {costSummary.hasBreakdown && (
                <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                    Costo mensual estimado
                  </p>
                  <p className="mt-1 text-lg font-bold text-t-primary">
                    {costSummary.totalLabel}
                  </p>
                  <p className="mt-1 text-xs text-t-secondary">
                    {costSummary.breakdownLabel}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 p-6">
              <ul className="space-y-2 text-sm text-t-secondary">
                <li className="flex items-center gap-2">
                  <Icon name="bolt" size={16} className="text-accent" />
                  Respuesta rápida por WhatsApp
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
                className="lift-hover flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
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
                Respuesta típica en menos de 1 hora
              </p>
            </div>
          </div>
        </div>
      </div>

      <MobilePriceInsight
        enabled={costSummary.hasBreakdown}
        message={costSummary.insightLabel}
      />

      <div
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-bg-border bg-bg-surface shadow-[0_-10px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_-12px_24px_rgba(0,0,0,0.28)] lg:hidden"
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
            {costSummary.hasBreakdown ? (
              <p className="mt-1 text-[12px] font-medium text-t-secondary">
                {costSummary.totalLineLabel}{" "}
                <span className="font-semibold text-t-primary">
                  {costSummary.totalLabel}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-t-muted">Canon mensual</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                <Icon name="check_circle" size={12} />
                Sin intermediarios
              </span>
            </div>
          </div>

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-[18px] bg-[#25D366] px-6 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-[#20bd5a] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
