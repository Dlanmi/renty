"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ListingPhoto } from "@/lib/domain/types";

interface PhotoManagerProps {
  photos: ListingPhoto[];
}

interface ManagedPhoto {
  id: string;
  publicUrl: string;
  caption: string | null;
  isCover: boolean;
  markedForDelete: boolean;
}

function toManagedPhotos(photos: ListingPhoto[]): ManagedPhoto[] {
  return photos
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((photo) => ({
      id: photo.id,
      publicUrl: photo.public_url,
      caption: photo.caption,
      isCover: photo.is_cover,
      markedForDelete: false,
    }));
}

function swapItems<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const copy = items.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export default function PhotoManager({ photos }: PhotoManagerProps) {
  const [items, setItems] = useState<ManagedPhoto[]>(() => toManagedPhotos(photos));
  const [coverId, setCoverId] = useState<string | null>(() => {
    const cover = photos.find((photo) => photo.is_cover);
    return cover?.id ?? photos[0]?.id ?? null;
  });

  const activeItems = useMemo(
    () => items.filter((item) => !item.markedForDelete),
    [items]
  );

  useEffect(() => {
    if (!coverId) {
      setCoverId(activeItems[0]?.id ?? null);
      return;
    }

    const coverStillActive = activeItems.some((item) => item.id === coverId);
    if (!coverStillActive) {
      setCoverId(activeItems[0]?.id ?? null);
    }
  }, [activeItems, coverId]);

  const movePhoto = (id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      return swapItems(prev, index, index + direction);
    });
  };

  const toggleDelete = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, markedForDelete: !item.markedForDelete }
          : item
      )
    );
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-stone-700">Fotos actuales</p>
        <p className="text-xs text-muted">
          {activeItems.length} activas · {items.length - activeItems.length} por eliminar
        </p>
      </div>

      {activeItems.map((item, index) => (
        <input
          key={`order-${item.id}`}
          type="hidden"
          name="photo_order"
          value={`${item.id}:${index}`}
        />
      ))}

      {coverId && <input type="hidden" name="cover_photo_id" value={coverId} />}

      {items
        .filter((item) => item.markedForDelete)
        .map((item) => (
          <input
            key={`delete-${item.id}`}
            type="hidden"
            name="delete_photo_ids"
            value={item.id}
          />
        ))}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const isDeleted = item.markedForDelete;
          const isCurrentCover = coverId === item.id && !isDeleted;

          return (
            <article
              key={item.id}
              className={`rounded-xl border p-2 transition-colors ${
                isDeleted
                  ? "border-rose-200 bg-rose-50"
                  : isCurrentCover
                    ? "border-accent bg-accent-light"
                    : "border-stone-200 bg-stone-50"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
                <Image
                  src={item.publicUrl}
                  alt={item.caption ?? "Foto del inmueble"}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className={`object-cover ${isDeleted ? "opacity-60" : ""}`}
                />
              </div>

              <div className="mt-2 space-y-2">
                <p className="text-xs text-stone-700">
                  Orden: {index + 1}
                  {isCurrentCover ? " · Portada" : ""}
                  {isDeleted ? " · Se eliminará" : ""}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => movePhoto(item.id, -1)}
                    disabled={index === 0 || isDeleted}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 disabled:opacity-50"
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(item.id, 1)}
                    disabled={index === items.length - 1 || isDeleted}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 disabled:opacity-50"
                  >
                    Bajar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCoverId(item.id)}
                    disabled={isDeleted}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 disabled:opacity-50"
                  >
                    Portada
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDelete(item.id)}
                    className={`inline-flex min-h-9 items-center justify-center rounded-lg border text-xs font-medium ${
                      isDeleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {isDeleted ? "Restaurar" : "Eliminar"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
