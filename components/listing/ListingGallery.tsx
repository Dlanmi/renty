"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import ImageLightbox from "@/components/listing/ImageLightbox";

interface ListingGalleryProps {
  title: string;
  photos: string[];
}

function dedupePhotos(photos: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const raw of photos) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    ordered.push(value);
  }

  return ordered;
}

export default function ListingGallery({ title, photos }: ListingGalleryProps) {
  const gallery = useMemo(() => dedupePhotos(photos), [photos]);
  const galleryKey = useMemo(() => gallery.join("|"), [gallery]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [galleryKey]);

  useEffect(() => {
    setIsImageLoading(true);
  }, [selectedIndex]);

  const selectedPhoto = gallery[selectedIndex] ?? gallery[0] ?? "";
  const showControls = gallery.length > 1;

  const selectPrev = useCallback(() => {
    if (!showControls) return;
    setSelectedIndex((current) =>
      current === 0 ? gallery.length - 1 : current - 1
    );
  }, [showControls, gallery.length]);

  const selectNext = useCallback(() => {
    if (!showControls) return;
    setSelectedIndex((current) =>
      current === gallery.length - 1 ? 0 : current + 1
    );
  }, [showControls, gallery.length]);

  const handleKeyDown = useCallback(
    (e: { key: string; preventDefault: () => void }) => {
      if (!showControls) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        selectNext();
      }
    },
    [showControls, selectPrev, selectNext]
  );

  return (
    <>
      <div
        className="overflow-hidden rounded-[26px] border border-bg-border bg-bg-elevated"
        role="region"
        aria-label={`Galería de fotos de ${title}`}
        aria-roledescription="carrusel"
        onKeyDown={handleKeyDown}
      >
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {gallery.length > 1
            ? `Foto ${selectedIndex + 1} de ${gallery.length}`
            : ""}
        </span>

        {/* ── Main image ── */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] md:min-h-[420px]">
          {isImageLoading && (
            <div
              className="skeleton absolute inset-0 z-10"
              aria-hidden="true"
            />
          )}

          {selectedPhoto && (
            <button
              type="button"
              onClick={() => setLightboxIndex(selectedIndex)}
              className="absolute inset-0 z-[5] cursor-zoom-in focus:outline-none"
              aria-label="Abrir visor de fotos"
            >
              <Image
                key={selectedPhoto}
                src={selectedPhoto}
                alt={`Foto ${selectedIndex + 1} de ${title}`}
                fill
                sizes="(max-width: 768px) 100vw, 70vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.01]"
                loading={selectedIndex === 0 ? "eager" : "lazy"}
                priority={selectedIndex === 0}
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </button>
          )}

          {/* Photo counter — mobile only */}
          {gallery.length > 1 && (
            <span className="absolute bottom-4 right-4 z-[7] inline-flex items-center gap-1 rounded-full bg-bg-surface/80 px-2.5 py-1 text-xs font-semibold text-t-primary backdrop-blur-sm md:hidden">
              {selectedIndex + 1} / {gallery.length}
            </span>
          )}

          {/* Overlay bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] bg-gradient-to-t from-black/60 via-black/15 to-transparent p-4 md:p-5">
            <p className="inline-flex rounded-full bg-bg-surface/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-t-secondary">
              Renty verificado
            </p>
            <p className="mt-2 text-sm font-medium text-white md:text-base">
              Explora el detalle completo del inmueble
            </p>
          </div>

          {/* "Ver fotos" badge */}
          {gallery.length > 1 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(selectedIndex)}
              className="absolute right-3 top-3 z-[15] inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/65"
            >
              <Icon name="photo_camera" size={16} />
              Ver {gallery.length} fotos
            </button>
          )}

          {/* Nav arrows */}
          {showControls && (
            <>
              <button
                type="button"
                onClick={selectPrev}
                className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/55"
                aria-label="Foto anterior"
              >
                <Icon name="chevron_left" size={22} />
              </button>
              <button
                type="button"
                onClick={selectNext}
                className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/55"
                aria-label="Foto siguiente"
              >
                <Icon name="chevron_right" size={22} />
              </button>
            </>
          )}
        </div>

        {/* ── Thumbnails ── */}
        {showControls && (
          <div className="flex gap-2 overflow-x-auto border-t border-bg-border bg-bg-surface p-3">
            {gallery.map((photo, index) => {
              const isActive = index === selectedIndex;

              return (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  tabIndex={isActive ? 0 : -1}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    isActive
                      ? "border-accent shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <Image
                    src={photo}
                    alt={`Miniatura ${index + 1} de ${title}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <ImageLightbox
          photos={gallery}
          initialIndex={lightboxIndex}
          title={title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
