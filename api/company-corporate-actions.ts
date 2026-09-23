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
		const data = await sectorsFetch<{
			symbol?: string;
			corporate_actions?: {
				agm?: Array<{
					agm_date: string;
					agm_time?: string;
					agm_place?: string;
					agm_result?: string | null;
				}>;
				dividend?: Array<{
					ex_date: string;
					payment_date: string;
					dividend_yield?: number | null;
					dividend_amount: number;
				}>;
				stock_split?: Array<{ date: string; split_ratio: number }>;
			};
		}>(`company/corporate-actions/${normalized}`, {});

		const ca = data.corporate_actions ?? {};

		return successResponse(res, {
			ticker: normalized,
			agm:
				ca.agm?.map((item) => ({
					date: item.agm_date,
					time: item.agm_time,
					place: item.agm_place,
					result: item.agm_result,
				})) ?? null,
			dividends:
				ca.dividend?.map((item) => ({
					exDate: item.ex_date,
					paymentDate: item.payment_date,
					dividendYield: item.dividend_yield ?? null,
					dividendAmount: item.dividend_amount,
				})) ?? null,
			stockSplits:
				ca.stock_split?.map((item) => ({
					date: item.date,
					splitRatio: item.split_ratio,
				})) ?? null,
			bonus: null,
			warrant: null,
			rightIssue: null,
			upcomingDividend: null,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch corporate actions data");
	}
}
