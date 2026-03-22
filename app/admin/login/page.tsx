import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAdminAction } from "@/app/admin/actions";
import { getAdminContextFromCookies } from "@/lib/admin/auth";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const admin = await getAdminContextFromCookies();
  if (admin) redirect("/admin");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = getSingleParam(resolvedSearchParams?.error).trim();

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="lift-hover rounded-card border border-stone-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold text-stone-900">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresa con tu usuario autorizado para gestionar inmuebles y fotos.
        </p>

        {errorMessage && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        )}

        <form action={loginAdminAction} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Correo</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="tu-correo@ejemplo.com"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-stone-700">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-accent focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="lift-hover inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm font-medium text-accent hover:underline">
            Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}
