"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export default function PhotoManager({ photos }: PhotoManagerProps) {
  const [items, setItems] = useState<ManagedPhoto[]>(() =>
    toManagedPhotos(photos)
  );
  const [coverId, setCoverId] = useState<string | null>(() => {
    const cover = photos.find((photo) => photo.is_cover);
    return cover?.id ?? photos[0]?.id ?? null;
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragCountRef = useRef(0);

  const activeItems = useMemo(
    () => items.filter((item) => !item.markedForDelete),
    [items]
  );

  const deletedItems = useMemo(
    () => items.filter((item) => item.markedForDelete),
    [items]
  );

  // Keep coverId valid
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

  // ─── Drag & Drop (desktop) ─────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDraggedId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      // Semi-transparent drag image
      const target = e.currentTarget as HTMLElement;
      if (target) {
        e.dataTransfer.setDragImage(target, target.offsetWidth / 2, 20);
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTargetIndex(index);
    },
    []
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current += 1;
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCountRef.current -= 1;
    if (dragCountRef.current <= 0) {
      setDropTargetIndex(null);
      dragCountRef.current = 0;
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setDropTargetIndex(null);

      if (!draggedId) return;

      setItems((prev) => {
        const fromIndex = prev.findIndex((item) => item.id === draggedId);
        if (fromIndex < 0 || fromIndex === dropIndex) return prev;

        const copy = prev.slice();
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(dropIndex > fromIndex ? dropIndex - 1 : dropIndex, 0, moved);
        return copy;
      });

      setDraggedId(null);
    },
    [draggedId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetIndex(null);
    dragCountRef.current = 0;
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────

  const movePhoto = (id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const to = index + direction;
      if (to < 0 || to >= prev.length) return prev;
      const copy = prev.slice();
      const [moved] = copy.splice(index, 1);
      copy.splice(to, 0, moved);
      return copy;
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
    <div className="mt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-900">
          Fotos del inmueble
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
            {activeItems.length} activas
          </span>
          {deletedItems.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-600">
              {deletedItems.length} por eliminar
            </span>
          )}
        </div>
      </div>

      {/* Tip */}
      <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
        <strong>Arrastra</strong> para reordenar en escritorio. En
        móvil usa los botones ▲ ▼. La primera foto activa será la portada, o
        elige una con el botón ★.
      </p>

      {/* Hidden inputs */}
      {activeItems.map((item, index) => (
        <input
          key={`order-${item.id}`}
          type="hidden"
          name="photo_order"
          value={`${item.id}:${index}`}
        />
      ))}

      {coverId && <input type="hidden" name="cover_photo_id" value={coverId} />}

      {deletedItems.map((item) => (
        <input
          key={`delete-${item.id}`}
          type="hidden"
          name="delete_photo_ids"
          value={item.id}
        />
      ))}

      {/* Photo grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => {
          const isDeleted = item.markedForDelete;
          const isCurrentCover = coverId === item.id && !isDeleted;
          const isDragging = draggedId === item.id;
          const isDropTarget = dropTargetIndex === index && draggedId !== null;

          return (
            <article
              key={item.id}
              draggable={!isDeleted}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative rounded-xl border-2 p-2 transition-all ${
                isDragging
                  ? "scale-95 opacity-50"
                  : ""
              } ${
                isDropTarget
                  ? "border-accent bg-accent/5 shadow-lg"
                  : isDeleted
                    ? "border-rose-200 bg-rose-50"
                    : isCurrentCover
                      ? "border-accent bg-accent/5"
                      : "border-stone-200 bg-white hover:border-stone-300"
              } ${!isDeleted ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Cover badge */}
              {isCurrentCover && (
                <div className="absolute left-3 top-3 z-10 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  ★ Portada
                </div>
              )}

              {/* Order badge */}
              {!isDeleted && (
                <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
                  {activeItems.findIndex((a) => a.id === item.id) + 1}
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-100">
                <Image
                  src={item.publicUrl}
                  alt={item.caption ?? "Foto del inmueble"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={`object-cover transition-opacity ${
                    isDeleted ? "opacity-40 grayscale" : ""
                  }`}
                  draggable={false}
                />

                {/* Drag handle overlay (desktop) */}
                {!isDeleted && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/30 to-transparent pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-0 sm:hover:opacity-100">
                    <div className="rounded-md bg-white/80 px-2 py-1 text-[10px] font-medium text-stone-700 backdrop-blur-sm">
                      Arrastra para reordenar
                    </div>
                  </div>
                )}
              </div>

              {/* Delete overlay text */}
              {isDeleted && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    Se eliminará al guardar
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-2 space-y-1.5">
                {/* Mobile reorder buttons */}
                <div className="flex gap-1.5 sm:hidden">
                  <button
                    type="button"
                    onClick={() => movePhoto(item.id, -1)}
                    disabled={index === 0 || isDeleted}
                    className="flex h-8 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 disabled:opacity-40"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(item.id, 1)}
                    disabled={index === items.length - 1 || isDeleted}
                    className="flex h-8 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-700 disabled:opacity-40"
                  >
                    ▼
                  </button>
                </div>

                {/* Cover + Delete */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCoverId(item.id)}
                    disabled={isDeleted || isCurrentCover}
                    className={`flex h-8 items-center justify-center gap-1 rounded-lg border text-xs font-medium transition-colors ${
                      isCurrentCover
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-stone-200 bg-white text-stone-600 hover:border-accent hover:text-accent disabled:opacity-40"
                    }`}
                  >
                    ★ {isCurrentCover ? "Portada" : "Elegir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDelete(item.id)}
                    className={`flex h-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                      isDeleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
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
