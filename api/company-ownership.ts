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
	getClientIp,
	rateLimitResponse,
	successResponse,
} from "./_lib/server";

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
				conglomerates_group?: string[] | null;
			};
		}>(`company/report/${normalized}`, { sections: "ownership" });

		const holdersRaw = ownershipData.ownership?.major_shareholders ?? [];
		const whales = ownershipData.ownership?.whale_investors ?? null;

		// Parse and filter ownership holders
		const holders: Array<{
			name: string;
			shareValue: number | null;
			shareAmount: number | null;
			sharePercentage: number | null;
			symbol?: string;
		}> = [];

		for (const sh of holdersRaw) {
			const raw = sh.share_percentage;
			const pct = raw == null || raw === "" || !Number.isFinite(Number(raw)) ? null : Number(raw);

			holders.push({
				name: sh.name,
				shareValue: sh.share_value ?? null,
				shareAmount: sh.share_amount ?? null,
				sharePercentage: pct,
				symbol: sh.symbol ?? undefined,
			});
		}

		return successResponse(res, {
			ticker: normalized,
			companyName: ownershipData.company_name,
			// Preserve aggregate entries; the UI disables tracing for Public/Treasury.
			holders,
			// Context metadata (NOT ownership edges)
			whaleInvestors: whales,
			conglomeratesGroup:
				ownershipData.ownership?.conglomerates_group ?? null,
			// Sectors does not expose an ownership snapshot date.
			asOf: null,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch ownership data");
	}
}
