import { MarkerType, type Edge } from "reactflow";

import type { EntityNode } from "../../interfaces/trace";
import type { TraceCandidate } from "../../types/tracepoint";

export interface ShareholderConnection {
	ticker: string;
	companyName: string;
	sharePercentage: number | null;
	shareAmount: number | null;
	source: "current" | "confirmed";
}

export type CurrentShareholderConnection = Omit<
	ShareholderConnection,
	"source"
>;

export function buildShareholderConnections(
	current: CurrentShareholderConnection | null,
	candidates: TraceCandidate[],
): ShareholderConnection[] {
	const connections = new Map<string, ShareholderConnection>();

	if (current) {
		connections.set(current.ticker, { ...current, source: "current" });
	}

	for (const candidate of candidates) {
		if (candidate.verification?.status !== "confirmed") continue;
		if (connections.has(candidate.ticker)) continue;

		connections.set(candidate.ticker, {
			ticker: candidate.ticker,
			companyName: candidate.companyName,
			sharePercentage: candidate.verification.sharePercentage ?? null,
			shareAmount: candidate.verification.shareAmount ?? null,
			source: "confirmed",
		});
	}

	return [...connections.values()];
}

export function shouldShowTraceShareholderAction({
	holderName,
	tracedShareholder,
	traceLoading,
	traceError,
	connectedCompanyCount,
}: {
	holderName: string;
	tracedShareholder: string | null;
	traceLoading: boolean;
	traceError: boolean;
	connectedCompanyCount: number;
}): boolean {
	const completedWithoutConnections =
		tracedShareholder === holderName &&
		!traceLoading &&
		!traceError &&
		connectedCompanyCount === 0;

	return !completedWithoutConnections;
}

type BuildTraceGraphInput = {
	shareholderId: string;
	shareholderName: string;
	currentTicker: string;
	shareholderNode: EntityNode;
	companyNode: EntityNode;
	connections: ShareholderConnection[];
};

export function buildShareholderTraceGraph({
	shareholderId,
	shareholderName,
	currentTicker,
	shareholderNode,
	companyNode,
	connections,
}: BuildTraceGraphInput): { nodes: EntityNode[]; edges: Edge[] } {
	const tracedConnections = connections.filter(
		(connection) => connection.ticker !== currentTicker,
	);
	if (!tracedConnections.length) return { nodes: [], edges: [] };

	const shareholderSize = shareholderNode.data.bubbleSize ?? 76;
	const shareholderCenter = {
		x: shareholderNode.position.x + shareholderSize / 2,
		y: shareholderNode.position.y + shareholderSize / 2,
	};
	const companyCenter = {
		x: companyNode.position.x + 120,
		y: companyNode.position.y + 46,
	};
	const deltaX = shareholderCenter.x - companyCenter.x;
	const deltaY = shareholderCenter.y - companyCenter.y;
	const length = Math.hypot(deltaX, deltaY) || 1;
	const outward = { x: deltaX / length, y: deltaY / length };
	const tangent = { x: -outward.y, y: outward.x };
	const spread = 180;
	const radius = 275;

	const nodes: EntityNode[] = tracedConnections.map((connection, index) => {
		const offset = (index - (tracedConnections.length - 1) / 2) * spread;
		return {
			id: `trace-company-${connection.ticker}`,
			type: "customEntity",
			position: {
				x: shareholderCenter.x + outward.x * radius + tangent.x * offset - 66,
				y: shareholderCenter.y + outward.y * radius + tangent.y * offset - 66,
			},
			data: {
				label: connection.ticker,
				subLabel: connection.companyName,
				dotColor: "cyan",
				nodeType: "company",
				companyRole: "connected",
				ticker: connection.ticker,
				sharePercentage: connection.sharePercentage,
			},
			draggable: true,
			selectable: true,
			className: "trace-company-node",
		};
	});

	const edges: Edge[] = tracedConnections.map((connection, index) => {
		const target = nodes[index];
		const targetCenter = {
			x: target.position.x + 66,
			y: target.position.y + 66,
		};
		const dx = targetCenter.x - shareholderCenter.x;
		const dy = targetCenter.y - shareholderCenter.y;
		const horizontal = Math.abs(dx) >= Math.abs(dy);
		const sourceHandle = horizontal ? (dx > 0 ? "right" : "left") : dy > 0 ? "bottom" : "top";
		const targetHandle = horizontal ? (dx > 0 ? "left" : "right") : dy > 0 ? "top" : "bottom";

		return {
			id: `trace-edge-${encodeURIComponent(shareholderName)}-${connection.ticker}`,
			source: shareholderId,
			target: `trace-company-${connection.ticker}`,
			sourceHandle,
			targetHandle,
			type: "ownership",
			animated: true,
			label:
				connection.sharePercentage == null
					? "Not available"
					: `${(connection.sharePercentage * 100).toFixed(3)}%`,
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: "#070a25",
				width: 11,
				height: 11,
			},
			style: { stroke: "#070a25", strokeWidth: 2 },
			data: { curve: 44, traced: true },
		};
	});

	return { nodes, edges };
}
