interface IconProps {
  name: string;
  className?: string;
  size?: number;
  decorative?: boolean;
  label?: string;
  title?: string;
}

export default function Icon({
  name,
  className = "",
  size = 20,
  decorative = true,
  label,
  title,
}: IconProps) {
  const a11yProps = decorative
    ? { "aria-hidden": true }
    : {
        role: "img",
        "aria-label": label ?? title ?? name,
      };

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size }}
      {...a11yProps}
      {...(title ? { title } : {})}
    >
      {name}
    </span>
  );
}
