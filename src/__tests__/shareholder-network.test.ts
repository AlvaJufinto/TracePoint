import assert from "node:assert/strict";

import {
	buildShareholderConnections,
	buildShareholderTraceGraph,
	getAutoTraceShareholderNames,
	mergeShareholderTraceGraphs,
	upsertShareholderTrace,
} from "../utils/trace/shareholder-network";
import type { TraceCandidate } from "../types/tracepoint";

const candidates: TraceCandidate[] = [
	{
		ticker: "BBCA.JK",
		companyName: "PT Bank Central Asia Tbk.",
		screenerName: "PT Holder",
		verification: {
			status: "confirmed",
			ticker: "BBCA.JK",
			screenerName: "PT Holder",
			ownershipName: "PT Holder",
			sharePercentage: 0.55,
			shareAmount: 550,
		},
	},
	{
		ticker: "TEST.JK",
		companyName: "PT Test Tbk.",
		screenerName: "PT Holder",
		verification: {
			status: "confirmed",
			ticker: "TEST.JK",
			screenerName: "PT Holder",
			ownershipName: "PT Holder",
			sharePercentage: null,
			shareAmount: null,
		},
	},
	{
		ticker: "NOPE.JK",
		companyName: "PT Mismatch Tbk.",
		screenerName: "PT Holder",
		verification: {
			status: "mismatch",
			ticker: "NOPE.JK",
			screenerName: "PT Holder",
		},
	},
];

const connections = buildShareholderConnections(
	{
		ticker: "BBCA.JK",
		companyName: "PT Bank Central Asia Tbk.",
		sharePercentage: 0.54942,
		shareAmount: 540,
	},
	candidates,
);

assert.deepEqual(
	connections.map((connection) => connection.ticker),
	["BBCA.JK", "TEST.JK"],
	"Current company stays first, confirmed companies follow, and duplicates are removed",
);
assert.equal(connections[0].sharePercentage, 0.54942);
assert.equal(connections[0].source, "current");
assert.equal(connections[1].sharePercentage, null, "Unknown percentages remain null");
assert.equal(connections[1].source, "confirmed");
assert.ok(!connections.some((connection) => connection.ticker === "NOPE.JK"));

const expansion = buildShareholderTraceGraph({
	shareholderId: "sh-PT%20Holder",
	shareholderName: "PT Holder",
	currentTicker: "BBCA.JK",
	shareholderNode: {
		id: "sh-PT%20Holder",
		type: "customEntity",
		position: { x: 0, y: -280 },
		data: {
			label: "PT Holder",
			subLabel: "Major shareholder",
			dotColor: "purple",
			nodeType: "shareholder",
			bubbleSize: 160,
			sharePercentage: 0.54942,
			shareCategory: "major",
		},
	},
	companyNode: {
		id: "BBCA.JK",
		type: "customEntity",
		position: { x: -120, y: -46 },
		data: {
			label: "BBCA.JK",
			subLabel: "PT Bank Central Asia Tbk.",
			dotColor: "cyan",
			nodeType: "company",
		},
	},
	connections,
});

assert.deepEqual(
	expansion.nodes.map((node) => node.id),
	["trace-company-TEST.JK"],
	"The current target company is not duplicated in the expanded graph",
);
assert.equal(expansion.nodes[0].data.companyRole, "connected");
assert.equal(expansion.nodes[0].data.sharePercentage, null);
assert.equal(expansion.edges[0].source, "sh-PT%20Holder");
assert.equal(expansion.edges[0].target, "trace-company-TEST.JK");
assert.equal(expansion.edges[0].sourceHandle, "top");
assert.equal(expansion.edges[0].targetHandle, "bottom");
assert.equal(expansion.edges[0].label, "Not available");
assert.ok(
	expansion.nodes[0].position.y < -280,
	"Connected companies expand away from the target company",
);

const secondTrace = {
	shareholderName: "PT Second Holder",
	connections: [
		{
			ticker: "OTHER.JK",
			companyName: "PT Other Tbk.",
			sharePercentage: 0.25,
			shareAmount: 250,
			source: "confirmed" as const,
		},
	],
};
const accumulated = upsertShareholderTrace(
	upsertShareholderTrace([], {
		shareholderName: "PT Holder",
		connections,
	}),
	secondTrace,
);
assert.deepEqual(
	accumulated.map((trace) => trace.shareholderName),
	["PT Holder", "PT Second Holder"],
	"Tracing another shareholder keeps the earlier trace",
);
assert.equal(
	upsertShareholderTrace(accumulated, {
		shareholderName: "PT Holder",
		connections: [],
	}).length,
	2,
	"Retracing a shareholder replaces its result without duplicating the trace",
);

const merged = mergeShareholderTraceGraphs([
	expansion,
	{
		nodes: [
			{
				...expansion.nodes[0],
				id: "trace-company-OTHER.JK",
				data: { ...expansion.nodes[0].data, label: "OTHER.JK", ticker: "OTHER.JK" },
			},
		],
		edges: [
			{
				...expansion.edges[0],
				id: "trace-edge-PT%20Second%20Holder-OTHER.JK",
				source: "sh-PT%20Second%20Holder",
				target: "trace-company-OTHER.JK",
			},
		],
	},
]);
assert.deepEqual(
	merged.nodes.map((node) => node.id),
	["trace-company-TEST.JK", "trace-company-OTHER.JK"],
);
assert.equal(merged.edges.length, 2);

assert.deepEqual(
	getAutoTraceShareholderNames([
		{ name: "PT Holder" },
		{ name: "Public" },
		{ name: "PT Second Holder" },
		{ name: "Treasury Stock" },
		{ name: "PT Holder" },
	]),
	["PT Holder", "PT Second Holder"],
	"Auto trace includes every identifiable shareholder once and skips aggregate rows",
);

console.log("✓ Shareholder network contains current and confirmed ownership connections only");
