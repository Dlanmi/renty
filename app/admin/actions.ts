"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearAdminSessionCookies,
  createSupabaseServerClient,
  setAdminSessionCookies,
} from "@/lib/admin/auth";
import {
  clearAdminLoginRateLimit,
  getAdminLoginRateLimitStatus,
  recordAdminLoginFailure,
} from "@/lib/admin/rate-limit";
import {
  executeAdminLogin,
  executeAdminLogout,
  type AdminLoginClient,
} from "@/lib/admin/login";

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

function createAdminLoginClient(accessToken?: string): AdminLoginClient {
  return createSupabaseServerClient(accessToken) as unknown as AdminLoginClient;
}

export async function loginAdminAction(formData: FormData) {
  return executeAdminLogin(formData, {
    getRequestIp,
    getRateLimitStatus: getAdminLoginRateLimitStatus,
    recordLoginFailure: recordAdminLoginFailure,
    clearLoginRateLimit: clearAdminLoginRateLimit,
    createClient: createAdminLoginClient,
    setAdminSessionCookies,
    clearAdminSessionCookies,
    redirect,
  });
}

export async function logoutAdminAction() {
  return executeAdminLogout({
    clearAdminSessionCookies,
    redirect,
  });
}
