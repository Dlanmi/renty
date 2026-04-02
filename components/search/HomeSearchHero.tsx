"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import heroBackground from "@/app/assets/home-hero-bg.jpg";
import type {
  NumericFilterOption,
  SearchFilters,
} from "@/lib/domain/search";
import { normalizeSearchText } from "@/lib/domain/search";
import {
  LIST_ITEM_REVEAL_VARIANTS,
  NUDGE_COMPACT_MOTION_PROPS,
  PRESSABLE_MOTION_PROPS,
  POPOVER_VARIANTS,
  STATUS_SWAP_VARIANTS,
  STAGGER_FAST_VARIANTS,
  STAGGER_CONTAINER_VARIANTS,
  SURFACE_REVEAL_VARIANTS,
} from "@/lib/motion/animations";
import { AnimatePresence, motion, useReducedMotion } from "@/lib/motion/runtime";
import Icon from "@/components/ui/Icon";
import {
  HOME_SEARCH_HERO_CARD_POSITION_CLASS,
  HOME_SEARCH_HERO_MEDIA_HEIGHT_CLASS,
  HOME_SEARCH_HERO_OVERLAY_SHELL_CLASS,
} from "@/components/search/homeSearchHeroLayout";

interface NeighborhoodOption {
  count: number;
  name: string;
}

interface HomeSearchHeroProps {
  draftFilters: SearchFilters;
  neighborhoodOptions: NeighborhoodOption[];
  priceOptions: NumericFilterOption[];
  bedroomOptions: NumericFilterOption[];
  activeFilterCount: number;
  draftCount: number;
  hasDraftChanges: boolean;
  onDraftChange: (patch: Partial<SearchFilters>) => void;
  onSubmit: () => void;
  onClear: () => void;
  onResetDraft: () => void;
}

interface SearchFieldProps {
  children: ReactNode;
  icon: string;
  label: string;
}

