"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/client";
import type { AnalyticsSearchContext } from "@/lib/analytics/types";
import type { GalleryPhotoAsset } from "@/lib/domain/public-seo";
import useBackToSearchHref from "@/lib/hooks/useBackToSearchHref";
import {
  CARD_MEDIA_INTERACTION_VARIANTS,
  MEDIA_SWAP_VARIANTS,
  PRESSABLE_MOTION_PROPS,
  TAP_ONLY_MOTION_PROPS,
} from "@/lib/motion/animations";
import { AnimatePresence, motion } from "@/lib/motion/runtime";
import Icon from "@/components/ui/Icon";
import ImageLightbox from "@/components/listing/ImageLightbox";

interface ListingGalleryProps {
  listingId: string;
  pagePath: string;
  searchContext?: AnalyticsSearchContext;
  title: string;
  photos: GalleryPhotoAsset[];
  backHref: string;
  shareUrl: string;
  shareTitle: string;
}

function dedupePhotos(photos: GalleryPhotoAsset[]): GalleryPhotoAsset[] {
  const seen = new Set<string>();
  const ordered: GalleryPhotoAsset[] = [];

  for (const photo of photos) {
    const src = photo.src.trim();
    const thumbSrc = photo.thumbSrc.trim() || src;

    if (!src || seen.has(src)) continue;

    seen.add(src);
    ordered.push({ src, thumbSrc });
  }

  return ordered;
}

const SWIPE_THRESHOLD = 50;

