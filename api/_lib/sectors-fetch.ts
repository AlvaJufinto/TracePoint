import axios from 'axios';
import { getOrSet } from './cache';

const SECTORS_BASE = 'https://api.sectors.app/v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Normalize a ticker symbol to include .JK suffix if missing. */
export function normalizeTicker(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  if (cleaned.endsWith('.JK')) return cleaned;
  return `${cleaned}.JK`;
}

/** Validate that a string looks like an Indonesian stock ticker. */
export function isValidTicker(raw: string): boolean {
  const normalized = normalizeTicker(raw);
  return /^[A-Z]{2,5}\.JK$/.test(normalized);
}

/** Fetch from Sectors API with in-memory caching. */
export async function sectorsFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const key = cacheKey(endpoint, params);

  return getOrSet(key, async () => {
    const response = await axios.get<T>(`${SECTORS_BASE}/${endpoint}/`, {
      params,
      headers: {
        Authorization: process.env.SECTORS_API_KEY ?? '',
        Accept: 'application/json',
      },
      timeout: 15000,
    });
    return response.data;
  }, { ttlMs: CACHE_TTL_MS });
}

/** Build a cache key from endpoint + sorted parameters. */
export function cacheKey(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `sectors:${endpoint}:${sorted}`;
}

/** Check whether the SECTORS_API_KEY is configured. */
export function isApiKeyConfigured(): boolean {
  return Boolean(process.env.SECTORS_API_KEY && process.env.SECTORS_API_KEY.length > 0);
}

export { CACHE_TTL_MS };
