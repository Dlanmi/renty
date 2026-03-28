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
      <div className="lift-hover inline-flex w-full max-w-md items-center gap-1 rounded-full border border-bg-border bg-bg-surface/80 p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)] backdrop-blur-sm">
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
                    ? "bg-accent text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                    : isDisabled
                    ? "cursor-not-allowed border border-transparent text-t-muted"
                    : "border border-transparent text-t-secondary hover:bg-bg-elevated hover:text-t-primary",
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
                      ? "text-t-muted"
                      : "text-t-muted"
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
                    "rounded-lg bg-bg-elevated px-3 py-1.5 text-[11px] font-medium text-t-secondary",
                    "border border-bg-border shadow-lg",
                    "opacity-0 transition-opacity duration-150",
                    "group-hover/tab:opacity-100",
                    // Position below the button
                    "top-full mt-2",
                  ].join(" ")}
                >
                  Deshabilitado por ahora
                  {/* Arrow pointing up */}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-bg-border" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
