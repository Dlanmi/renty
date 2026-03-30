import Icon from "@/components/ui/Icon";

interface Tab {
  label: string;
  icon: string;
  disabled?: boolean;
}

const TABS: Tab[] = [
  { label: "Arriendos", icon: "key" },
];

export default function SearchTabs() {
  return (
    <div className="flex justify-center px-4">
      <div className="lift-hover inline-flex items-center gap-1 rounded-full border border-bg-border bg-bg-surface/80 p-1 shadow-card backdrop-blur-sm">
        {TABS.map((tab) => (
          <span
            key={tab.label}
            className="relative inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-card select-none"
            aria-current="page"
          >
            <Icon name={tab.icon} size={16} className="text-white" />
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
}
