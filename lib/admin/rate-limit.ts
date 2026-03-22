const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface AttemptBucket {
  count: number;
  expiresAt: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __rentyAdminLoginAttempts?: Map<string, AttemptBucket>;
};

function getAttemptStore(): Map<string, AttemptBucket> {
  if (!globalForRateLimit.__rentyAdminLoginAttempts) {
    globalForRateLimit.__rentyAdminLoginAttempts = new Map();
  }
  return globalForRateLimit.__rentyAdminLoginAttempts;
}

function pruneExpiredBuckets(now: number) {
  const store = getAttemptStore();
  for (const [key, bucket] of store.entries()) {
    if (bucket.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function sanitizeKeyPart(value: string): string {
  return value.trim().toLowerCase() || "unknown";
}

export function buildAdminLoginRateLimitKeys(ip: string, email: string): string[] {
  const normalizedIp = sanitizeKeyPart(ip);
  const normalizedEmail = sanitizeKeyPart(email);
  return [`ip:${normalizedIp}`, `ip-email:${normalizedIp}:${normalizedEmail}`];
}

export function getAdminLoginRateLimitStatus(keys: string[]): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const store = getAttemptStore();
  let retryAfterMs = 0;

  for (const key of keys) {
    const bucket = store.get(key);
    if (!bucket || bucket.expiresAt <= now) continue;
    if (bucket.count < MAX_ATTEMPTS) continue;

    retryAfterMs = Math.max(retryAfterMs, bucket.expiresAt - now);
  }

  return {
    limited: retryAfterMs > 0,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  };
}

export function recordAdminLoginFailure(keys: string[]) {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const store = getAttemptStore();
  for (const key of keys) {
    const current = store.get(key);
    if (!current || current.expiresAt <= now) {
      store.set(key, {
        count: 1,
        expiresAt: now + WINDOW_MS,
      });
      continue;
    }

    store.set(key, {
      count: current.count + 1,
      expiresAt: current.expiresAt,
    });
  }
}

export function clearAdminLoginRateLimit(keys: string[]) {
  const store = getAttemptStore();
  for (const key of keys) {
    store.delete(key);
  }
}
