import Icon from "@/components/ui/Icon";

interface PriceInsightCalloutProps {
  message: string;
  compact?: boolean;
  className?: string;
}

export default function PriceInsightCallout({
  message,
  compact = false,
  className = "",
}: PriceInsightCalloutProps) {
  const baseClasses = "border bg-bg-surface text-left text-t-primary";

  const rootClasses = compact
    ? "inline-flex max-w-full items-start gap-2 rounded-[20px] border-bg-border/80 px-3 py-2.5 shadow-[0_18px_34px_rgba(15,23,42,0.12)] backdrop-blur-sm dark:shadow-[0_16px_32px_rgba(0,0,0,0.34)]"
    : "flex w-full items-start gap-3 rounded-[22px] border-bg-border px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.1)] dark:shadow-[0_16px_34px_rgba(0,0,0,0.28)]";

  const iconClasses = compact
    ? "mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent"
    : "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent";

  const textClasses = compact
    ? "text-[11px] font-semibold leading-[1.24] tracking-[-0.01em] text-t-secondary"
    : "text-sm font-semibold leading-[1.35]";

  return (
    <div className={`${baseClasses} ${rootClasses} ${className}`.trim()}>
      <span className={iconClasses}>
        <Icon name="payments" size={compact ? 12 : 15} />
      </span>
      <span className={textClasses}>{message}</span>
    </div>
  );
}
