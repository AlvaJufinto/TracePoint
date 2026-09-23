import type { VercelRequest, VercelResponse } from '@vercel/node';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function getClientIp(req: Pick<VercelRequest, 'headers'>): string {
  const rawIp =
    req.headers['x-forwarded-for'] ?? req.headers['x-real-ip'] ?? 'unknown';
  return Array.isArray(rawIp) ? (rawIp[0] ?? 'unknown') : rawIp;
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export function rateLimitResponse(res: VercelResponse): void {
  res.status(429).json({
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
  });
}

export function errorResponse(
  res: VercelResponse,
  status: number,
  message: string,
): void {
  res.status(status).json({ error: message });
}

export function successResponse<T>(res: VercelResponse, data: T): void {
  res.status(200).json(data);
}

// --- Trace verification helpers (were missing from the codebase) ---

const TRACE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_TRACE_REQUESTS_PER_WINDOW = 30;
const MAX_BATCH_SIZE = 200;

interface TraceLimitEntry {
  count: number;
  windowStart: number;
}

const traceLimitMap = new Map<string, TraceLimitEntry>();

export function checkTraceLimit(
  ip: string,
  maxBatchSize?: number,
): { allowed: boolean; reason?: string; limit: number } {
  const effectiveMaxBatch = Math.min(maxBatchSize ?? MAX_BATCH_SIZE, MAX_BATCH_SIZE);

  const now = Date.now();
  const entry = traceLimitMap.get(ip);

  if (!entry || now - entry.windowStart > TRACE_LIMIT_WINDOW_MS) {
    traceLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, limit: effectiveMaxBatch };
  }

  if (entry.count >= MAX_TRACE_REQUESTS_PER_WINDOW) {
    return { allowed: false, reason: 'Trace limit exceeded. Try again later.', limit: 0 };
  }

  entry.count++;
  return { allowed: true, limit: effectiveMaxBatch };
}

export function isNonTraceableShareholder(name: string): boolean {
  if (!name) return false;
  const upper = name.toUpperCase();
  return (
    upper === 'PUBLIC' ||
    upper === 'TREASURY STOCK' ||
    upper === 'TREASURY' ||
    upper.startsWith('NON-TRACEABLE') ||
    upper.startsWith('NOT TRACEABLE')
  );
}
