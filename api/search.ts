/** @format */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { sectorsFetch } from "./_lib/sectors-fetch";
import {
	checkRateLimit,
	errorResponse,
	rateLimitResponse,
	successResponse,
} from "./_lib/server";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "GET") {
		return errorResponse(res, 405, "Method not allowed");
	}

	const ip =
		req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
	// @ts-ignore

	if (!checkRateLimit(ip)) {
		return rateLimitResponse(res);
	}

	const { q, where, limit, offset } = req.query as {
		q?: string;
		where?: string;
		limit?: string;
		offset?: string;
	};

	if (!q && !where) {
		return errorResponse(res, 400, "Missing q or where parameter");
	}

	const parsedLimit = Math.min(parseInt(limit ?? "20", 10), 50);
	const parsedOffset = parseInt(offset ?? "0", 10);

	try {
		const params: Record<string, string | number> = {
			limit: parsedLimit,
			offset: parsedOffset,
		};

		if (q) params.q = q;
		if (where) params.where = where;

		const data = await sectorsFetch<{
			results: Array<{
				symbol: string;
				company_name: string;
				total_cap?: number;
				volume24h?: number;
			}>;
			pagination: { total_count?: number; has_next?: boolean };
		}>("/companies/", params);

		return successResponse(res, {
			results: data.results.map((r) => ({
				ticker: r.symbol,
				companyName: r.company_name,
			})),
			totalCount: data.pagination?.total_count ?? 0,
			hasMore: data.pagination?.has_next ?? false,
			nextOffset: parsedOffset + parsedLimit,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to search companies");
	}
}
