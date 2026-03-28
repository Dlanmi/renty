import test from "node:test";
import assert from "node:assert/strict";
import type { Session } from "@supabase/supabase-js";
import { executeAdminLogin } from "@/lib/admin/login";
import { getAdminContextFromAccessToken } from "@/lib/admin/auth";

class RedirectSignal extends Error {
  constructor(public readonly location: string) {
    super(`redirect:${location}`);
  }
}

function createSession(accessToken = "token-123"): Session {
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 1_700_000_000,
    refresh_token: "refresh-token",
    user: {
      id: "user-1",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  } as Session;
}

function createLoginDeps(options?: {
  limited?: boolean;
  retryAfterSeconds?: number;
  signInError?: boolean;
  role?: string | null;
}) {
  const calls = {
    rateLimitKeys: [] as string[][],
    failures: [] as string[][],
    clears: [] as string[][],
    clientTokens: [] as Array<string | undefined>,
    setSessions: [] as Session[],
    clearedCookies: 0,
  };

  const session = createSession();
  const deps = {
    async getRequestIp() {
      return "10.0.0.8";
    },
    getRateLimitStatus(keys: string[]) {
      calls.rateLimitKeys.push(keys);
      return {
        limited: options?.limited ?? false,
        retryAfterSeconds: options?.retryAfterSeconds ?? 0,
      };
    },
    recordLoginFailure(keys: string[]) {
      calls.failures.push(keys);
    },
    clearLoginRateLimit(keys: string[]) {
      calls.clears.push(keys);
    },
    createClient(accessToken?: string) {
      calls.clientTokens.push(accessToken);

      if (!accessToken) {
        return {
          auth: {
            async signInWithPassword() {
              if (options?.signInError) {
                return {
                  data: { session: null, user: null },
                  error: { message: "invalid" },
                };
              }

              return {
                data: { session, user: { id: "user-1" } },
                error: null,
              };
            },
          },
          from() {
            throw new Error("No debe consultar perfiles sin token.");
          },
        };
      }

      return {
        auth: {
          async signInWithPassword() {
            throw new Error("No debe iniciar sesión con el cliente autenticado.");
          },
        },
        from() {
          return {
            select() {
              return {
                eq() {
                  return {
                    async maybeSingle() {
                      return {
                        data:
                          options?.role === null
                            ? null
                            : { role: options?.role ?? "admin" },
                        error: null,
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    async setAdminSessionCookies(currentSession: Session) {
      calls.setSessions.push(currentSession);
    },
    async clearAdminSessionCookies() {
      calls.clearedCookies += 1;
    },
    redirect(path: string): never {
      throw new RedirectSignal(path);
    },
  };

  return { calls, deps, session };
}

test("executeAdminLogin bloquea el login cuando el rate limit ya expiró en contra", async () => {
  const { calls, deps } = createLoginDeps({
    limited: true,
    retryAfterSeconds: 121,
  });
  const formData = new FormData();
  formData.set("email", "admin@renty.co");
  formData.set("password", "secret");

  await assert.rejects(() => executeAdminLogin(formData, deps), (error) => {
    assert.ok(error instanceof RedirectSignal);
    assert.equal(
      error.location,
      "/admin/login?error=Demasiados+intentos+fallidos.+Intenta+de+nuevo+en+3+min."
    );
    return true;
  });

  assert.deepEqual(calls.clientTokens, []);
  assert.deepEqual(calls.failures, []);
});

test("executeAdminLogin normaliza el correo, setea sesión y redirige al panel en login exitoso", async () => {
  const { calls, deps, session } = createLoginDeps({
    role: "editor",
  });
  const formData = new FormData();
  formData.set("email", "  Admin@Renty.co ");
  formData.set("password", "secret");

  await assert.rejects(() => executeAdminLogin(formData, deps), (error) => {
    assert.ok(error instanceof RedirectSignal);
    assert.equal(error.location, "/admin");
    return true;
  });

  assert.deepEqual(calls.rateLimitKeys[0], [
    "ip:10.0.0.8",
    "ip-email:10.0.0.8:admin@renty.co",
  ]);
  assert.deepEqual(calls.clientTokens, [undefined, session.access_token]);
  assert.deepEqual(calls.setSessions, [session]);
  assert.deepEqual(calls.failures, []);
  assert.deepEqual(calls.clears[0], [
    "ip:10.0.0.8",
    "ip-email:10.0.0.8:admin@renty.co",
  ]);
});

test("executeAdminLogin registra fallo y muestra error para credenciales inválidas", async () => {
  const { calls, deps } = createLoginDeps({
    signInError: true,
  });
  const formData = new FormData();
  formData.set("email", "admin@renty.co");
  formData.set("password", "incorrecta");

  await assert.rejects(() => executeAdminLogin(formData, deps), (error) => {
    assert.ok(error instanceof RedirectSignal);
    assert.equal(
      error.location,
      "/admin/login?error=Credenciales+inv%C3%A1lidas."
    );
    return true;
  });

  assert.equal(calls.failures.length, 1);
  assert.equal(calls.setSessions.length, 0);
});

test("executeAdminLogin exige correo y contraseña antes de hablar con Supabase", async () => {
  const { calls, deps } = createLoginDeps();
  const formData = new FormData();
  formData.set("email", "admin@renty.co");

  await assert.rejects(() => executeAdminLogin(formData, deps), (error) => {
    assert.ok(error instanceof RedirectSignal);
    assert.equal(
      error.location,
      "/admin/login?error=Ingresa+correo+y+contrase%C3%B1a."
    );
    return true;
  });

  assert.equal(calls.failures.length, 1);
  assert.deepEqual(calls.clientTokens, []);
});

test("executeAdminLogin limpia cookies y rechaza usuarios sin rol admin/editor", async () => {
  const { calls, deps } = createLoginDeps({
    role: "viewer",
  });
  const formData = new FormData();
  formData.set("email", "admin@renty.co");
  formData.set("password", "secret");

  await assert.rejects(() => executeAdminLogin(formData, deps), (error) => {
    assert.ok(error instanceof RedirectSignal);
    assert.equal(
      error.location,
      "/admin/login?error=Tu+usuario+no+tiene+permisos+de+administraci%C3%B3n."
    );
    return true;
  });

  assert.equal(calls.clearedCookies, 1);
  assert.equal(calls.failures.length, 1);
  assert.equal(calls.setSessions.length, 0);
});

test("getAdminContextFromAccessToken devuelve contexto solo para perfiles admin/editor válidos", async () => {
  const context = await getAdminContextFromAccessToken("token-abc", () => ({
    auth: {
      async getUser() {
        return {
          data: {
            user: {
              id: "user-42",
              email: "admin@renty.co",
            },
          },
          error: null,
        };
      },
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: {
                      role: "admin",
                      full_name: "Admin Renty",
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  }));

  assert.deepEqual(context, {
    userId: "user-42",
    email: "admin@renty.co",
    role: "admin",
    fullName: "Admin Renty",
    accessToken: "token-abc",
  });
});

test("getAdminContextFromAccessToken devuelve null cuando el perfil no es admin/editor", async () => {
  const context = await getAdminContextFromAccessToken("token-abc", () => ({
    auth: {
      async getUser() {
        return {
          data: {
            user: {
              id: "user-42",
              email: "viewer@renty.co",
            },
          },
          error: null,
        };
      },
    },
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return {
                    data: {
                      role: "viewer" as never,
                      full_name: "Viewer",
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  }));

  assert.equal(context, null);
});
