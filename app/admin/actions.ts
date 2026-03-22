"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearAdminSessionCookies,
  createSupabaseServerClient,
  setAdminSessionCookies,
} from "@/lib/admin/auth";
import {
  buildAdminLoginRateLimitKeys,
  clearAdminLoginRateLimit,
  getAdminLoginRateLimitStatus,
  recordAdminLoginFailure,
} from "@/lib/admin/rate-limit";

function withError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

async function getRequestIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const [firstHop] = forwarded.split(",");
    if (firstHop?.trim()) return firstHop.trim();
  }

  const realIp = headerStore.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

export async function loginAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rateLimitKeys = buildAdminLoginRateLimitKeys(
    await getRequestIp(),
    email || "unknown"
  );

  const rateLimitStatus = getAdminLoginRateLimitStatus(rateLimitKeys);
  if (rateLimitStatus.limited) {
    const retryMinutes = Math.max(1, Math.ceil(rateLimitStatus.retryAfterSeconds / 60));
    withError(
      "/admin/login",
      `Demasiados intentos fallidos. Intenta de nuevo en ${retryMinutes} min.`
    );
  }

  if (!email || !password) {
    recordAdminLoginFailure(rateLimitKeys);
    withError("/admin/login", "Ingresa correo y contraseña.");
  }

  const client = createSupabaseServerClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    recordAdminLoginFailure(rateLimitKeys);
    withError("/admin/login", "Credenciales inválidas.");
  }

  const authedClient = createSupabaseServerClient(data.session.access_token);
  const { data: profile, error: profileError } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role;
  if (profileError || (role !== "admin" && role !== "editor")) {
    recordAdminLoginFailure(rateLimitKeys);
    await clearAdminSessionCookies();
    withError("/admin/login", "Tu usuario no tiene permisos de administración.");
  }

  clearAdminLoginRateLimit(rateLimitKeys);
  await setAdminSessionCookies(data.session);
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSessionCookies();
  redirect("/admin/login");
}
