interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 1000;
const MAX_MESSAGES = 30;

export function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  const entry = store.get(socketId);

  if (!entry || now > entry.resetAt) {
    store.set(socketId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_MESSAGES) {
    return false;
  }

  entry.count++;
  return true;
}

export function clearRateLimit(socketId: string): void {
  store.delete(socketId);
}
