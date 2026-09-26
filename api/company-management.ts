/** @format */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
	isValidTicker,
	normalizeTicker,
	sectorsFetch,
} from "./_lib/sectors-fetch.js";
import {
	checkRateLimit,
	errorResponse,
	getClientIp,
	rateLimitResponse,
	successResponse,
} from "./_lib/server.js";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "GET") {
		return errorResponse(res, 405, "Method not allowed");
	}

	const ip = getClientIp(req);

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
			company_name?: string;
			management?: {
				key_executives?: Array<{ name: string; position: string }>;
				executives_shareholdings?: Array<{
					name: string;
					position: string;
					share_amount: number;
					share_percentage: number;
				}>;
			};
		}>(`company/report/${normalized}`, { sections: "management" });

		return successResponse(res, {
			ticker: normalized,
			name: data.company_name,
			keyExecutives: data.management?.key_executives ?? [],
			executivesShareholdings:
				data.management?.executives_shareholdings?.map((holding) => ({
					name: holding.name,
					position: holding.position,
					shareAmount: holding.share_amount,
					sharePercentage: holding.share_percentage,
				})) ?? [],
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch management data");
	}
}
