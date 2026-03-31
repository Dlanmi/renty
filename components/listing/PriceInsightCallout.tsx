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
    ? "inline-flex max-w-[min(240px,calc(100vw-3rem))] items-start gap-2 rounded-[18px] border-bg-border px-3 py-2 shadow-[0_12px_24px_rgba(15,23,42,0.1)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.3)]"
    : "flex w-full items-start gap-3 rounded-[22px] border-bg-border px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.1)] dark:shadow-[0_16px_34px_rgba(0,0,0,0.28)]";

  const iconClasses = compact
    ? "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent"
    : "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent";

  const textClasses = compact
    ? "max-w-[182px] text-[12px] font-semibold leading-[1.28]"
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
