"use client";

import { useFormStatus } from "react-dom";

interface FormSubmitButtonProps {
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
}

export default function FormSubmitButton({
  idleLabel,
  pendingLabel = "Guardando...",
  className = "",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70 ${className}`.trim()}
      aria-live="polite"
    >
      {pending && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
