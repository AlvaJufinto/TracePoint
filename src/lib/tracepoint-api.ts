/**
 * TracePoint API client.
 *
 * Talks to the server-side proxy at relative path `/api/*`.
 * The proxy holds the Sectors API key server-side.
 *
 * For local development without a server, these calls will fail —
 * that's expected. The proxy must be deployed (Vercel or local Node.js server).
 *
 * Design: all functions return TracePoint internal types, never raw Sectors shapes.
 *
 * @format
 */

import {
	isTracePointCompany,
	isTracePointComposition,
	isTracePointCorporateActions,
	isTracePointFreeFloat,
	isTracePointOwnershipSnapshot,
	isTracePointScreenerResponse,
	isTraceVerification,
} from "../lib/guards";
import type {
	PanelState,
	TraceCandidate,
	TracePointCompany,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
	TracePointOwnershipSnapshot,
	TracePointScreenerResponse,
	TraceVerification,
} from "../types/tracepoint";

const API_BASE = "/api";

/**
 * Generic fetch helper that talks to the proxy.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
	});

	const responseText = await response.text();

	let body: unknown = null;

	if (responseText) {
		try {
			body = JSON.parse(responseText);
		} catch {
			body = responseText;
		}
	}

	if (!response.ok) {
		let errorMessage = `HTTP ${response.status}`;

		if (typeof body === "string" && body.trim()) {
			errorMessage = body;
		} else if (
			body &&
			typeof body === "object" &&
			"error" in body &&
			typeof body.error === "string"
		) {
			errorMessage = body.error;
		} else if (body !== null) {
			errorMessage = JSON.stringify(body);
		}

		throw new Error(errorMessage);
	}

	return body as T;
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export async function getCompanyOverview(
	ticker: string,
): Promise<TracePointCompany> {
	const data = await apiFetch<TracePointCompany>(
		`/company-overview?ticker=${encodeURIComponent(ticker)}`,
	);
	if (!isTracePointCompany(data)) {
		throw new Error(`Invalid company overview response for ${ticker}`);
	}
	return data;
}

export async function getCompanyOwnership(
	ticker: string,
): Promise<TracePointOwnershipSnapshot> {
	const data = await apiFetch<TracePointOwnershipSnapshot>(
		`/company-ownership?ticker=${encodeURIComponent(ticker)}`,
	);
	if (!isTracePointOwnershipSnapshot(data)) {
		throw new Error(`Invalid ownership response for ${ticker}`);
	}
	return data;
}

export async function getCompanyManagement(
	ticker: string,
): Promise<TracePointManagement> {
	const data = await apiFetch<TracePointManagement>(
		`/company-management?ticker=${encodeURIComponent(ticker)}`,
	);
	// Basic runtime check — management shape is simpler
	if (
		!data ||
		typeof data !== "object" ||
		typeof (data as unknown as Record<string, unknown>).ticker !== "string"
	) {
		throw new Error(`Invalid management response for ${ticker}`);
	}
	return data as TracePointManagement;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchCompanies(
	query: string,
	options?: { where?: string; limit?: number; offset?: number; signal?: AbortSignal },
): Promise<TracePointScreenerResponse> {
	const params = new URLSearchParams();
	if (options?.where) {
		params.set("where", options.where);
	} else {
		params.set("q", query);
	}
	if (options?.limit) params.set("limit", options.limit.toString());
	if (options?.offset) params.set("offset", options.offset.toString());

	const data = await apiFetch<TracePointScreenerResponse>(`/search?${params}`, {
		signal: options?.signal,
	});
	if (!isTracePointScreenerResponse(data)) {
		throw new Error("Invalid search response");
	}
	return data;
}

/**
 * Search for companies where a specific shareholder appears.
 * Uses the Screener's major_shareholders_name filter.
 */
export async function searchByShareholderName(
	shareholderName: string,
	limit = 50,
	signal?: AbortSignal,
): Promise<TracePointScreenerResponse> {
	const escaped = shareholderName.replace(/'/g, "''");
	const where = `major_shareholders_name like '%${escaped}%'`;
	return searchCompanies("", { where, limit, signal });
}

// ---------------------------------------------------------------------------
// Trace verification
// ---------------------------------------------------------------------------

export interface TraceVerifyRequest {
	candidates: TraceCandidate[];
	maxBatch?: number;
}

export interface TraceVerifyResponse {
	results: TraceVerification[];
	processed: number;
	limited: boolean;
	maxBatch: number;
}

export async function verifyTraceCandidates(
	request: TraceVerifyRequest,
	signal?: AbortSignal,
): Promise<TraceVerifyResponse> {
	const data = await apiFetch<TraceVerifyResponse>("/trace-verify", {
		method: "POST",
		body: JSON.stringify(request),
		signal,
	});

	// Validate each result
	for (const result of data.results) {
		if (!isTraceVerification(result)) {
			throw new Error("Invalid trace verification result from server");
		}
	}

	return data;
}

// ---------------------------------------------------------------------------
// Free float
// ---------------------------------------------------------------------------

export async function getFreeFloat(
	ticker: string,
): Promise<TracePointFreeFloat> {
	const data = await apiFetch<TracePointFreeFloat>(
		`/company-free-float?ticker=${encodeURIComponent(ticker)}`,
	);
	if (!isTracePointFreeFloat(data)) {
		throw new Error(`Invalid free float response for ${ticker}`);
	}
	return data;
}

// ---------------------------------------------------------------------------
// Shareholder composition
// ---------------------------------------------------------------------------

export async function getShareholderComposition(
	ticker: string,
): Promise<TracePointComposition> {
	const data = await apiFetch<TracePointComposition>(
		`/company-composition?ticker=${encodeURIComponent(ticker)}`,
	);
	if (!isTracePointComposition(data)) {
		throw new Error(`Invalid composition response for ${ticker}`);
	}
	return data;
}

// ---------------------------------------------------------------------------
// Corporate actions
// ---------------------------------------------------------------------------

export async function getCorporateActions(
	ticker: string,
): Promise<TracePointCorporateActions> {
	const data = await apiFetch<TracePointCorporateActions>(
		`/company-corporate-actions?ticker=${encodeURIComponent(ticker)}`,
	);
	if (!isTracePointCorporateActions(data)) {
		throw new Error(`Invalid corporate actions response for ${ticker}`);
	}
	return data;
}

// ---------------------------------------------------------------------------
// Panel state helpers
// ---------------------------------------------------------------------------

export function createPanelState<T>(): PanelState<T> {
	return { status: "loading", data: null, error: null };
}

export function successPanel<T>(data: T): PanelState<T> {
	return { status: "success", data, error: null };
}

export function errorPanel(message: string): PanelState<never> {
	return { status: "error", data: null, error: message };
}

export function emptyPanel<T>(): PanelState<T> {
	return { status: "empty", data: null, error: null };
}
