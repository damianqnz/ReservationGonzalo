interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Checks whether a request from the given key is within the rate limit.
 * Uses an in-memory Map — resets on server restart.
 *
 * @param key     Unique identifier (e.g. "guest:127.0.0.1")
 * @param limit   Maximum requests allowed within the window
 * @param windowMs Window duration in milliseconds
 * @returns true if the request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
