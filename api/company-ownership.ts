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
	isNonTraceableShareholder,
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
		// Get ownership first
		const ownershipData = await sectorsFetch<{
			symbol: string;
			company_name: string;
			ownership?: {
				major_shareholders?: Array<{
					name: string;
					share_value?: number;
					share_amount?: number;
					share_percentage?: string;
					symbol?: string | null;
				}>;
				whale_investors?: string[] | null;
			};
		}>(`company/report/${normalized}`, { sections: "ownership" });

		const holdersRaw = ownershipData.ownership?.major_shareholders ?? [];
		const whales = ownershipData.ownership?.whale_investors ?? null;

		// Parse and filter ownership holders
		const traceableHolders: Array<{
			name: string;
			shareValue: number;
			shareAmount: number;
			sharePercentage: number;
			symbol?: string;
		}> = [];

		let totalReportedPct = 0;

		for (const sh of holdersRaw) {
			const pct = parseFloat((sh.share_percentage ?? "0").toString());
			if (isNaN(pct)) continue;

			totalReportedPct += pct;

			// Skip non-traceable (Public, Treasury Stock)
			if (isNonTraceableShareholder(sh.name)) continue;

			traceableHolders.push({
				name: sh.name,
				shareValue: sh.share_value ?? 0,
				shareAmount: sh.share_amount ?? 0,
				sharePercentage: pct,
				symbol: sh.symbol ?? undefined,
			});
		}

		// Calculate public/free float as remainder
		const freeFloatPct = 1 - totalReportedPct;

		return successResponse(res, {
			ticker: normalized,
			companyName: ownershipData.company_name,
			// Major shareholders (traceable only — NOT Public/Treasury)
			majorShareholders: traceableHolders,
			// Context metadata (NOT ownership edges)
			whaleInvestors: whales,
			// Aggregates
			totalReportedPercentage: totalReportedPct,
			freeFloatPercentage: freeFloatPct,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch ownership data");
	}
}
