"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";

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

  useEffect(() => {
    setSelectedIndex(0);
  }, [galleryKey]);

  useEffect(() => {
    setIsImageLoading(true);
  }, [selectedIndex]);

  const selectedPhoto = gallery[selectedIndex] ?? gallery[0] ?? "";
  const showControls = gallery.length > 1;

  const selectPrev = () => {
    if (!showControls) return;
    setSelectedIndex((current) =>
      current === 0 ? gallery.length - 1 : current - 1
    );
  };

  const selectNext = () => {
    if (!showControls) return;
    setSelectedIndex((current) =>
      current === gallery.length - 1 ? 0 : current + 1
    );
  };

  return (
    <div className="overflow-hidden rounded-[26px] border border-bg-border bg-bg-elevated">
      <div className="relative aspect-[4/3] md:aspect-[16/9] md:min-h-[420px]">
        {isImageLoading && (
          <div className="skeleton absolute inset-0 z-10" aria-hidden="true" />
        )}

        {selectedPhoto && (
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
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent p-4 md:p-5">
          <p className="inline-flex rounded-full bg-bg-surface/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-t-secondary">
            Renty verificado
          </p>
          <p className="mt-2 text-sm font-medium text-white md:text-base">
            Explora el detalle completo del inmueble
          </p>
        </div>

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

      {showControls && (
        <div className="flex gap-2 overflow-x-auto border-t border-bg-border bg-bg-surface p-3">
          {gallery.map((photo, index) => {
            const isActive = index === selectedIndex;

            return (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
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
  );
}