export default function ListingGallery({
  listingId,
  pagePath,
  searchContext,
  title,
  photos,
  backHref,
  shareUrl,
  shareTitle,
}: ListingGalleryProps) {
  const gallery = useMemo(() => dedupePhotos(photos), [photos]);
  const galleryKey = useMemo(
    () => gallery.map((p) => p.src).join("|"),
    [gallery]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const resolvedBackHref = useBackToSearchHref(backHref);

  useEffect(() => {
    setSelectedIndex(0);
  }, [galleryKey]);

  useEffect(() => {
    setIsImageLoading(true);
  }, [selectedIndex]);

  const selectedPhoto = gallery[selectedIndex]?.src ?? gallery[0]?.src ?? "";
  const lightboxPhotos = useMemo(
    () => gallery.map((p) => p.src),
    [gallery]
  );
  const galleryOpenDedupeKey = useMemo(
    () => `${listingId}:${pagePath}`,
    [listingId, pagePath]
  );

  const openLightbox = useCallback(
    (index: number) => {
      void trackEvent({
        eventName: "gallery_opened",
        source: "listing_gallery",
        listingId,
        pagePath,
        searchContext,
        dedupeKey: galleryOpenDedupeKey,
        payload: {
          photoCount: gallery.length,
          startIndex: index + 1,
        },
      });
      setLightboxIndex(index);
    },
    [gallery.length, galleryOpenDedupeKey, listingId, pagePath, searchContext]
  );

  const selectPrev = useCallback(() => {
    if (gallery.length <= 1) return;
    setSelectedIndex((c) => (c === 0 ? gallery.length - 1 : c - 1));
  }, [gallery.length]);

  const selectNext = useCallback(() => {
    if (gallery.length <= 1) return;
    setSelectedIndex((c) => (c === gallery.length - 1 ? 0 : c + 1));
  }, [gallery.length]);

  /* ── Touch swipe (mobile carousel) ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null || e.changedTouches.length !== 1)
        return;
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        if (dx > 0) selectPrev();
        else selectNext();
      }
    },
    [selectPrev, selectNext]
  );

  /* ── Mobile share handler ── */
  const handleMobileShare = useCallback(async () => {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard?.writeText(shareUrl);
    } catch {
      /* silent */
    }
  }, [shareTitle, shareUrl]);

  const mosaicPhotos = gallery.slice(0, 5);

  return (
    <>
      {/* ━━━ MOBILE CAROUSEL ━━━ */}
      <div className="lg:hidden">
        <div
          className="relative touch-pan-y bg-bg-elevated"
          role="region"
          aria-label={`Galería de fotos de ${title}`}
          aria-roledescription="carrusel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {gallery.length > 1
              ? `Foto ${selectedIndex + 1} de ${gallery.length}`
              : ""}
          </span>

          {/* Main image */}
          <div className="relative aspect-[4/3]">
            {isImageLoading && (
              <div
                className="skeleton absolute inset-0 z-10"
                aria-hidden="true"
              />
            )}

            {selectedPhoto && (
              <motion.button
                type="button"
                onClick={() => openLightbox(selectedIndex)}
                {...TAP_ONLY_MOTION_PROPS}
                className="absolute inset-0 z-[5] cursor-zoom-in focus:outline-none"
                aria-label="Abrir visor de fotos"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={selectedPhoto}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={MEDIA_SWAP_VARIANTS}
                    className="absolute inset-0"
                  >
                    <Image
                      src={selectedPhoto}
                      alt={`Foto ${selectedIndex + 1} de ${title}`}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      loading={selectedIndex === 0 ? "eager" : "lazy"}
                      priority={selectedIndex === 0}
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            )}

            {/* Overlay: back button (44px touch target) */}
            <Link
              href={resolvedBackHref}
              className="absolute left-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
              aria-label="Volver a resultados"
            >
              <Icon name="arrow_back" size={20} />
            </Link>

            {/* Overlay: share button (44px touch target) */}
            <motion.button
              type="button"
              onClick={handleMobileShare}
              {...PRESSABLE_MOTION_PROPS}
              className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
              aria-label="Compartir"
            >
              <Icon name="share" size={18} />
            </motion.button>

            {/* Overlay: photo counter */}
            {gallery.length > 1 && (
              <span className="absolute bottom-4 right-4 z-[7] inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {selectedIndex + 1} / {gallery.length}
              </span>
            )}

            {/* Bottom gradient for visual depth */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-16 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* ━━━ DESKTOP MOSAIC ━━━ */}
      <div
        className="hidden lg:block"
        role="region"
        aria-label={`Galería de fotos de ${title}`}
      >
        {mosaicPhotos.length === 1 ? (
          /* Single photo */
          <motion.button
            type="button"
            onClick={() => openLightbox(0)}
            {...TAP_ONLY_MOTION_PROPS}
            className="relative aspect-[16/9] w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Image
              src={mosaicPhotos[0].src}
              alt={`Foto de ${title}`}
              fill
              sizes="70vw"
              className="object-cover"
              priority
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
            {isImageLoading && (
              <div className="skeleton absolute inset-0" aria-hidden="true" />
            )}
          </motion.button>
        ) : (
          /* Mosaic grid */
          <div
            className="grid aspect-[16/9] grid-cols-4 grid-rows-2 gap-[3px] overflow-hidden rounded-xl"
          >
            {mosaicPhotos.map((photo, index) => {
              const isMain = index === 0;
              const isLast = index === mosaicPhotos.length - 1;
              const hasMore = gallery.length > mosaicPhotos.length;

              return (
                <motion.button
                  key={photo.src}
                  type="button"
                  onClick={() => openLightbox(index)}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className={`relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                    isMain ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <motion.div
                    className="absolute inset-0"
                    variants={CARD_MEDIA_INTERACTION_VARIANTS}
                  >
                    <Image
                      src={photo.src}
                      alt={`Foto ${index + 1} de ${title}`}
                      fill
                      sizes={isMain ? "50vw" : "25vw"}
                      className="object-cover"
                      loading={isMain ? "eager" : "lazy"}
                      priority={isMain}
                    />
                  </motion.div>

                  {/* "Ver X fotos" overlay on last cell */}
                  {isLast && hasMore && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                        <Icon name="photo_camera" size={16} />
                        Ver {gallery.length} fotos
                      </span>
                    </div>
                  )}

                  {/* "Ver fotos" for small galleries (all shown in mosaic) */}
                  {isLast && !hasMore && gallery.length > 1 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                        <Icon name="photo_camera" size={16} />
                        Ver fotos
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ━━━ LIGHTBOX (shared) ━━━ */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <ImageLightbox
            photos={lightboxPhotos}
            initialIndex={lightboxIndex}
            title={title}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
