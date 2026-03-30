"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  NumericFilterOption,
  SearchFilters,
} from "@/lib/domain/search";
import {
  getBedroomsLabel,
  getPriceLabel,
  normalizeSearchText,
} from "@/lib/domain/search";
import Icon from "@/components/ui/Icon";

const TOTAL_STEPS = 3;
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SearchFlowModalProps {
  isOpen: boolean;
  step: 1 | 2 | 3;
  filters: SearchFilters;
  neighborhoods: string[];
  priceOptions: NumericFilterOption[];
  bedroomOptions: NumericFilterOption[];
  resultsCount: number;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  onStepChange: (step: 1 | 2 | 3) => void;
  onChange: (patch: Partial<SearchFilters>) => void;
}

function stepTitle(step: 1 | 2 | 3): string {
  if (step === 1) return "Ubicación";
  if (step === 2) return "Presupuesto";
  return "Habitaciones";
}

function getStepProgress(step: 1 | 2 | 3): number {
  return Math.round((step / TOTAL_STEPS) * 100);
}

export default function SearchFlowModal({
  isOpen,
  step,
  filters,
  neighborhoods,
  priceOptions,
  bedroomOptions,
  resultsCount,
  onClose,
  onClear,
  onApply,
  onStepChange,
  onChange,
}: SearchFlowModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const filteredNeighborhoods = useMemo(() => {
    const needle = normalizeSearchText(filters.neighborhood);
    if (!needle) return neighborhoods;
    return neighborhoods.filter((neighborhood) =>
      normalizeSearchText(neighborhood).includes(needle)
    );
  }, [filters.neighborhood, neighborhoods]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;
      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      if (step === 1) {
        locationInputRef.current?.focus();
      } else {
        // Focus first focusable element in the current step
        const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
          '.min-h-0 button, .min-h-0 input'
        );
        firstFocusable?.focus();
      }
    });
  }, [isOpen, step]);

  if (!isOpen) return null;

  const isLastStep = step === 3;
  const isFirstStep = step === 1;
  const progress = getStepProgress(step);
  const resultsLabel =
    resultsCount === 1
      ? "Mostrar 1 resultado"
      : `Mostrar ${resultsCount} resultados`;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-hidden bg-bg-base sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-flow-modal-title"
    >
      <div ref={containerRef} className="flex h-full flex-col">
        <header className="shrink-0 border-b border-bg-border px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 id="search-flow-modal-title" className="text-base font-semibold text-t-primary">
              Buscar arriendo
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bg-border text-t-secondary"
              aria-label="Cerrar filtros"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-t-muted">
              <span>
                Paso {step} de {TOTAL_STEPS}
              </span>
              <span>{stepTitle(step)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Paso ${step} de ${TOTAL_STEPS}: ${stepTitle(step)}`}
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4">
          {step === 1 && (
            <section className="space-y-3">
              <label
                htmlFor="search-flow-location"
                className="text-sm font-medium text-t-secondary"
              >
                ¿En qué barrio quieres buscar?
              </label>
              <input
                id="search-flow-location"
                ref={locationInputRef}
                type="text"
                value={filters.neighborhood}
                onChange={(event) =>
                  onChange({ neighborhood: event.target.value })
                }
                placeholder="Ej. Suba, Verbenal, Toberín"
                className="h-12 w-full rounded-xl border border-bg-border bg-bg-surface px-3 text-sm text-t-primary placeholder:text-t-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />

              {filteredNeighborhoods.length > 0 && (
                <ul className="space-y-2">
                  {filteredNeighborhoods.slice(0, 8).map((neighborhood) => (
                    <li key={neighborhood}>
                      <button
                        type="button"
                        onClick={() => onChange({ neighborhood })}
                        className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-bg-border px-3 text-left text-sm text-t-secondary transition-colors hover:bg-bg-elevated"
                      >
                        <Icon name="location_on" size={18} className="text-t-muted" />
                        <span>{neighborhood}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {filters.neighborhood && filteredNeighborhoods.length === 0 && (
                <p className="text-xs text-t-muted">
                  No encontramos coincidencias para esa ubicación.
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-t-secondary">
                ¿Cuál es tu presupuesto máximo?
              </h3>
              <div className="space-y-2">
                {priceOptions.map((option) => {
                  const isActive = filters.maxPriceCOP === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ maxPriceCOP: option.value })}
                      className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-sm transition-colors ${
                        isActive
                          ? "border-accent bg-accent-dark/30 text-accent"
                          : "border-bg-border text-t-secondary hover:bg-bg-elevated"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isActive && <Icon name="check" size={18} />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-t-secondary">
                ¿Cuántas habitaciones mínimas necesitas?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {bedroomOptions.map((option) => {
                  const isActive = filters.minBedrooms === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ minBedrooms: option.value })}
                      className={`flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-accent bg-accent-dark/30 text-accent"
                          : "border-bg-border text-t-secondary hover:bg-bg-elevated"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-bg-border bg-bg-surface px-4 pb-6 pt-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClear}
              className="font-medium text-accent"
            >
              Limpiar todo
            </button>
            <span className="text-t-muted">
              {[
                filters.neighborhood || null,
                filters.maxPriceCOP > 0 ? getPriceLabel(filters.maxPriceCOP) : null,
                filters.minBedrooms > 0 ? getBedroomsLabel(filters.minBedrooms) : null,
              ].filter(Boolean).join(" · ") || "Sin filtros"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (isFirstStep) {
                  onClose();
                  return;
                }
                onStepChange((step - 1) as 1 | 2 | 3);
              }}
              className="min-h-11 rounded-xl border border-bg-border px-4 text-sm font-medium text-t-secondary"
            >
              {isFirstStep ? "Cancelar" : "Atrás"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onApply();
                  return;
                }
                onStepChange((step + 1) as 1 | 2 | 3);
              }}
              className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              {isLastStep ? resultsLabel : "Siguiente"}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
