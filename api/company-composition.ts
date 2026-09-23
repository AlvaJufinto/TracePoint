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
		const compositionData = await sectorsFetch<{
			symbol?: string;
			year?: number;
			// The API returns monthly snapshots; we select latest
			data?: Array<{
				date: string;
				shares_number: number;
				local: {
					insurance?: number;
					corporate?: number;
					pension_fund?: number;
					financial_institutions?: number;
					individual?: number;
					mutual_fund?: number;
					securities_companies?: number;
					foundation?: number;
					other?: number;
					total?: number;
				};
				foreign: {
					insurance?: number;
					corporate?: number;
					pension_fund?: number;
					financial_institutions?: number;
					individual?: number;
					mutual_fund?: number;
					securities_companies?: number;
					foundation?: number;
					other?: number;
					total?: number;
				};
				numbers_of_shareholders?: number;
				change_in_shareholders?: number;
			}>;
		}>(`company/shareholders-composition/${normalized}`, {});

		if (!compositionData.data || compositionData.data.length === 0) {
			return successResponse(res, {
				ticker: normalized,
				latestSnapshot: null,
				snapshots: [],
			});
		}

		// Select latest snapshot by date (not array position)
		const snapshots = compositionData.data
			.filter((s) => s.date && s.shares_number > 0)
			.sort((a, b) => b.date.localeCompare(a.date));

		const latest = snapshots[0];

		const cleanSnapshot = latest
			? {
					date: latest.date,
					sharesNumber: latest.shares_number,
					localTotal: latest.local?.total ?? 0,
					foreignTotal: latest.foreign?.total ?? 0,
					numbersOfShareholders: latest.numbers_of_shareholders ?? 0,
					changeInShareholders: latest.change_in_shareholders ?? 0,
				}
			: null;

		return successResponse(res, {
			ticker: normalized,
			latestSnapshot: cleanSnapshot,
			snapshots: snapshots.map((s) => ({
				date: s.date,
				sharesNumber: s.shares_number,
				localTotal: s.local?.total ?? 0,
				foreignTotal: s.foreign?.total ?? 0,
				numbersOfShareholders: s.numbers_of_shareholders ?? 0,
				changeInShareholders: s.change_in_shareholders ?? 0,
			})),
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch composition data");
	}
}