function SearchField({ children, icon, label }: SearchFieldProps) {
  return (
    <label className="block min-w-0 rounded-[16px] border border-transparent bg-bg-elevated px-4 py-3.5 transition-[background-color] hover:bg-bg-base focus-within:bg-bg-base dark:bg-bg-surface dark:hover:bg-bg-elevated dark:focus-within:bg-bg-elevated">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-t-muted">
        <Icon name={icon} size={14} className="text-t-muted" />
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

interface SearchSelectFieldProps {
  ariaLabel: string;
  options: NumericFilterOption[];
  value: number;
  onChange: (nextValue: number) => void;
}

function SelectChevron() {
  return (
    <Icon
      name="chevron_right"
      size={18}
      className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-t-muted"
    />
  );
}

function SearchSelectField({
  ariaLabel,
  options,
  value,
  onChange,
}: SearchSelectFieldProps) {
  return (
    <div className="relative min-w-0">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full min-w-0 appearance-none bg-transparent pr-7 text-base font-medium leading-6 text-t-primary outline-none focus-visible:shadow-none sm:text-[15px]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <SelectChevron />
    </div>
  );
}

const CHAR_STAGGER_S = 0.045;
const STAY_DURATION_MS = 5000;
const EXIT_DURATION_S = 0.3;

function RotatingNeighborhood({ names }: { names: string[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "visible" | "exiting">(
    "typing"
  );
  const prefersReducedMotion = useReducedMotion();

  const current = names.length > 0 ? names[index % names.length] : "";
  const typeDuration = current.length * CHAR_STAGGER_S * 1000 + 200;

  useEffect(() => {
    if (names.length <= 1 || prefersReducedMotion) return;

    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      timer = setTimeout(() => setPhase("visible"), typeDuration);
    } else if (phase === "visible") {
      timer = setTimeout(() => setPhase("exiting"), STAY_DURATION_MS);
    } else if (phase === "exiting") {
      timer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % names.length);
        setPhase("typing");
      }, EXIT_DURATION_S * 1000);
    }

    return () => clearTimeout(timer);
  }, [phase, names.length, typeDuration, prefersReducedMotion]);

  if (names.length === 0) return null;

  if (prefersReducedMotion) {
    return <span className="text-accent">{current}</span>;
  }

  const chars = current.split("");

  return (
    <span className="inline" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          className="inline"
          exit={{
            opacity: 0,
            y: -10,
            filter: "blur(4px)",
            transition: { duration: EXIT_DURATION_S, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          {chars.map((char, i) => (
            <motion.span
              key={`${current}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * CHAR_STAGGER_S,
                duration: 0.08,
                ease: "easeOut",
              }}
              className="inline-block text-accent"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
          {/* Cursor */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              delay: chars.length * CHAR_STAGGER_S,
              duration: 0.8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="inline-block w-[2px] translate-y-[1px] self-stretch bg-accent align-baseline"
            style={{ height: "0.85em", marginLeft: "2px" }}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SearchHeroCard({
  draftFilters,
  neighborhoodOptions,
  priceOptions,
  bedroomOptions,
  activeFilterCount,
  draftCount,
  hasDraftChanges,
  onDraftChange,
  onSubmit,
  onClear,
  onResetDraft,
}: HomeSearchHeroProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const topNeighborhoodNames = useMemo(
    () => neighborhoodOptions.slice(0, 6).map((n) => n.name),
    [neighborhoodOptions]
  );

  const normalizedQuery = normalizeSearchText(draftFilters.neighborhood);

  const visibleNeighborhoods = useMemo(() => {
    if (!normalizedQuery) {
      return neighborhoodOptions.slice(0, 6);
    }

    return neighborhoodOptions
      .filter((option) =>
        normalizeSearchText(option.name).includes(normalizedQuery)
      )
      .sort((a, b) => {
        const aStarts = normalizeSearchText(a.name).startsWith(normalizedQuery);
        const bStarts = normalizeSearchText(b.name).startsWith(normalizedQuery);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        if (a.count !== b.count) return b.count - a.count;
        return a.name.localeCompare(b.name, "es");
      })
      .slice(0, 6);
  }, [neighborhoodOptions, normalizedQuery]);

  useEffect(() => {
    if (!isLocationOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (locationRef.current && target && !locationRef.current.contains(target)) {
        setIsLocationOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocationOpen]);

  const resultsLabel =
    draftCount === 1 ? "Buscar 1 arriendo" : "Buscar arriendos";

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={SURFACE_REVEAL_VARIANTS}
      className="w-full rounded-[24px] border border-bg-border bg-bg-surface px-6 py-6 shadow-[0_8px_32px_rgba(15,23,42,0.10),0_32px_80px_rgba(15,23,42,0.14)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.28),0_32px_80px_rgba(0,0,0,0.40)] sm:px-7 sm:py-7 md:max-w-[460px] lg:max-w-[480px]"
    >
      <motion.div
        initial="initial"
        animate="animate"
        variants={STAGGER_FAST_VARIANTS}
        className="space-y-2.5 text-center"
      >
        <motion.p
          variants={LIST_ITEM_REVEAL_VARIANTS}
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-t-muted"
        >
          Bogotá, Colombia
        </motion.p>
        <motion.p
          id="home-hero-heading"
          role="heading"
          aria-level={2}
          variants={LIST_ITEM_REVEAL_VARIANTS}
          aria-label="Busca tu próximo hogar en Bogotá"
          className="text-[26px] font-extrabold leading-[1.15] tracking-tight text-t-primary sm:text-[32px] sm:leading-[1.1] lg:text-[36px]"
        >
          Busca tu próximo hogar
          <br />
          en <RotatingNeighborhood names={topNeighborhoodNames} />
        </motion.p>
        <motion.p
          variants={LIST_ITEM_REVEAL_VARIANTS}
          className="text-[14px] leading-relaxed text-t-secondary"
        >
          Apartamentos, habitaciones y casas con contacto directo.
        </motion.p>
      </motion.div>

      <motion.form
        layout
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div ref={locationRef} className="relative">
          <SearchField icon="place" label="Barrio o zona">
            <input
              type="text"
              value={draftFilters.neighborhood}
              onFocus={() => setIsLocationOpen(true)}
              onChange={(event) => {
                onDraftChange({ neighborhood: event.target.value });
                setIsLocationOpen(true);
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              inputMode="search"
              enterKeyHint="search"
              placeholder="Buscar por barrio"
              className="w-full bg-transparent text-base font-medium leading-6 text-t-primary outline-none placeholder:text-t-muted focus-visible:shadow-none sm:text-[15px]"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isLocationOpen}
              aria-controls="home-hero-neighborhood-options"
            />
          </SearchField>

          <AnimatePresence>
            {isLocationOpen && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={POPOVER_VARIANTS}
                className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[20px] border border-bg-border bg-bg-surface shadow-lg"
              >
                {visibleNeighborhoods.length > 0 ? (
                  <motion.ul
                    id="home-hero-neighborhood-options"
                    className="max-h-72 overflow-y-auto p-2"
                    role="listbox"
                    initial="initial"
                    animate="animate"
                    variants={STAGGER_CONTAINER_VARIANTS}
                  >
                    {visibleNeighborhoods.map((option) => (
                      <motion.li
                        key={option.name}
                        variants={LIST_ITEM_REVEAL_VARIANTS}
                      >
                        <motion.button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            onDraftChange({ neighborhood: option.name });
                            setIsLocationOpen(false);
                          }}
                          {...NUDGE_COMPACT_MOTION_PROPS}
                          className="flex min-h-12 w-full items-center justify-between rounded-[14px] px-3 text-left transition-colors hover:bg-bg-elevated"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-t-primary">
                            <Icon
                              name="place"
                              size={16}
                              className="text-accent"
                            />
                            {option.name}
                          </span>
                          <span className="text-xs text-t-muted">
                            {option.count}
                          </span>
                        </motion.button>
                      </motion.li>
                    ))}
                  </motion.ul>
                ) : (
                  <motion.p
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={STATUS_SWAP_VARIANTS}
                    className="px-4 py-4 text-sm text-t-muted"
                  >
                    No encontramos coincidencias para ese barrio.
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid gap-3 min-[480px]:grid-cols-2">
          <SearchField icon="payments" label="Precio máximo">
            <SearchSelectField
              ariaLabel="Presupuesto máximo"
              options={priceOptions}
              value={draftFilters.maxPriceCOP}
              onChange={(maxPriceCOP) => onDraftChange({ maxPriceCOP })}
            />
          </SearchField>

          <SearchField icon="bed" label="Habitaciones">
            <SearchSelectField
              ariaLabel="Habitaciones mínimas"
              options={bedroomOptions}
              value={draftFilters.minBedrooms}
              onChange={(minBedrooms) => onDraftChange({ minBedrooms })}
            />
          </SearchField>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <motion.button
            type="submit"
            {...PRESSABLE_MOTION_PROPS}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-white transition-[background-color,box-shadow] duration-150 hover:bg-accent-hover hover:shadow-glow"
          >
            <Icon name="search" size={18} className="text-white" />
            {resultsLabel}
            <span className="text-white/60">({draftCount})</span>
          </motion.button>

          <AnimatePresence initial={false}>
            {(hasDraftChanges || activeFilterCount > 0) && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={STATUS_SWAP_VARIANTS}
                className="flex justify-end"
              >
                <motion.button
                  type="button"
                  onClick={hasDraftChanges ? onResetDraft : onClear}
                  {...NUDGE_COMPACT_MOTION_PROPS}
                  className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                >
                  {hasDraftChanges ? "Restablecer" : "Limpiar"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.form>
    </motion.div>
  );
}

export default function HomeSearchHero(props: HomeSearchHeroProps) {
  return (
    <section
      id="home-search"
      aria-labelledby="home-hero-heading"
      className="scroll-mt-24"
    >
      {/* Wrapper: en mobile stack vertical, en md+ relative para overlay */}
      <div className="md:relative">
        {/* Imagen hero */}
        <div
          className={`relative overflow-hidden bg-slate-950 ${HOME_SEARCH_HERO_MEDIA_HEIGHT_CLASS}`}
        >
          <Image
            src={heroBackground}
            alt="Panorámica ilustrada de Bogotá al atardecer"
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradiente: móvil oscurece abajo, desktop oscurece izquierda */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/50 md:bg-gradient-to-r md:from-slate-950/52 md:via-slate-950/24 md:to-slate-950/8 dark:from-slate-950/30 dark:via-slate-950/36 dark:to-slate-950/64 dark:md:from-slate-950/64 dark:md:via-slate-950/32 dark:md:to-slate-950/14" />
        </div>

        {/* Card: en mobile fluye debajo con fondo de la página, en md+ overlay absoluto */}
        <div className={HOME_SEARCH_HERO_OVERLAY_SHELL_CLASS}>
          <div className={HOME_SEARCH_HERO_CARD_POSITION_CLASS}>
            <SearchHeroCard {...props} />
          </div>
        </div>
      </div>
    </section>
  );
}
