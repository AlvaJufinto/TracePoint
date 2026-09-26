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
		const compositionData = await sectorsFetch<{
			symbol?: string;
			year?: number;
			// The API returns monthly snapshots; we select latest
			data?: Array<{
				date: string;
				local?: Record<string, number | null>;
				foreign?: Record<string, number | null>;
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
			.filter((s) => s.date)
			.sort((a, b) => b.date.localeCompare(a.date));

		const cleanSnapshots = snapshots.map((snapshot) => ({
			date: snapshot.date,
			sharesNumber: snapshot.shares_number,
			local: {
				insurance: snapshot.local?.insurance_l ?? snapshot.insurance_l ?? null,
				corporate: snapshot.local?.corporate_l ?? snapshot.corporate_l ?? null,
				pensionFund: snapshot.local?.pension_fund_l ?? snapshot.pension_fund_l ?? null,
				financialInstitutions:
					snapshot.local?.financial_institutions_l ?? snapshot.financial_institutions_l ?? null,
				individual: snapshot.local?.individual_l ?? snapshot.individual_l ?? null,
				mutualFund: snapshot.local?.mutual_fund_l ?? snapshot.mutual_fund_l ?? null,
				securitiesCompanies:
					snapshot.local?.securities_companies_l ?? snapshot.securities_companies_l ?? null,
				foundation: snapshot.local?.foundation_l ?? snapshot.foundation_l ?? null,
				other: snapshot.local?.other_l ?? snapshot.other_l ?? null,
				total: snapshot.local?.total_l ?? snapshot.total_l ?? null,
			},
			foreign: {
				insurance: snapshot.foreign?.insurance_f ?? snapshot.insurance_f ?? null,
				corporate: snapshot.foreign?.corporate_f ?? snapshot.corporate_f ?? null,
				pensionFund: snapshot.foreign?.pension_fund_f ?? snapshot.pension_fund_f ?? null,
				financialInstitutions:
					snapshot.foreign?.financial_institutions_f ?? snapshot.financial_institutions_f ?? null,
				individual: snapshot.foreign?.individual_f ?? snapshot.individual_f ?? null,
				mutualFund: snapshot.foreign?.mutual_fund_f ?? snapshot.mutual_fund_f ?? null,
				securitiesCompanies:
					snapshot.foreign?.securities_companies_f ?? snapshot.securities_companies_f ?? null,
				foundation: snapshot.foreign?.foundation_f ?? snapshot.foundation_f ?? null,
				other: snapshot.foreign?.other_f ?? snapshot.other_f ?? null,
				total: snapshot.foreign?.total_f ?? snapshot.total_f ?? null,
			},
			numberOfShareholders: snapshot.numbers_of_shareholders ?? null,
			changeInShareholders: snapshot.change_in_shareholders ?? null,
		}));

		return successResponse(res, {
			ticker: normalized,
			year: compositionData.year ?? (snapshots[0] ? Number(snapshots[0].date.slice(0, 4)) : undefined),
			latestSnapshot: cleanSnapshots[0] ?? null,
			snapshots: cleanSnapshots,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Sectors API error:", msg);
		return errorResponse(res, 502, "Failed to fetch composition data");
	}
}
