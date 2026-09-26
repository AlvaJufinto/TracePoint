/** @format */

import { getOrSet } from "./cache.js";
import { getSectorsApiKey } from "./sectors-key.js";

const SECTORS_BASE = "https://api.sectors.app/v2";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 2;

export class SectorsApiError extends Error {
	constructor(
		message: string,
		public readonly status: number | null,
		public readonly code: string,
	) {
		super(message);
		this.name = "SectorsApiError";
	}
}

function isRetryableStatus(status: number): boolean {
	return status === 429 || status >= 500;
}

function retryDelay(attempt: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, attempt * 300));
}

function errorCode(error: unknown): string {
	if (error instanceof DOMException && error.name === "TimeoutError") {
		return "UPSTREAM_TIMEOUT";
	}
	if (error instanceof Error && error.name === "AbortError") {
		return "UPSTREAM_TIMEOUT";
	}
	return "UPSTREAM_CONNECTION_ERROR";
}

/** Normalize a ticker symbol to include .JK suffix if missing. */
export function normalizeTicker(raw: string): string {
	const cleaned = raw.trim().toUpperCase();
	if (cleaned.endsWith(".JK")) return cleaned;
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
	const normalizedEndpoint = endpoint.replace(/^\/+|\/+$/g, "");
	const apiKey = getSectorsApiKey();

	if (!apiKey) {
		throw new Error("SECTORS_API_KEY is not configured");
	}

	return getOrSet(
		key,
		async () => {
			const url = new URL(`${SECTORS_BASE}/${normalizedEndpoint}/`);
			for (const [name, value] of Object.entries(params)) {
				if (value !== undefined) url.searchParams.set(name, String(value));
			}

			for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
				try {
					const response = await fetch(url, {
						method: "GET",
						// Surface redirects instead of silently following a different auth target.
						redirect: "manual",
						headers: {
							Authorization: apiKey,
							Accept: "application/json",
						},
						signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
					});

					if (!response.ok) {
						const isRedirect = response.status >= 300 && response.status < 400;
						const detail = (await response.text())
							.replaceAll(apiKey, "[REDACTED]")
							.replace(/[\r\n\t]+/g, " ")
							.slice(0, 1000);
						console.error("Sectors upstream response", {
							method: "GET",
							endpoint: url.origin + url.pathname,
							status: response.status,
							isRedirect,
							detail,
						});
						const upstreamError = new SectorsApiError(
							isRedirect
								? "Sectors API redirected the request; check the configured endpoint"
								: `Sectors API returned HTTP ${response.status}`,
							response.status,
							isRedirect ? "UPSTREAM_REDIRECT" : "UPSTREAM_HTTP_ERROR",
						);
						if (attempt < MAX_ATTEMPTS && isRetryableStatus(response.status)) {
							await retryDelay(attempt);
							continue;
						}
						throw upstreamError;
					}

					return (await response.json()) as T;
				} catch (error) {
					if (error instanceof SectorsApiError) throw error;
					if (attempt < MAX_ATTEMPTS) {
						await retryDelay(attempt);
						continue;
					}
					const code = errorCode(error);
					throw new SectorsApiError(
						code === "UPSTREAM_TIMEOUT"
							? `Sectors API timed out after ${REQUEST_TIMEOUT_MS}ms`
							: "Could not connect to Sectors API",
						null,
						code,
					);
				}
			}

			throw new SectorsApiError("Sectors API request failed", null, "UPSTREAM_ERROR");
		},
		{ ttlMs: CACHE_TTL_MS },
	);
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
		.join("&");
	return `sectors:${endpoint}:${sorted}`;
}

/** Check whether the SECTORS_API_KEY is configured. */
export function isApiKeyConfigured(): boolean {
	return Boolean(getSectorsApiKey());
}

export { CACHE_TTL_MS };
