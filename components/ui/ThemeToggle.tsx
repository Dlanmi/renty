"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useCallback } from "react";

const THEME_OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
] as const;

function SunIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 4.343a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 0 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM6.464 14.596a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 14.596a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM5.404 5.404a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 1 1-1.06 1.061L5.404 6.464a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MonitorIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.105a3.501 3.501 0 0 0 1.1 1.677A.75.75 0 0 1 13.26 18H6.74a.75.75 0 0 1-.484-1.323A3.501 3.501 0 0 0 7.355 15H4.25A2.25 2.25 0 0 1 2 12.75v-8.5Zm1.5 0a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-.75.75H4.25a.75.75 0 0 1-.75-.75v-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const ICON_MAP: Record<string, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  /* ── Close on outside click or Escape ── */
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  const selectedTheme = mounted ? theme ?? "system" : "system";

  /* Pick the trigger icon: show the *resolved* theme icon (sun/moon),
     or monitor if explicitly set to "system" */
  const triggerIcon = (() => {
    if (!mounted) return MonitorIcon;
    if (selectedTheme === "system") {
      return resolvedTheme === "dark" ? MoonIcon : SunIcon;
    }
    return ICON_MAP[selectedTheme] ?? MonitorIcon;
  })();
  const TriggerIcon = triggerIcon;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full",
          "border border-bg-border bg-bg-elevated/80 shadow-sm backdrop-blur",
          "text-t-secondary transition-all duration-200",
          "hover:bg-bg-surface hover:text-t-primary",
          open ? "bg-bg-surface text-t-primary ring-1 ring-accent/30" : "",
        ].join(" ")}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Cambiar tema de color"
      >
        <span
          className="transition-transform duration-300 ease-out"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <TriggerIcon size={18} />
        </span>
      </button>

      {/* ── Popover menu ── */}
      <div
        className={[
          "absolute right-0 top-full z-50 mt-2",
          "w-40 origin-top-right rounded-xl",
          "border border-bg-border bg-bg-elevated p-1.5 shadow-xl ring-1 ring-black/10 dark:ring-white/10",
          "transition-all duration-200 ease-out",
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        ].join(" ")}
        role="menu"
        aria-label="Opciones de tema"
      >
        {THEME_OPTIONS.map((option) => {
          const isActive = selectedTheme === option.value;
          const IconComponent = ICON_MAP[option.value];

          return (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              onClick={() => {
                if (mounted) setTheme(option.value);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm",
                "transition-colors duration-150",
                isActive
                  ? "bg-accent/15 font-semibold text-accent"
                  : "text-t-primary hover:bg-bg-surface",
              ].join(" ")}
            >
              <IconComponent size={16} />
              <span>{option.label}</span>
              {isActive && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width={14}
                  height={14}
                  className="ml-auto shrink-0"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
