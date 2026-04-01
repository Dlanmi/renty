import Icon from "@/components/ui/Icon";

interface ChipProps {
  icon?: string;
  label: string;
  className?: string;
}

export default function Chip({
  icon,
  label,
  className = "",
}: ChipProps) {
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-bg-border bg-bg-elevated px-3 py-1 text-xs font-medium text-t-secondary ${className}`}
    >
      {icon && <Icon name={icon} size={16} className="shrink-0" />}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
