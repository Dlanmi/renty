import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <Icon name="home_work" className="text-accent" size={28} />
          <span className="text-lg font-bold tracking-tight text-stone-900">
            Renty
          </span>
        </Link>

        {/* CTA */}
        <Link
          href="/publicar"
          className="lift-hover inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
        >
          <Icon name="chat" size={18} />
          Publicar
        </Link>
      </div>
    </header>
  );
}
