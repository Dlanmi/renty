"use client";

import { useState } from "react";
import type { ListingPoi, ListingPoiKind } from "@/lib/domain/types";
import { POI_KIND_LABELS } from "@/lib/domain/admin-suggestions";

interface PoiEditorProps {
  pois?: ListingPoi[];
}

interface PoiRow {
  id: string;
  kind: ListingPoiKind;
  name: string;
  distanceM: string;
  walkMinutes: string;
}

const POI_KINDS: ListingPoiKind[] = [
  "park",
  "transport",
  "supermarket",
  "pharmacy",
  "school",
  "hospital",
  "other",
];

let nextTempId = 0;
function tempId(): string {
  nextTempId += 1;
  return `poi-temp-${nextTempId}-${Date.now()}`;
}

function fromListingPois(pois: ListingPoi[]): PoiRow[] {
  return pois.map((poi) => ({
    id: tempId(),
    kind: poi.kind,
    name: poi.name,
    distanceM: poi.distance_m != null ? String(poi.distance_m) : "",
    walkMinutes: poi.walk_minutes != null ? String(poi.walk_minutes) : "",
  }));
}

function toTextValue(rows: PoiRow[]): string {
  return rows
    .filter((row) => row.name.trim())
    .map((row) =>
      [row.kind, row.name.trim(), row.distanceM.trim(), row.walkMinutes.trim()].join(
        "|"
      )
    )
    .join("\n");
}

export default function PoiEditor({ pois = [] }: PoiEditorProps) {
  const [rows, setRows] = useState<PoiRow[]>(() => fromListingPois(pois));

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: tempId(), kind: "other", name: "", distanceM: "", walkMinutes: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof PoiRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const serialized = toTextValue(rows);

  return (
    <div className="space-y-3">
      <input type="hidden" name="pois_text" value={serialized} />

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_2fr_80px_80px_36px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2"
            >
              <select
                value={row.kind}
                onChange={(e) =>
                  updateRow(row.id, "kind", e.target.value)
                }
                className="h-9 w-full rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-900"
              >
                {POI_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {POI_KIND_LABELS[kind] ?? kind}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRow(row.id, "name", e.target.value)}
                placeholder="Nombre del lugar"
                className="h-9 w-full rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-900"
              />

              <input
                type="number"
                value={row.distanceM}
                onChange={(e) =>
                  updateRow(row.id, "distanceM", e.target.value)
                }
                placeholder="m"
                min={0}
                className="h-9 w-full rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-900"
                title="Distancia en metros"
              />

              <input
                type="number"
                value={row.walkMinutes}
                onChange={(e) =>
                  updateRow(row.id, "walkMinutes", e.target.value)
                }
                placeholder="min"
                min={0}
                className="h-9 w-full rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-900"
                title="Minutos a pie"
              />

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                aria-label="Eliminar punto cercano"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
        </svg>
        Agregar punto cercano
      </button>

      {rows.length === 0 && (
        <p className="text-xs text-muted">
          Agrega puntos de interés cercanos al inmueble como parques,
          estaciones de transporte o supermercados.
        </p>
      )}
    </div>
  );
}
