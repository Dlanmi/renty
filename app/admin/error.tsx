"use client";

import { useEffect } from "react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <span className="material-symbols-outlined text-3xl text-danger">
          error
        </span>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-t-primary">
        Algo salió mal
      </h2>
      <p className="mt-1 max-w-sm text-sm text-t-secondary">
        Ocurrió un error inesperado en el panel de administración.
        {error.digest && (
          <span className="mt-1 block text-xs text-t-muted">
            Ref: {error.digest}
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-bg-border bg-bg-surface px-5 py-2.5 text-sm font-medium text-t-secondary shadow-card transition-colors hover:bg-bg-elevated"
      >
        Reintentar
      </button>
    </div>
  );
}
