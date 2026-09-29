import assert from "node:assert/strict";

import {
	buildShareholderConnections,
	buildShareholderTraceGraph,
	shouldShowTraceShareholderAction,
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

assert.equal(
	shouldShowTraceShareholderAction({
		holderName: "PT Holder",
		tracedShareholder: "PT Holder",
		traceLoading: false,
		traceError: false,
		connectedCompanyCount: 0,
	}),
	false,
	"The trace action is hidden after a completed trace finds no other companies",
);
assert.equal(
	shouldShowTraceShareholderAction({
		holderName: "PT Holder",
		tracedShareholder: null,
		traceLoading: false,
		traceError: false,
		connectedCompanyCount: 0,
	}),
	true,
	"The trace action remains available before a trace has been attempted",
);

console.log("✓ Shareholder network contains current and confirmed ownership connections only");
