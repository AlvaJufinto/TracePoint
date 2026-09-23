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
		const compositionData = await sectorsFetch<{
			symbol?: string;
			year?: number;
			// The API returns monthly snapshots; we select latest
			data?: Array<{
				date: string;
				shares_number: number;
				insurance_l?: number;
				corporate_l?: number;
				pension_fund_l?: number;
				financial_institutions_l?: number;
				individual_l?: number;
				mutual_fund_l?: number;
				securities_companies_l?: number;
				foundation_l?: number;
				other_l?: number;
				total_l?: number;
				insurance_f?: number;
				corporate_f?: number;
				pension_fund_f?: number;
				financial_institutions_f?: number;
				individual_f?: number;
				mutual_fund_f?: number;
				securities_companies_f?: number;
				foundation_f?: number;
				other_f?: number;
				total_f?: number;
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

		const cleanSnapshots = snapshots.map((snapshot) => ({
			date: snapshot.date,
			sharesNumber: snapshot.shares_number,
			local: {
				insurance: snapshot.insurance_l ?? 0,
				corporate: snapshot.corporate_l ?? 0,
				pensionFund: snapshot.pension_fund_l ?? 0,
				financialInstitutions:
					snapshot.financial_institutions_l ?? 0,
				individual: snapshot.individual_l ?? 0,
				mutualFund: snapshot.mutual_fund_l ?? 0,
				securitiesCompanies:
					snapshot.securities_companies_l ?? 0,
				foundation: snapshot.foundation_l ?? 0,
				other: snapshot.other_l ?? 0,
				total: snapshot.total_l ?? 0,
			},
			foreign: {
				insurance: snapshot.insurance_f ?? 0,
				corporate: snapshot.corporate_f ?? 0,
				pensionFund: snapshot.pension_fund_f ?? 0,
				financialInstitutions:
					snapshot.financial_institutions_f ?? 0,
				individual: snapshot.individual_f ?? 0,
				mutualFund: snapshot.mutual_fund_f ?? 0,
				securitiesCompanies:
					snapshot.securities_companies_f ?? 0,
				foundation: snapshot.foundation_f ?? 0,
				other: snapshot.other_f ?? 0,
				total: snapshot.total_f ?? 0,
			},
			numberOfShareholders: snapshot.numbers_of_shareholders ?? 0,
			changeInShareholders: snapshot.change_in_shareholders ?? 0,
		}));

		return successResponse(res, {
			ticker: normalized,
			year: compositionData.year ?? Number(snapshots[0].date.slice(0, 4)),
			latestSnapshot: cleanSnapshots[0] ?? null,
			snapshots: cleanSnapshots,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch composition data");
	}
}
