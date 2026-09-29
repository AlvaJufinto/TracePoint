import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fixturePath = fileURLToPath(
	new URL("../../api/fixtures/tracepoint-fixtures.json", import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const search = fixture.searches["shareholder-pt-dwimuria-investama-andalan"];
const verification = fixture.traceVerifications["shareholder-pt-dwimuria-investama-andalan"];

assert.deepEqual(
	search.results.map((item: { ticker: string }) => item.ticker),
	["BBCA.JK", "SSIA.JK", "TOWR.JK"],
);
assert.deepEqual(
	verification.results.map(
		(item: { ticker: string; status: string; sharePercentage: number }) => [
			item.ticker,
			item.status,
			item.sharePercentage,
		],
	),
	[
		["BBCA.JK", "confirmed", 0.54942],
		["SSIA.JK", "confirmed", 0.1024],
		["TOWR.JK", "confirmed", 0.19954],
	],
);

console.log("✓ Dwimuria fixture contains three verified company connections");
