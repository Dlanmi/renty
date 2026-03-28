import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-bg-border bg-bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Icon name="home_work" className="text-accent" size={28} />
          <span className="text-lg font-bold tracking-tight text-t-primary">
            Renty
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/publicar"
            className="focus-ring lift-hover inline-flex items-center gap-1.5 rounded-full border border-bg-border px-4 py-2 text-sm font-medium text-t-secondary transition-colors hover:bg-bg-elevated hover:text-t-primary"
          >
            <Icon name="chat" size={18} />
            <span className="hidden sm:inline">Publicar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
