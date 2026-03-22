import { type ReactNode, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-dark px-6 py-3 text-sm",
  secondary:
    "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 px-5 py-2.5 text-sm",
  ghost: "text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-3 py-2 text-sm",
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
