"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  MEDIA_SWAP_VARIANTS,
  MODAL_PANEL_VARIANTS,
  MOTION_TRANSITIONS,
  OVERLAY_VARIANTS,
  PRESSABLE_COMPACT_MOTION_PROPS,
  PRESSABLE_MOTION_PROPS,
} from "@/lib/motion/animations";
import { AnimatePresence, motion } from "@/lib/motion/runtime";
import Icon from "@/components/ui/Icon";

interface ImageLightboxProps {
  photos: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}

export default function ImageLightbox({
  photos,
  initialIndex,
  title,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(true);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef(0);
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const translateStartRef = useRef({ x: 0, y: 0 });

  const isZoomed = scale > 1.05;
  const showNav = photos.length > 1;
  const imageTransformTransition = isAnimating
    ? {
        x: MOTION_TRANSITIONS.layout,
        y: MOTION_TRANSITIONS.layout,
        scale: MOTION_TRANSITIONS.enter,
      }
    : { duration: 0 };

  const resetZoom = useCallback(() => {
    setIsAnimating(true);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      resetZoom();
      setCurrentIndex(index);
    },
    [resetZoom]
  );

  const goPrev = useCallback(() => {
    if (!showNav) return;
    goTo(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
  }, [currentIndex, photos.length, goTo, showNav]);

  const goNext = useCallback(() => {
    if (!showNav) return;
    goTo(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, photos.length, goTo, showNav]);

  /* ── Keyboard ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, goPrev, goNext]);

  /* ── Desktop click to toggle zoom ── */
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) return;
      if (isZoomed) {
        resetZoom();
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * -rect.width;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -rect.height;
        setIsAnimating(true);
        setScale(2);
        setTranslate({ x, y });
      }
    },
    [isZoomed, resetZoom]
  );

  /* ── Desktop mouse drag when zoomed ── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isZoomed) return;
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      translateStartRef.current = { ...translate };
      setIsAnimating(false);
    },
    [isZoomed, translate]
  );

  useEffect(() => {
    if (!isZoomed) return;

    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setTranslate({
        x: translateStartRef.current.x + dx,
        y: translateStartRef.current.y + dy,
      });
    };

    const onUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsAnimating(true);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isZoomed]);

  /* ── Desktop scroll wheel zoom ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.3 : 0.3;
      setIsAnimating(true);
      setScale((prev) => {
        const next = Math.min(Math.max(prev + delta, 1), 4);
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    },
    []
  );

  /* ── Touch: swipe / double-tap / pinch / drag ── */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
        pinchStartScaleRef.current = scale;
        setIsAnimating(false);
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };

        /* Double-tap */
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          lastTapRef.current = 0;
          if (isZoomed) {
            resetZoom();
          } else {
            const rect = (
              e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const x =
              ((touch.clientX - rect.left) / rect.width - 0.5) * -rect.width;
            const y =
              ((touch.clientY - rect.top) / rect.height - 0.5) * -rect.height;
            setIsAnimating(true);
            setScale(2);
            setTranslate({ x, y });
          }
          return;
        }
        lastTapRef.current = now;

        /* Begin drag when zoomed */
        if (isZoomed) {
          isDraggingRef.current = true;
          dragStartRef.current = { x: touch.clientX, y: touch.clientY };
          translateStartRef.current = { ...translate };
          setIsAnimating(false);
        }
      }
    },
    [scale, isZoomed, resetZoom, translate]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const next = Math.min(
          Math.max(
            pinchStartScaleRef.current * (dist / pinchStartDistRef.current),
            1
          ),
          4
        );
        setScale(next);
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return;
      }

      if (isDraggingRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        setTranslate({
          x: translateStartRef.current.x + (touch.clientX - dragStartRef.current.x),
          y: translateStartRef.current.y + (touch.clientY - dragStartRef.current.y),
        });
      }
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsAnimating(true);
        return;
      }

      /* Swipe when not zoomed */
      if (
        !isZoomed &&
        touchStartRef.current &&
        e.changedTouches.length === 1
      ) {
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        if (Math.abs(dx) > 60) {
          if (dx > 0) goPrev();
          else goNext();
        }
      }
      touchStartRef.current = null;
      setIsAnimating(true);
    },
    [isZoomed, goPrev, goNext]
  );

  /* ── Render ── */
  return createPortal(
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={OVERLAY_VARIANTS}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de fotos: ${title}`}
    >
      {/* ─ Header ─ */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Foto {currentIndex + 1} de {photos.length}
      </span>
      <motion.div
        variants={MODAL_PANEL_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex shrink-0 items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-medium text-white/80">
          {currentIndex + 1} / {photos.length}
        </span>
        <motion.button
          type="button"
          onClick={onClose}
          {...PRESSABLE_MOTION_PROPS}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Cerrar visor de fotos"
        >
          <Icon name="close" size={22} />
        </motion.button>
      </motion.div>

      {/* ─ Image area ─ */}
      <motion.div
        variants={MODAL_PANEL_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{ touchAction: isZoomed ? "none" : "pan-y" }}
      >
        <motion.div
          className={`h-full w-full select-none ${isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
          onClick={handleImageClick}
          onMouseDown={handleMouseDown}
          animate={{
            x: translate.x,
            y: translate.y,
            scale,
          }}
          transition={imageTransformTransition}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={photos[currentIndex]}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={MEDIA_SWAP_VARIANTS}
              className="absolute inset-0"
            >
              <Image
                src={photos[currentIndex]}
                alt={`Foto ${currentIndex + 1} de ${title}`}
                fill
                sizes="100vw"
                className="pointer-events-none object-contain"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Desktop nav */}
        {showNav && !isZoomed && (
          <>
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              {...PRESSABLE_MOTION_PROPS}
              className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:inline-flex"
              aria-label="Foto anterior"
            >
              <Icon name="chevron_left" size={24} />
            </motion.button>
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              {...PRESSABLE_MOTION_PROPS}
              className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 sm:inline-flex"
              aria-label="Foto siguiente"
            >
              <Icon name="chevron_right" size={24} />
            </motion.button>
          </>
        )}

        {/* Mobile zoom hint */}
        {!isZoomed && (
          <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs text-white/50 sm:hidden">
            Doble toque para hacer zoom
          </p>
        )}
      </motion.div>

      {/* ─ Thumbnail strip ─ */}
      {showNav && !isZoomed && (
        <motion.div
          variants={MODAL_PANEL_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-3"
        >
          {photos.map((photo, index) => (
            <motion.button
              key={`${photo}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              {...PRESSABLE_COMPACT_MOTION_PROPS}
              className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                index === currentIndex
                  ? "border-white"
                  : "border-transparent opacity-50 hover:opacity-90"
              }`}
              aria-label={`Ver foto ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            >
              <Image
                src={photo}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>,
    document.body
  );
}
