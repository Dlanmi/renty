"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { duplicateListingAction } from "@/app/admin/(panel)/listings/actions";

interface DuplicateListingButtonProps {
  listingId: string;
  listingTitle: string;
  compact?: boolean;
}

export default function DuplicateListingButton({
  listingId,
  listingTitle,
  compact = false,
}: DuplicateListingButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleDuplicate = useCallback(async () => {
    setDuplicating(true);
    try {
      const result = await duplicateListingAction(listingId);

      if (result.success) {
        setShowModal(false);
        setToast({
          type: "success",
          message: `El inmueble fue duplicado exitosamente. Redirigiendo...`,
        });
        
        // Small delay so the user sees the toast before redirecting to the new listing
        setTimeout(() => {
          router.push(`/admin/listings/${result.newId}`);
          router.refresh();
        }, 1500);
      } else {
        setDuplicating(false);
        setToast({ type: "error", message: result.error });
        setShowModal(false);
      }
    } catch {
      setDuplicating(false);
      setToast({
        type: "error",
        message: "Ocurrió un error inesperado al duplicar el inmueble.",
      });
      setShowModal(false);
    }
  }, [listingId, router]);

  return (
    <>
      {/* Trigger button */}
      {compact ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="lift-hover inline-flex min-h-8 items-center rounded-full border border-bg-border bg-bg-surface px-3 text-xs font-medium text-t-secondary transition-colors hover:bg-bg-elevated"
          title="Duplicar inmueble"
          aria-label={`Duplicar ${listingTitle}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="lift-hover inline-flex min-h-10 items-center gap-2 rounded-full border border-bg-border bg-bg-surface px-4 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
          </svg>
          Duplicar
        </button>
      )}

      {/* Confirmation modal */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => !duplicating && setShowModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-modal-title"
          >
            <div
              className="w-full max-w-md animate-[fadeScaleIn_0.2s_ease-out] rounded-2xl border border-bg-border bg-bg-surface p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6 text-accent"
                  aria-hidden="true"
                >
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
              </div>

              <h2
                id="duplicate-modal-title"
                className="text-lg font-semibold text-t-primary"
              >
                Duplicar inmueble
              </h2>
              <p className="mt-2 text-sm text-t-secondary">
                ¿Estás seguro de crear una copia de{" "}
                <strong className="font-semibold text-t-primary">
                  {listingTitle}
                </strong>
                ? Se clonarán todos los detalles, estado (como borrador), fotos y puntos de interés.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={duplicating}
                  className="inline-flex min-h-10 items-center rounded-xl border border-bg-border px-4 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-70"
                  aria-live="polite"
                >
                  {duplicating && (
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                  )}
                  {duplicating ? "Duplicando..." : "Sí, duplicar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast notification */}
      {toast &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out]">
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
                toast.type === "success"
                  ? "border-emerald-600/20 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
                  : "border-rose-600/20 bg-rose-600/10 text-rose-800 dark:text-rose-300"
              }`}
            >
              {toast.type === "success" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 flex-shrink-0 text-emerald-600"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 flex-shrink-0 text-rose-600"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p className="max-w-xs text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="ml-2 text-current opacity-60 hover:opacity-100"
                aria-label="Cerrar notificación"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
