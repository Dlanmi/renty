import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createClient as createSupabaseClient,
  type Session,
} from "@supabase/supabase-js";

type AdminRole = "admin" | "editor";

interface AdminProfile {
  role: AdminRole;
  full_name: string | null;
}

export interface AdminContext {
  userId: string;
  email: string | null;
  role: AdminRole;
  fullName: string | null;
  accessToken: string;
}

const ACCESS_COOKIE_NAME = "renty_admin_access_token";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, key };
}

export function createSupabaseServerClient(accessToken?: string) {
  const { url, key } = getSupabaseEnv();

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
  });
}

export async function setAdminSessionCookies(session: Session) {
  const store = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  store.set(ACCESS_COOKIE_NAME, session.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: session.expires_in ?? 60 * 60,
  });
}

export async function clearAdminSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE_NAME);
}

function isAdminRole(role: unknown): role is AdminRole {
  return role === "admin" || role === "editor";
}

export async function getAdminContextFromCookies(): Promise<AdminContext | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE_NAME)?.value;
  if (!accessToken) return null;

  const client = createSupabaseServerClient(accessToken);
  const { data: userData, error: userError } = await client.auth.getUser(
    accessToken
  );

  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, full_name")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  const parsedProfile = profile as AdminProfile;
  if (!isAdminRole(parsedProfile.role)) return null;

  return {
    userId: userData.user.id,
    email: userData.user.email ?? null,
    role: parsedProfile.role,
    fullName: parsedProfile.full_name,
    accessToken,
  };
}

export async function requireAdminContext(): Promise<AdminContext> {
  const admin = await getAdminContextFromCookies();
  if (!admin) redirect("/admin/login");
  return admin;
}
