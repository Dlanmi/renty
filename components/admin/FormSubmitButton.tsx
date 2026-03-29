"use client";

import { useFormStatus } from "react-dom";

interface FormSubmitButtonProps {
  idleLabel: string;
  pendingLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  className?: string;
}

export default function FormSubmitButton({
  idleLabel,
  pendingLabel = "Guardando...",
  busyLabel = "Subiendo fotos...",
  busy = false,
  className = "",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isBusy = pending || busy;
  const currentLabel = pending ? pendingLabel : busy ? busyLabel : idleLabel;

  return (
    <button
      type="submit"
      disabled={isBusy}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70 ${className}`.trim()}
      aria-live="polite"
    >
      {isBusy && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {currentLabel}
    </button>
  );
}
