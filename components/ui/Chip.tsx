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
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-t-secondary ${className}`}
    >
      {icon && (
        <span
          className="material-symbols-outlined shrink-0 text-[16px]"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
