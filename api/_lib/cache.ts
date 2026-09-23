/**
 * In-memory cache with TTL.
 *
 * NOTE: In a Vercel serverless environment, this cache only persists within
 * a single warm container. On cold start, the cache is empty.
 * This is acceptable for MVP — the cache structure is in place and works
 * for in-flight deduplication and warm-container hits.
 *
 * For production persistent caching, a KV store or Redis would be needed,
 * but that violates YAGNI for the current scope.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Unix ms
}

export interface CacheOptions {
  ttlMs: number;
}

const caches = new Map<string, CacheEntry<unknown>>();

export function getOrSet<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  options: CacheOptions,
): Promise<T> {
  const existing = caches.get(key);
  if (existing && Date.now() < existing.expiresAt) {
    return Promise.resolve(existing.data as T);
  }

  return fetcher().then((data) => {
    caches.set(key, { data, expiresAt: Date.now() + options.ttlMs });
    return data;
  });
}

export function invalidate(key: string): void {
  caches.delete(key);
}

export function clear(): void {
  caches.clear();
}
