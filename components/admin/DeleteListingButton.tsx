"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteListingAction } from "@/app/admin/(panel)/listings/actions";

interface DeleteListingButtonProps {
  listingId: string;
  listingTitle: string;
  /** When true, renders a compact trash-icon-only button (for list views). */
  compact?: boolean;
}

export default function DeleteListingButton({
  listingId,
  listingTitle,
  compact = false,
}: DeleteListingButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const result = await deleteListingAction(listingId);

      if (result.success) {
        setShowModal(false);
        setToast({
          type: "success",
          message: `El inmueble "${result.title}" fue eliminado correctamente.`,
        });
        // Small delay so the user sees the toast before redirecting
        setTimeout(() => {
          router.push("/admin/listings");
          router.refresh();
        }, 1500);
      } else {
        setDeleting(false);
        setToast({ type: "error", message: result.error });
        setShowModal(false);
      }
    } catch {
      setDeleting(false);
      setToast({
        type: "error",
        message: "Ocurrió un error inesperado al eliminar el inmueble.",
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
          className="lift-hover inline-flex min-h-8 items-center rounded-full border border-rose-600/20 bg-rose-600/10 px-3 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-600/15"
          title="Eliminar inmueble"
          aria-label={`Eliminar ${listingTitle}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="lift-hover inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-600/20 bg-rose-600/10 px-4 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-600/15"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
          Eliminar inmueble
        </button>
      )}

      {/* Confirmation modal — rendered via portal to escape transform parents */}
      {showModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => !deleting && setShowModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div
              className="w-full max-w-md animate-[fadeScaleIn_0.2s_ease-out] rounded-2xl border border-bg-border bg-bg-surface p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-600/15">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6 text-rose-600"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <h2
                id="delete-modal-title"
                className="text-lg font-semibold text-t-primary"
              >
                Eliminar inmueble
              </h2>
              <p className="mt-2 text-sm text-t-secondary">
                ¿Estás seguro de eliminar{" "}
                <strong className="font-semibold text-t-primary">
                  {listingTitle}
                </strong>
                ? Se borrarán todas sus fotos, puntos cercanos y registros de
                auditoría. <span className="text-rose-600 font-medium">Esta acción no se puede deshacer.</span>
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={deleting}
                  className="inline-flex min-h-10 items-center rounded-xl border border-bg-border px-4 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                  aria-live="polite"
                >
                  {deleting && (
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                  )}
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast notification — rendered via portal to escape transform parents */}
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
                  className="h-5 w-5 text-emerald-600 flex-shrink-0"
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
                  className="h-5 w-5 text-rose-600 flex-shrink-0"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p className="text-sm font-medium max-w-xs">{toast.message}</p>
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
