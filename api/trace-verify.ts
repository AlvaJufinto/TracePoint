/** @format */

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { sectorsFetch } from "./_lib/sectors-fetch";
import { checkTraceLimit, errorResponse, successResponse } from "./_lib/server";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return errorResponse(res, 405, "Method not allowed");
	}

	const body = req.body;
	if (!body || Array.isArray(body)) {
		return errorResponse(res, 400, "Request body must be a JSON object");
	}

	const candidates = body.candidates;
	const maxBatchSize = body.maxBatchSize;

	if (!Array.isArray(candidates) || candidates.length === 0) {
		return errorResponse(res, 400, "candidates array is required");
	}

	if (candidates.length > 200) {
		return errorResponse(res, 400, "Maximum 200 candidates per request");
	}

	if (
		maxBatchSize &&
		(typeof maxBatchSize !== "number" ||
			maxBatchSize <= 0 ||
			maxBatchSize > 200)
	) {
		return errorResponse(res, 400, "maxBatchSize must be between 1 and 200");
	}

	const ip =
		req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
	// @ts-ignore
	const traceLimit = checkTraceLimit(ip, maxBatchSize ?? undefined);

	if (!traceLimit.allowed) {
		return errorResponse(
			res,
			429,
			`Trace limit exceeded: ${traceLimit.reason}`,
		);
	}

	const limit = traceLimit.limit;
	const candidatesToProcess = candidates.slice(0, limit);
	const limited = candidates.length > limit;

	const results: Array<{
		ticker: string;
		candidateName: string;
		confirmed: boolean;
		confidence: number;
		matchedShareholder?: string;
		matchedCompany?: string;
	}> = [];

	for (const candidate of candidatesToProcess) {
		const result = await verifyCandidate(candidate);
		results.push(result);
	}

	return successResponse(res, {
		verified: results,
		limited,
		limit,
		totalRequested: candidates.length,
	});
}

async function verifyCandidate(candidate: {
	ticker: string;
	name: string;
}): Promise<{
	ticker: string;
	candidateName: string;
	confirmed: boolean;
	confidence: number;
	matchedShareholder?: string;
	matchedCompany?: string;
}> {
	try {
		const [companyData, ownershipData] = await Promise.all([
			sectorsFetch<{ symbol: string; company_name: string }>(
				`company/report/${candidate.ticker}`,
				{ sections: "overview" },
			),
			sectorsFetch<{
				major_shareholders?: Array<{ name: string; share_percentage?: string }>;
				whale_investors?: string[] | null;
				conglomerates_group?: string[] | null;
			}>(`company/report/${candidate.ticker}`, { sections: "ownership" }),
		]);

		const shareholders = ownershipData?.major_shareholders ?? [];
		const whaleInvestors = ownershipData?.whale_investors ?? [];
		const conglomerates = ownershipData?.conglomerates_group ?? [];

		const allNames = [
			...shareholders.map((s) => s.name),
			...whaleInvestors,
			...conglomerates,
		];

		const name = candidate.name.trim().toLowerCase();
		let bestMatch: string | undefined;
		let bestConfidence = 0;

		for (const apiName of allNames) {
			if (!apiName) continue;
			const apiNameLower = apiName.trim().toLowerCase();

			if (apiNameLower === name) {
				bestMatch = apiName;
				bestConfidence = 1;
				break;
			}

			if (
				apiNameLower.includes(name) &&
				apiNameLower.length > name.length + 2
			) {
				const score =
					name.split(" ").filter((w) => apiNameLower.includes(w)).length /
					Math.max(name.split(" ").length, 1);
				if (score > bestConfidence) {
					bestConfidence = score;
					bestMatch = apiName;
				}
			}

			if (
				name.includes(apiNameLower) &&
				name.length > apiNameLower.length + 3
			) {
				const score =
					apiNameLower.split(" ").filter((w) => name.includes(w)).length /
					Math.max(apiNameLower.split(" ").length, 1);
				if (score > bestConfidence) {
					bestConfidence = score;
					bestMatch = apiName;
				}
			}
		}

		return {
			ticker: candidate.ticker,
			candidateName: candidate.name,
			confirmed: bestConfidence >= 0.7,
			confidence: bestConfidence,
			matchedShareholder: bestMatch,
			matchedCompany: companyData?.company_name ?? undefined,
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		console.error("Verification error for", candidate.ticker, ":", msg);
		return {
			ticker: candidate.ticker,
			candidateName: candidate.name,
			confirmed: false,
			confidence: 0,
		};
	}
}
