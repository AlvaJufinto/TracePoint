import assert from "node:assert/strict";

const tracePayload = {
	search: {
		results: [
			{ ticker: "BBCA.JK", companyName: "PT Bank Central Asia Tbk." },
			{ ticker: "SSIA.JK", companyName: "PT Surya Semesta Internusa Tbk" },
			{ ticker: "TOWR.JK", companyName: "Sarana Menara Nusantara Tbk" },
		],
		totalCount: 3,
		hasMore: false,
		nextOffset: 3,
	},
	verification: {
		results: [
			{
				status: "confirmed",
				ticker: "BBCA.JK",
				screenerName: "PT Dwimuria Investama Andalan",
				ownershipName: "PT Dwimuria Investama Andalan",
				sharePercentage: 0.54942,
				shareAmount: 67729950000,
			},
			{
				status: "confirmed",
				ticker: "SSIA.JK",
				screenerName: "PT Dwimuria Investama Andalan",
				ownershipName: "PT Dwimuria Investama Andalan",
				sharePercentage: 0.1024,
				shareAmount: 482000000,
			},
		],
		processed: 2,
		limited: false,
		maxBatch: 3,
	},
};

const requestedUrls: string[] = [];
globalThis.fetch = (async (input: RequestInfo | URL) => {
	requestedUrls.push(String(input));
	return new Response(JSON.stringify(tracePayload), {
		status: 200,
		headers: { "content-type": "application/json" },
	});
}) as typeof fetch;

const { searchByShareholderName, verifyTraceCandidates } = await import(
	"../lib/trace-fixture-api"
);

const search = await searchByShareholderName("PT Dwimuria Investama Andalan");
assert.deepEqual(
	search.results.map((item) => item.ticker),
	["BBCA.JK", "SSIA.JK", "TOWR.JK"],
);
assert.match(requestedUrls[0], /shareholder=PT%20Dwimuria%20Investama%20Andalan/);

const verification = await verifyTraceCandidates({
	candidates: search.results.map((item) => ({
		ticker: item.ticker,
		companyName: item.companyName,
		screenerName: "PT Dwimuria Investama Andalan",
	})),
	maxBatch: 2,
});
assert.deepEqual(
	verification.results.map((item) => item.ticker),
	["BBCA.JK", "SSIA.JK"],
);
assert.equal(verification.processed, 2);
assert.equal(verification.limited, true);
assert.equal(requestedUrls.length, 1, "search and verification should share one fixture request");

console.log("✓ fixture trace API replays captured shareholder search and verification");
