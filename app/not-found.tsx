import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getButtonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Icon name="search_off" size={48} className="text-muted" />
      <h2 className="text-xl font-bold text-stone-900">
        Propiedad no encontrada
      </h2>
      <p className="max-w-sm text-sm text-muted">
        Este arriendo ya no está disponible o el enlace es incorrecto.
      </p>
      <Link href="/" className={getButtonClasses("secondary")}>
        <span className="inline-flex items-center gap-2">
          <Icon name="arrow_back" size={18} />
          Volver al inicio
        </span>
      </Link>
    </div>
  );
}
