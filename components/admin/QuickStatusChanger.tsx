"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { quickStatusChangeAction } from "@/app/admin/(panel)/listings/actions";
import type { ListingStatus } from "@/lib/domain/types";

interface QuickStatusChangerProps {
  listingId: string;
  currentStatus: ListingStatus;
}

const STATUS_OPTIONS: Array<{ value: ListingStatus; label: string }> = [
  { value: "draft", label: "Borrador" },
  { value: "pending_review", label: "Pendiente" },
  { value: "active", label: "Activo" },
  { value: "rented", label: "Arrendado" },
  { value: "inactive", label: "Inactivo" },
  { value: "rejected", label: "Rechazado" },
];

function statusChipClasses(status: ListingStatus): string {
  if (status === "active") return "border-emerald-600/20 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400";
  if (status === "rented") return "border-amber-600/20 bg-amber-600/10 text-amber-700 hover:bg-amber-600/15 dark:text-amber-400";
  if (status === "draft" || status === "pending_review")
    return "border-bg-border bg-bg-elevated text-t-secondary hover:bg-bg-elevated";
  return "border-rose-600/20 bg-rose-600/10 text-rose-700 hover:bg-rose-600/15 dark:text-rose-400"; // For rejected/inactive
}

export default function QuickStatusChanger({
  listingId,
  currentStatus,
}: QuickStatusChangerProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
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

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as ListingStatus;
      if (newStatus === currentStatus) return;

      setUpdating(true);
      try {
        const result = await quickStatusChangeAction(listingId, newStatus);
        
        if (result.success) {
          setToast({
            type: "success",
            message: `Estado actualizado a "${STATUS_OPTIONS.find(o => o.value === newStatus)?.label}".`,
          });
          router.refresh(); // Refresh to update the UI
        } else {
          setToast({ type: "error", message: result.error });
        }
      } catch {
        setToast({
          type: "error",
          message: "Ocurrió un error inesperado al actualizar el estado.",
        });
      } finally {
        setUpdating(false);
      }
    },
    [listingId, currentStatus, router]
  );

  return (
    <>
      <div className="relative inline-flex items-center">
        <select
          value={currentStatus}
          onChange={handleChange}
          disabled={updating}
          title="Cambiar estado"
          className={`h-8 appearance-none rounded-full border py-1 pl-3 pr-8 text-xs font-medium outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 ${updating ? 'cursor-wait' : 'cursor-pointer'} ${statusChipClasses(currentStatus)}`}
          aria-label="Cambiar estado"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        
        {/* Dropdown arrow icon */}
        <div className="pointer-events-none absolute right-2.5 flex h-full items-center">
          {updating ? (
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent/40 border-t-accent"
              aria-hidden="true"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-3 w-3 text-t-muted"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
        </div>
      </div>

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
