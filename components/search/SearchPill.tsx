"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface SearchPillProps {
  filters: SearchFilters;
  neighborhoods: string[];
  priceOptions: NumericFilterOption[];
  bedroomOptions: NumericFilterOption[];
  activeFilterCount: number;
  onOpenMobileFlow: () => void;
  onChange: (patch: Partial<SearchFilters>) => void;
  onClearApplied: () => void;
}

type OpenPanel = "location" | "price" | "bedrooms" | null;

const PANEL_IDS = {
  location: "search-pill-location-panel",
  price: "search-pill-price-panel",
  bedrooms: "search-pill-bedrooms-panel",
} as const;

export default function SearchPill({
  filters,
  neighborhoods,
  priceOptions,
  bedroomOptions,
  activeFilterCount,
  onOpenMobileFlow,
  onChange,
  onClearApplied,
}: SearchPillProps) {
  const [open, setOpen] = useState<OpenPanel>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const locationLabel = filters.neighborhood || "¿Dónde quieres vivir?";
  const priceLabel = getPriceLabel(filters.maxPriceCOP);
  const bedroomLabel = getBedroomsLabel(filters.minBedrooms);

  const filteredNeighborhoods = useMemo(() => {
    const needle = normalizeSearchText(filters.neighborhood);
    if (!needle) return neighborhoods;
    return neighborhoods.filter((neighborhood) =>
      normalizeSearchText(neighborhood).includes(needle)
    );
  }, [filters.neighborhood, neighborhoods]);

  const toggle = (panel: OpenPanel) =>
    setOpen((prev) => (prev === panel ? null : panel));

  useEffect(() => {
    if (open !== "location") return;
    locationInputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="sticky top-16 z-[60] pb-2 sm:hidden">
        <div className="rounded-card-lg border border-bg-border bg-bg-base/90 p-2 shadow-md backdrop-blur">
          <div className="lift-hover flex items-center gap-2 rounded-2xl border border-bg-border bg-bg-surface p-2 shadow-card">
            <button
              type="button"
              onClick={onOpenMobileFlow}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-left text-sm text-t-secondary transition-colors hover:bg-bg-elevated"
            >
              <Icon name="location_on" size={18} className="shrink-0 text-t-muted" />
              <span className="line-clamp-1 min-w-0">{locationLabel}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMobileFlow}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-bg-border px-3 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated"
            >
              <Icon name="tune" size={18} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-bg-border bg-bg-surface/90 p-2">
              {filters.neighborhood && (
                <button
                  type="button"
                  onClick={() => onChange({ neighborhood: "" })}
                  aria-label={`Eliminar filtro: ${filters.neighborhood}`}
                  className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-full border border-bg-border bg-bg-surface px-3 text-xs text-t-secondary transition-colors hover:bg-bg-elevated active:scale-95"
                >
                  <span className="truncate">{filters.neighborhood}</span>
                  <Icon name="close" size={14} />
                </button>
              )}
              {filters.maxPriceCOP > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ maxPriceCOP: 0 })}
                  aria-label={`Eliminar filtro de precio: ${priceLabel}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-bg-border bg-bg-surface px-3 text-xs text-t-secondary transition-colors hover:bg-bg-elevated active:scale-95"
                >
                  {priceLabel}
                  <Icon name="close" size={14} />
                </button>
              )}
              {filters.minBedrooms > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ minBedrooms: 0 })}
                  aria-label={`Eliminar filtro de habitaciones: ${bedroomLabel}`}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-bg-border bg-bg-surface px-3 text-xs text-t-secondary transition-colors hover:bg-bg-elevated active:scale-95"
                >
                  {bedroomLabel}
                  <Icon name="close" size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={onClearApplied}
                className="inline-flex min-h-9 items-center rounded-full px-2 text-xs font-medium text-accent"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-[70] hidden px-4 sm:block">
        <div
          ref={containerRef}
          className="lift-hover relative flex items-center divide-x divide-bg-border rounded-full border border-bg-border bg-bg-surface shadow-card transition-shadow hover:shadow-card-hover"
        >
          <button
            type="button"
            onClick={() => toggle("location")}
            aria-controls={PANEL_IDS.location}
            aria-expanded={open === "location"}
            aria-haspopup="dialog"
            className="flex flex-1 flex-col px-5 py-3 text-left"
          >
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-t-muted">
              <Icon name="location_on" size={13} />
              Dónde
            </span>
            <span
              className={`text-[13px] leading-snug ${
                filters.neighborhood ? "text-t-primary" : "text-t-muted"
              }`}
            >
              {filters.neighborhood || "Verbenal, Toberín..."}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggle("price")}
            aria-controls={PANEL_IDS.price}
            aria-expanded={open === "price"}
            aria-haspopup="dialog"
            className="flex flex-1 flex-col px-5 py-3 text-left"
          >
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-t-muted">
              <Icon name="payments" size={13} />
              Presupuesto
            </span>
            <span
              className={`text-[13px] leading-snug ${
                filters.maxPriceCOP > 0 ? "text-t-primary" : "text-t-muted"
              }`}
            >
              {priceLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggle("bedrooms")}
            aria-controls={PANEL_IDS.bedrooms}
            aria-expanded={open === "bedrooms"}
            aria-haspopup="dialog"
            className="flex flex-1 flex-col px-5 py-3 text-left"
          >
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-t-muted">
              <Icon name="bed" size={13} />
              Habitaciones
            </span>
            <span
              className={`text-[13px] leading-snug ${
                filters.minBedrooms > 0 ? "text-t-primary" : "text-t-muted"
              }`}
            >
              {bedroomLabel}
            </span>
          </button>

          <div className="pr-2">
            {open ? (
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover hover:shadow-glow"
                aria-label="Cerrar panel de búsqueda"
              >
                <Icon name="close" size={20} />
              </button>
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white"
                aria-hidden="true"
              >
                <Icon name="search" size={20} />
              </div>
            )}
          </div>

          {open === "location" && (
            <div
              id={PANEL_IDS.location}
              role="dialog"
              aria-label="Filtrar por barrio"
              className="absolute left-0 top-full z-[90] mt-2 w-72 origin-top rounded-2xl border border-bg-border bg-bg-elevated p-3 shadow-lg animate-[fadeScaleIn_150ms_ease-out]"
            >
              <input
                ref={locationInputRef}
                type="text"
                aria-label="Buscar por barrio"
                placeholder="Buscar barrio..."
                value={filters.neighborhood}
                onChange={(event) => onChange({ neighborhood: event.target.value })}
                className="h-11 w-full rounded-lg border border-bg-border bg-bg-surface px-3 text-sm text-t-primary placeholder:text-t-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {filteredNeighborhoods.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {filteredNeighborhoods.slice(0, 8).map((neighborhood) => (
                    <li key={neighborhood}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ neighborhood });
                          setOpen(null);
                        }}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-t-secondary transition-colors hover:bg-bg-surface"
                      >
                        <Icon name="location_on" size={16} className="text-t-muted" />
                        {neighborhood}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {filters.neighborhood && filteredNeighborhoods.length === 0 && (
                <p className="mt-2 px-1 text-xs text-t-muted">
                  No encontramos barrios con ese nombre.
                </p>
              )}
            </div>
          )}

          {open === "price" && (
            <div
              id={PANEL_IDS.price}
              role="dialog"
              aria-label="Filtrar por precio"
              className="absolute left-1/2 top-full z-[90] mt-2 w-56 origin-top -translate-x-1/2 rounded-2xl border border-bg-border bg-bg-elevated p-2 shadow-lg animate-[fadeScaleIn_150ms_ease-out]"
            >
              {priceOptions.map((option) => {
                const isActive = filters.maxPriceCOP === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange({ maxPriceCOP: option.value });
                      setOpen(null);
                    }}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                      isActive
                        ? "bg-accent-dark/30 font-medium text-accent"
                        : "text-t-secondary hover:bg-bg-surface"
                    }`}
                  >
                    <Icon
                      name="payments"
                      size={16}
                      className={isActive ? "text-accent" : "text-t-muted"}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {open === "bedrooms" && (
            <div
              id={PANEL_IDS.bedrooms}
              role="dialog"
              aria-label="Filtrar por habitaciones"
              className="absolute right-0 top-full z-[90] mt-2 w-44 origin-top rounded-2xl border border-bg-border bg-bg-elevated p-2 shadow-lg animate-[fadeScaleIn_150ms_ease-out]"
            >
              {bedroomOptions.map((option) => {
                const isActive = filters.minBedrooms === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange({ minBedrooms: option.value });
                      setOpen(null);
                    }}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors ${
                      isActive
                        ? "bg-accent-dark/30 font-medium text-accent"
                        : "text-t-secondary hover:bg-bg-surface"
                    }`}
                  >
                    <Icon
                      name="bed"
                      size={16}
                      className={isActive ? "text-accent" : "text-t-muted"}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
