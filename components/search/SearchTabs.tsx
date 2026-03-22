"use client";

import Icon from "@/components/ui/Icon";

interface Tab {
  label: string;
  icon: string;
  disabled?: boolean;
}

const TABS: Tab[] = [
  { label: "Arriendos", icon: "key" },
  { label: "Comprar", icon: "house", disabled: true },
  { label: "Temporal", icon: "calendar_month", disabled: true },
];

export default function SearchTabs() {
  return (
    <div className="flex justify-center px-4">
      <div className="lift-hover inline-flex w-full max-w-md items-center gap-1 rounded-full border border-stone-200 bg-white/80 p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] backdrop-blur-sm">
        {TABS.map((tab, i) => {
          const isActive = i === 0;
          const isDisabled = !!tab.disabled;

          return (
            <div key={tab.label} className="group/tab relative min-w-0 flex-1">
              <button
                type="button"
                disabled={isDisabled}
                className={[
                  "relative inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium",
                  "transition-all duration-200 select-none",
                  isActive
                    ? "bg-neutral-900 text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                    : isDisabled
                    ? "cursor-not-allowed border border-transparent text-stone-400"
                    : "border border-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-800",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  className={
                    isActive
                      ? "text-white"
                      : isDisabled
                      ? "text-stone-300"
                      : "text-stone-400"
                  }
                />
                {tab.label}
              </button>

              {/* Tooltip — pure CSS, no libraries */}
              {isDisabled && (
                <span
                  role="tooltip"
                  className={[
                    "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap",
                    "rounded-lg bg-neutral-800 px-3 py-1.5 text-[11px] font-medium text-white",
                    "opacity-0 shadow-lg transition-opacity duration-150",
                    "group-hover/tab:opacity-100",
                    // Position below the button
                    "top-full mt-2",
                  ].join(" ")}
                >
                  Deshabilitado por ahora
                  {/* Arrow pointing up */}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-neutral-800" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
