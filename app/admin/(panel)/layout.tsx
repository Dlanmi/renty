import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAdminAction } from "@/app/admin/actions";
import { requireAdminContext } from "@/lib/admin/auth";

interface AdminPanelLayoutProps {
  children: ReactNode;
}

export default async function AdminPanelLayout({
  children,
}: AdminPanelLayoutProps) {
  const admin = await requireAdminContext();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="lift-hover mb-6 rounded-card border border-bg-border bg-bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              Administración
            </p>
            <p className="text-lg font-semibold text-t-primary">
              {admin.fullName?.trim() || admin.email || "Usuario admin"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="lift-hover inline-flex min-h-10 items-center rounded-full border border-bg-border px-4 text-sm font-medium text-t-secondary hover:bg-bg-elevated"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/listings"
              className="lift-hover inline-flex min-h-10 items-center rounded-full border border-bg-border px-4 text-sm font-medium text-t-secondary hover:bg-bg-elevated"
            >
              Inmuebles
            </Link>
            <Link
              href="/admin/listings/new"
              className="lift-hover inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Nuevo inmueble
            </Link>
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="lift-hover inline-flex min-h-10 items-center rounded-full border border-bg-border px-4 text-sm font-medium text-t-secondary hover:bg-bg-elevated"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
