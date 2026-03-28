import type { Session } from "@supabase/supabase-js";
import { buildAdminLoginRateLimitKeys } from "@/lib/admin/rate-limit";

interface SignInResponse {
  data: {
    session: Session | null;
    user: { id: string } | null;
  };
  error: { message?: string } | null;
}

interface ProfileResponse {
  data: { role: string | null } | null;
  error: { message?: string } | null;
}

interface ProfilesQuery {
  eq(column: string, value: string): {
    maybeSingle(): PromiseLike<ProfileResponse>;
  };
}

export interface AdminLoginClient {
  auth: {
    signInWithPassword(credentials: {
      email: string;
      password: string;
    }): PromiseLike<SignInResponse>;
  };
  from(table: "profiles"): {
    select(columns: string): ProfilesQuery;
  };
}

export interface ExecuteAdminLoginDependencies {
  getRequestIp(): Promise<string>;
  getRateLimitStatus(keys: string[]): {
    limited: boolean;
    retryAfterSeconds: number;
  };
  recordLoginFailure(keys: string[]): void;
  clearLoginRateLimit(keys: string[]): void;
  createClient(accessToken?: string): AdminLoginClient;
  setAdminSessionCookies(session: Session): Promise<void>;
  clearAdminSessionCookies(): Promise<void>;
  redirect(path: string): never;
}

function withError(
  redirectPath: string,
  message: string,
  redirectFn: (path: string) => never
): never {
  const params = new URLSearchParams({ error: message });
  return redirectFn(`${redirectPath}?${params.toString()}`);
}

function isAdminRole(role: unknown): role is "admin" | "editor" {
  return role === "admin" || role === "editor";
}

export async function executeAdminLogin(
  formData: FormData,
  deps: ExecuteAdminLoginDependencies
) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rateLimitKeys = buildAdminLoginRateLimitKeys(
    await deps.getRequestIp(),
    email || "unknown"
  );

  const rateLimitStatus = deps.getRateLimitStatus(rateLimitKeys);
  if (rateLimitStatus.limited) {
    const retryMinutes = Math.max(
      1,
      Math.ceil(rateLimitStatus.retryAfterSeconds / 60)
    );
    return withError(
      "/admin/login",
      `Demasiados intentos fallidos. Intenta de nuevo en ${retryMinutes} min.`,
      deps.redirect
    );
  }

  if (!email || !password) {
    deps.recordLoginFailure(rateLimitKeys);
    return withError(
      "/admin/login",
      "Ingresa correo y contraseña.",
      deps.redirect
    );
  }

  const client = deps.createClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    deps.recordLoginFailure(rateLimitKeys);
    return withError("/admin/login", "Credenciales inválidas.", deps.redirect);
  }

  const authedClient = deps.createClient(data.session.access_token);
  const { data: profile, error: profileError } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !isAdminRole(profile?.role)) {
    deps.recordLoginFailure(rateLimitKeys);
    await deps.clearAdminSessionCookies();
    return withError(
      "/admin/login",
      "Tu usuario no tiene permisos de administración.",
      deps.redirect
    );
  }

  deps.clearLoginRateLimit(rateLimitKeys);
  await deps.setAdminSessionCookies(data.session);
  return deps.redirect("/admin");
}

export async function executeAdminLogout(
  deps: Pick<ExecuteAdminLoginDependencies, "clearAdminSessionCookies" | "redirect">
) {
  await deps.clearAdminSessionCookies();
  return deps.redirect("/admin/login");
}
