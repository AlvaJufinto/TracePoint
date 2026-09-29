import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

import { getSectorsApiKey } from "../api/_lib/sectors-key";

type ScreenerResult = { symbol: string; company_name: string };
type SearchResponse = {
	results?: ScreenerResult[];
	pagination?: { total_count?: number; has_next?: boolean };
};
type RawHolder = {
	name: string;
	share_percentage?: string | number | null;
	share_amount?: number | null;
};
type OwnershipResponse = {
	symbol?: string;
	company_name?: string;
	ownership?: { major_shareholders?: RawHolder[] };
};
type Fixture = {
	companies?: Record<
		string,
		{
			overview: { ticker: string; name: string };
			ownership: {
				holders: Array<{
					name: string;
					sharePercentage: number | null;
					shareAmount: number | null;
				}>;
			};
		}
	>;
};

const { values } = parseArgs({
	options: {
		name: { type: "string" },
		limit: { type: "string", default: "3" },
		output: { type: "string" },
	},
});

const shareholderName = values.name?.trim();
if (!shareholderName) throw new Error("Pass --name with the shareholder name");
const requestedLimit = Number.parseInt(values.limit ?? "3", 10);
if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 5) {
	throw new Error("--limit must be an integer from 1 to 5");
}

const apiKey = getSectorsApiKey();
if (!apiKey) throw new Error("SECTORS_API_KEY is not configured");

const fixturePath = resolve("api/fixtures/tracepoint-fixtures.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture;
const normalizedName = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const slug = shareholderName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const outputPath = resolve(
	values.output ?? `api/fixtures/raw/shareholder-trace-${slug}.json`,
);
let liveApiCallsUsed = 0;

async function sectorsGet<T>(endpoint: string, params: Record<string, string | number>): Promise<T> {
	const query = Object.entries(params)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join("&");
	const response = await fetch(`https://api.sectors.app/v2/${endpoint}?${query}`, {
		headers: { Authorization: apiKey, Accept: "application/json" },
		signal: AbortSignal.timeout(15_000),
	});
	liveApiCallsUsed += 1;
	if (!response.ok) {
		throw new Error(`Sectors ${endpoint} returned HTTP ${response.status}`);
	}
	return (await response.json()) as T;
}

const escapedName = shareholderName.replaceAll("'", "''");
const search = await sectorsGet<SearchResponse>("companies/", {
	where: `major_shareholders_name like '%${escapedName}%'`,
	limit: requestedLimit,
	offset: 0,
});
const candidates = (search.results ?? []).slice(0, requestedLimit);
const rawOwnership: Record<string, OwnershipResponse> = {};
const verifications = [];

for (const candidate of candidates) {
	const ticker = candidate.symbol.endsWith(".JK")
		? candidate.symbol
		: `${candidate.symbol}.JK`;
	const existing = fixture.companies?.[ticker];
	if (existing) {
		const holder = existing.ownership.holders.find(
			(item) => normalizedName(item.name) === normalizedName(shareholderName),
		);
		verifications.push(
			holder
				? {
						status: "confirmed",
						ticker,
						screenerName: shareholderName,
						ownershipName: holder.name,
						sharePercentage: holder.sharePercentage,
						shareAmount: holder.shareAmount,
					}
				: { status: "mismatch", ticker, screenerName: shareholderName },
		);
		continue;
	}

	const report = await sectorsGet<OwnershipResponse>(`company/report/${ticker}/`, {
		sections: "ownership",
	});
	rawOwnership[ticker] = report;
	const holder = report.ownership?.major_shareholders?.find(
		(item) => normalizedName(item.name) === normalizedName(shareholderName),
	);
	verifications.push(
		holder
			? {
					status: "confirmed",
					ticker,
					screenerName: shareholderName,
					ownershipName: holder.name,
					sharePercentage:
						holder.share_percentage == null || holder.share_percentage === ""
							? null
							: Number(holder.share_percentage),
					shareAmount: holder.share_amount ?? null,
				}
			: { status: "mismatch", ticker, screenerName: shareholderName },
	);
}

const capture = {
	meta: {
		source: "live-sectors-api",
		capturedAt: new Date().toISOString(),
		shareholderName,
		liveApiCallsUsed,
		maxCandidates: requestedLimit,
		notes: [
			"Existing company fixtures were reused without an upstream request.",
			"Only ownership sections were requested for uncaptured candidates.",
		],
	},
	search,
	rawOwnership,
	normalized: {
		search: {
			results: candidates.map((item) => ({
				ticker: item.symbol.endsWith(".JK") ? item.symbol : `${item.symbol}.JK`,
				companyName: item.company_name,
			})),
			totalCount: search.pagination?.total_count ?? candidates.length,
			hasMore: search.pagination?.has_next ?? false,
			nextOffset: candidates.length,
		},
		verification: {
			results: verifications,
			processed: verifications.length,
			limited: (search.pagination?.total_count ?? candidates.length) > candidates.length,
			maxBatch: requestedLimit,
		},
	},
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(capture, null, 2)}\n`, "utf8");
console.log(
	JSON.stringify(
		{
			outputPath,
			liveApiCallsUsed,
			candidates: candidates.length,
			confirmed: verifications.filter((item) => item.status === "confirmed").length,
		},
		null,
		2,
	),
);
