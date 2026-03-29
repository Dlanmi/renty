"use client";

import Link from "next/link";

interface AppErrorScreenProps {
  title?: string;
  description?: string;
  resetLabel?: string;
  onReset?: () => void;
  fullViewport?: boolean;
}

export default function AppErrorScreen({
  title = "Algo salió mal",
  description = "Tuvimos un problema inesperado cargando esta vista. Puedes intentar de nuevo o volver al inicio.",
  resetLabel = "Intentar de nuevo",
  onReset,
  fullViewport = false,
}: AppErrorScreenProps) {
  return (
    <div
      className={`relative isolate overflow-hidden bg-bg-base px-4 py-10 ${
        fullViewport ? "min-h-screen" : "min-h-[calc(100vh-8rem)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_32%)]" />

      <div className="relative mx-auto flex max-w-3xl flex-col justify-center py-8">
        <div className="rounded-[32px] border border-bg-border bg-bg-surface/95 p-6 shadow-[0_20px_80px_rgba(15,17,23,0.16)] backdrop-blur sm:p-8">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.981-1.742 2.981H4.42c-1.53 0-2.492-1.647-1.742-2.98l5.58-9.92zM11 7a1 1 0 10-2 0v3a1 1 0 102 0V7zm-1 7a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Estado de la aplicación
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-t-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-t-secondary sm:text-base">
            {description}
          </p>

          <div className="mt-6 rounded-2xl border border-bg-border bg-bg-elevated/80 p-4 text-sm text-t-secondary">
            Si estabas editando un inmueble, revisa si tu borrador de fotos quedó
            guardado localmente antes de volver a intentar.
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
              >
                {resetLabel}
              </button>
            )}

            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-xl border border-bg-border bg-bg-surface px-5 text-sm font-medium text-t-primary transition-colors hover:bg-bg-elevated"
            >
              Ir al inicio
            </Link>

            <Link
              href="/admin/listings"
              className="inline-flex min-h-11 items-center rounded-xl border border-bg-border bg-bg-surface px-5 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated hover:text-t-primary"
            >
              Volver al admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
