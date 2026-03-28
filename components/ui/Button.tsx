import { type ReactNode, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const base =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover hover:shadow-glow px-6 py-3 text-sm",
  secondary:
    "border border-bg-border bg-bg-surface text-t-primary hover:bg-bg-elevated px-5 py-2.5 text-sm",
  ghost:
    "text-t-secondary hover:text-t-primary hover:bg-bg-elevated px-3 py-2 text-sm",
};

export function getButtonClasses(
  variant: ButtonVariant = "primary",
  className = ""
) {
  return `${base} ${variants[variant]} ${className}`.trim();
}

export default function Button({
  variant = "primary",
  className = "",
  type,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={getButtonClasses(variant, className)}
      {...props}
    >
      {children}
    </button>
  );
}
