/** @format */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
	isValidTicker,
	normalizeTicker,
	sectorsFetch,
} from "./_lib/sectors-fetch";
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

	const { ticker } = req.query as { ticker?: string };

	if (!ticker) {
		return errorResponse(res, 400, "Missing ticker parameter");
	}

	const normalized = normalizeTicker(ticker);

	if (!isValidTicker(normalized)) {
		return errorResponse(res, 400, `Invalid ticker: ${ticker}`);
	}

	try {
		const data = await sectorsFetch<{
			symbol?: string;
			freeFloat?: number;
		}>("free-float", {});

		// @ts-ignore
		const entry = data.find(
			(item: { symbol?: string }) => item.symbol === normalized,
		);

		if (!entry) {
			return errorResponse(res, 404, `Free float not found for ${normalized}`);
		}

		return successResponse(res, {
			ticker: normalized,
			freeFloat: entry.freeFloat,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch free float data");
	}
}
