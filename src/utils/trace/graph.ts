/** @format */

import { type Edge, MarkerType } from "reactflow";

import type {
	EntityNode,
	EntityNodeData,
	ShareholderCategory,
} from "../../interfaces/trace";
import type {
	GraphNode,
	MetadataEdge,
	OwnershipEdge as OwnershipEdgeType,
	TracePointCompany,
	TracePointOwnershipSnapshot,
} from "../../types/tracepoint";

const COMPANY_WIDTH = 240;
const COMPANY_HEIGHT = 92;
const METADATA_WIDTH = 196;
const METADATA_HEIGHT = 62;
const MIN_BUBBLE_SIZE = 76;
const MAX_BUBBLE_SIZE = 188;

function getShareholderCategory(sh: {
	name: string;
	symbol?: string;
	sharePercentage: number | null;
}): ShareholderCategory {
	if (isNonTraceableShareholder(sh.name)) {
		return "aggregate";
	}

	if (sh.symbol) {
		return "corporate";
	}

	if (sh.sharePercentage != null && sh.sharePercentage > 0.01) {
		return "major";
	}

	if (sh.sharePercentage != null && sh.sharePercentage > 0) {
		return "minority";
	}

	return "other";
}

export function buildShareholderSubLabel(sh: {
	name: string;
	symbol?: string;
	sharePercentage: number | null;
}): string {
	if (isNonTraceableShareholder(sh.name)) {
		return "Aggregate holding · Not traceable";
	}

	if (sh.symbol) {
		return `Corporate shareholder · ${sh.symbol}`;
	}

	if (sh.sharePercentage != null && sh.sharePercentage > 0.01) {
		return "Major shareholder";
	}

	if (sh.sharePercentage != null && sh.sharePercentage > 0) {
		return "Minority shareholder";
	}

	return "Shareholder";
}

export function isNonTraceableShareholder(name: string): boolean {
	const normalized = name.trim().toLowerCase();

	return (
		normalized === "public" ||
		normalized === "treasury stock" ||
		normalized === "treasury"
	);
}

function normalizeBubbleSizes(
	holders: TracePointOwnershipSnapshot["holders"],
): Map<string, number> {
	const values = holders
		.map((holder) => holder.sharePercentage)
		.filter(
			(value): value is number =>
				value != null && Number.isFinite(value) && value >= 0,
		);

	if (!values.length) {
		return new Map(holders.map((holder) => [holder.name, 90]));
	}

	const min = Math.min(...values);
	const max = Math.max(...values);

	if (max === min) {
		return new Map(holders.map((holder) => [holder.name, 130]));
	}

	// Use power transform for perceptual sizing:
	// Area perception with power ~0.4 makes tiny holdings visible with readable text
	// while keeping the largest holdings visually dominant.
	const POWER = 0.42;
	const fMin = Math.pow(Math.max(min, 0.000001), POWER);
	const fMax = Math.pow(Math.max(max, 0.000001), POWER);

	return new Map(
		holders.map((holder) => {
			const value = holder.sharePercentage;

			if (value == null || !Number.isFinite(value) || value < 0) {
				return [holder.name, MIN_BUBBLE_SIZE];
			}

			const fVal = Math.pow(Math.max(value, 0.000001), POWER);
			const normalized = (fVal - fMin) / (fMax - fMin);
			const clamped = Math.max(0, Math.min(1, normalized));

			return [
				holder.name,
				Math.round(
					MIN_BUBBLE_SIZE + clamped * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE),
				),
			];
		}),
	);
}

export function buildGraphData(
	company: TracePointCompany | null,
	ownership: TracePointOwnershipSnapshot | null,
): {
	nodes: GraphNode[];
	ownershipEdges: OwnershipEdgeType[];
	metadataEdges: MetadataEdge[];
} {
	const nodes: GraphNode[] = [];
	const ownershipEdges: OwnershipEdgeType[] = [];
	const metadataEdges: MetadataEdge[] = [];

	if (!company) {
		return {
			nodes,
			ownershipEdges,
			metadataEdges,
		};
	}

	const companyId = company.ticker;

	nodes.push({
		id: companyId,
		label: company.ticker,
		subLabel: company.name,
		type: "company",
		ticker: company.ticker,
	});

	if (!ownership) {
		return {
			nodes,
			ownershipEdges,
			metadataEdges,
		};
	}

	const seenShareholders = new Set<string>();
	const seenOwnershipEdges = new Set<string>();

	for (const sh of ownership.holders) {
		const nodeId = `sh-${encodeURIComponent(sh.name)}`;

		if (!seenShareholders.has(sh.name)) {
			seenShareholders.add(sh.name);

			nodes.push({
				id: nodeId,
				label: sh.name,
				subLabel: buildShareholderSubLabel(sh),
				type: "shareholder",
				ticker: sh.symbol,
			});
		}

		const edgeId = `e-${encodeURIComponent(sh.name)}-${companyId}`;

		if (!seenOwnershipEdges.has(edgeId)) {
			seenOwnershipEdges.add(edgeId);

			ownershipEdges.push({
				id: edgeId,
				sourceId: nodeId,
				targetId: companyId,
				shareholderName: sh.name,
				percentage: sh.sharePercentage,
				shareAmount: sh.shareAmount,
				sourceStatus: "reported",
			});
		}
	}

	const seenAffiliates = new Set<string>();

	for (const aff of company.affiliates ?? []) {
		if (!aff || seenAffiliates.has(aff)) {
			continue;
		}

		seenAffiliates.add(aff);

		const affId = `aff-${encodeURIComponent(aff)}`;

		nodes.push({
			id: affId,
			label: aff,
			subLabel: "Affiliate metadata · Not ownership",
			type: "affiliate",
		});

		metadataEdges.push({
			id: `me-${encodeURIComponent(aff)}-${companyId}`,
			sourceId: companyId,
			targetId: affId,
			type: "affiliate",
			label: "Affiliate",
		});
	}

	const seenConglomerates = new Set<string>();

	for (const cg of ownership.conglomeratesGroup ?? []) {
		if (!cg || seenConglomerates.has(cg)) {
			continue;
		}

		seenConglomerates.add(cg);

		const cgId = `cg-${encodeURIComponent(cg)}`;

		nodes.push({
			id: cgId,
			label: cg,
			subLabel: "Conglomerate metadata · Not ownership",
			type: "conglomerate",
		});

		metadataEdges.push({
			id: `me-cg-${encodeURIComponent(cg)}-${companyId}`,
			sourceId: companyId,
			targetId: cgId,
			type: "conglomerate",
			label: "Conglomerate group",
		});
	}

	return {
		nodes,
		ownershipEdges,
		metadataEdges,
	};
}

export async function layoutGraph(
	graphNodes: GraphNode[],
	_ownershipEdges: OwnershipEdgeType[],
	_metadataEdges: MetadataEdge[],
	ownership: TracePointOwnershipSnapshot | null,
): Promise<EntityNode[]> {
	const companyNode = graphNodes.find((n) => n.type === "company");
	const shareholderNodes = graphNodes.filter((n) => n.type === "shareholder");
	const metadataNodes = graphNodes.filter(
		(n) => n.type === "affiliate" || n.type === "conglomerate",
	);

	const bubbleSizes = ownership
		? normalizeBubbleSizes(ownership.holders)
		: new Map<string, number>();

	const positions = new Map<string, { x: number; y: number }>();

	// 1. Company placed at visual center (0, 0)
	if (companyNode) {
		positions.set(companyNode.id, {
			x: -COMPANY_WIDTH / 2,
			y: -COMPANY_HEIGHT / 2,
		});
	}

	// 2. Arrange shareholder nodes surrounding the company in orbital rings
	if (shareholderNodes.length > 0) {
		// Map holders with percentages, sizes, and categories
		const holderList = shareholderNodes.map((node) => {
			const holder = ownership?.holders.find((h) => h.name === node.label);
			const size = bubbleSizes.get(node.label) ?? MIN_BUBBLE_SIZE;
			const radius = size / 2;
			const percentageVal = holder?.sharePercentage ?? 0;
			const category = holder
				? getShareholderCategory(holder)
				: getShareholderCategory({
						name: node.label,
						symbol: node.ticker,
						sharePercentage: null,
					});

			return {
				id: node.id,
				label: node.label,
				subLabel: node.subLabel,
				ticker: node.ticker,
				size,
				radius,
				percentage: percentageVal,
				category,
				holder,
			};
		});

		// Sort by percentage descending so major holders get primary inner positions
		holderList.sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));

		const N = holderList.length;

		// Determine orbits and tier allocation
		let innerCount = N;
		if (N > 16) {
			innerCount = Math.min(5, Math.max(3, Math.round(N * 0.25)));
		} else if (N > 6) {
			innerCount = Math.min(6, Math.max(3, Math.round(N * 0.35)));
		}

		const innerHolders = holderList.slice(0, innerCount);
		const outerHolders = holderList.slice(innerCount);

		// Calculate orbit radii
		const maxInnerRadius = Math.max(...innerHolders.map((h) => h.radius));
		const sumInnerDiameters = innerHolders.reduce((s, h) => s + h.size + 36, 0);

		const companyBoxDiag = Math.sqrt(
			(COMPANY_WIDTH / 2) ** 2 + (COMPANY_HEIGHT / 2) ** 2,
		);
		const minInnerR = companyBoxDiag + maxInnerRadius + 36;
		const circInnerR = sumInnerDiameters / (2 * Math.PI);
		const R1 = Math.max(272, minInnerR, circInnerR);

		const maxOuterRadius = outerHolders.length
			? Math.max(...outerHolders.map((h) => h.radius))
			: 0;
		const sumOuterDiameters = outerHolders.reduce((s, h) => s + h.size + 28, 0);
		const minOuterR = R1 + maxInnerRadius + maxOuterRadius + 36;
		const circOuterR = sumOuterDiameters / (2 * Math.PI);
		const R2 = Math.max(minOuterR, circOuterR + 18);

		// Assign initial positions
		const simPositions: { x: number; y: number }[] = [];
		const simRadii: number[] = [];
		const simTargetR: number[] = [];
		const innerAngles: number[] = [];

		// Inner orbit initial angles: alternate placement across the circle for balance
		innerHolders.forEach((_, idx) => {
			const angleOffset =
				idx % 2 === 0
					? (idx / 2) * ((2 * Math.PI) / innerCount)
					: -((idx + 1) / 2) * ((2 * Math.PI) / innerCount);
			const angle = -Math.PI / 2 + angleOffset;
			innerAngles.push(angle);
			simPositions.push({
				x: R1 * Math.cos(angle),
				y: R1 * Math.sin(angle),
			});
			simRadii.push(innerHolders[idx].radius);
			simTargetR.push(R1);
		});

		// Keep the outer orbit clear of the largest inner bubble. Straight
		// ownership edges run toward the company, so a shared radial angle
		// would otherwise draw an edge through that bubble.
		if (outerHolders.length > 0) {
			const M = outerHolders.length;
			const anchorAngle = innerAngles[0] ?? -Math.PI / 2;
			const protectedHalfAngle = Math.asin(
				Math.min(0.72, (innerHolders[0].radius + 18) / R1),
			);
			const availableAngle = 2 * Math.PI - protectedHalfAngle * 2;

			outerHolders.forEach((_, idx) => {
				const angle =
					M === 1
						? anchorAngle + Math.PI
						: anchorAngle +
							protectedHalfAngle +
							(idx / (M - 1)) * availableAngle;
				simPositions.push({
					x: R2 * Math.cos(angle),
					y: R2 * Math.sin(angle),
				});
				simRadii.push(outerHolders[idx].radius);
				simTargetR.push(R2);
			});
		}

		// Physics relaxation iterations to completely resolve overlaps
		const ITERATIONS = 80;
		const boxHalfW = COMPANY_WIDTH / 2 + 28;
		const boxHalfH = COMPANY_HEIGHT / 2 + 28;
		const hasMetadata = metadataNodes.length > 0;

		for (let iter = 0; iter < ITERATIONS; iter++) {
			const alpha = 0.65 * (1 - iter / ITERATIONS);

			// Bubble-bubble collision repulsion
			for (let i = 0; i < simPositions.length; i++) {
				for (let j = i + 1; j < simPositions.length; j++) {
					const dx = simPositions[j].x - simPositions[i].x;
					const dy = simPositions[j].y - simPositions[i].y;
					const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
					const minDist = simRadii[i] + simRadii[j] + 20;

					if (dist < minDist) {
						const overlap = (minDist - dist) * 0.5 * alpha;
						const nx = dx / dist;
						const ny = dy / dist;
						simPositions[i].x -= nx * overlap;
						simPositions[i].y -= ny * overlap;
						simPositions[j].x += nx * overlap;
						simPositions[j].y += ny * overlap;
					}
				}
			}

			// Repel from company rectangle
			for (let i = 0; i < simPositions.length; i++) {
				const cx = Math.max(-boxHalfW, Math.min(boxHalfW, simPositions[i].x));
				const cy = Math.max(-boxHalfH, Math.min(boxHalfH, simPositions[i].y));
				const dx = simPositions[i].x - cx;
				const dy = simPositions[i].y - cy;
				const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
				const required = simRadii[i] + 24;

				if (dist < required) {
					const push = (required - dist) * alpha;
					const nx = dx / dist;
					const ny = dy / dist;
					simPositions[i].x += nx * push;
					simPositions[i].y += ny * push;
				}

				// Gentle corridor clearance at bottom for metadata connector lines
				if (
					hasMetadata &&
					Math.abs(simPositions[i].x) < 70 &&
					simPositions[i].y > 60
				) {
					simPositions[i].x += (simPositions[i].x >= 0 ? 1 : -1) * 8 * alpha;
				}
			}

			// Radial anchor towards designated orbit
			for (let i = 0; i < simPositions.length; i++) {
				const curDist =
					Math.sqrt(
						simPositions[i].x * simPositions[i].x +
							simPositions[i].y * simPositions[i].y,
					) || 0.001;
				const targetR = simTargetR[i];
				const radialForce = (targetR - curDist) * 0.07 * alpha;
				simPositions[i].x += (simPositions[i].x / curDist) * radialForce;
				simPositions[i].y += (simPositions[i].y / curDist) * radialForce;
			}
		}

		// Store final top-left positions for ReactFlow
		holderList.forEach((h, idx) => {
			positions.set(h.id, {
				x: simPositions[idx].x - h.radius,
				y: simPositions[idx].y - h.radius,
			});
		});
	}

	// 3. Metadata nodes: placed in a dedicated context zone below the company and bubbles
	if (metadataNodes.length > 0) {
		let maxY = 0;
		positions.forEach((pos, id) => {
			const isCompany = companyNode && id === companyNode.id;
			const metadataNode = graphNodes.find((node) => node.id === id);
			const h = isCompany
				? COMPANY_HEIGHT
				: metadataNode?.type === "shareholder"
					? (bubbleSizes.get(metadataNode.label) ?? MIN_BUBBLE_SIZE)
					: METADATA_HEIGHT;
			maxY = Math.max(maxY, pos.y + h);
		});

		const metaBaseY = Math.max(maxY + 72, 320);
		const M = metadataNodes.length;

		metadataNodes.forEach((node, idx) => {
			const metaX = (idx - (M - 1) / 2) * (METADATA_WIDTH + 32);
			positions.set(node.id, {
				x: metaX - METADATA_WIDTH / 2,
				y: metaBaseY - METADATA_HEIGHT / 2,
			});
		});
	}

	return graphNodes.map((node) => {
		const position = positions.get(node.id) ?? {
			x: 0,
			y: 0,
		};

		const bubbleSize =
			node.type === "shareholder"
				? (bubbleSizes.get(node.label) ?? MIN_BUBBLE_SIZE)
				: undefined;

		const holder =
			node.type === "shareholder"
				? ownership?.holders.find((item) => item.name === node.label)
				: undefined;

		const shareCategory = holder ? getShareholderCategory(holder) : undefined;

		return {
			id: node.id,
			type: "customEntity",
			position,

			data: {
				label: node.label,
				subLabel: node.subLabel,
				dotColor: getNodeColor(node.type),
				nodeType: node.type,
				ticker: node.ticker,
				bubbleSize,
				sharePercentage: holder?.sharePercentage,
				holderCategory: holder ? buildShareholderSubLabel(holder) : undefined,
				shareCategory,
			},

			draggable: false,
			selectable: true,
		};
	});
}

function getNodeColor(type: GraphNode["type"]): EntityNodeData["dotColor"] {
	switch (type) {
		case "company":
			return "cyan";

		case "shareholder":
			return "purple";

		case "management":
			return "orange";

		case "affiliate":
		case "conglomerate":
			return "green";

		default:
			return "gray";
	}
}

export function toReactFlowEdges(
	ownershipEdges: OwnershipEdgeType[],
	metadataEdges: MetadataEdge[],
	selectedNodeId: string | null,
	nodes: EntityNode[] = [],
): Edge[] {
	const edges: Edge[] = [];
	const nodeMap = new Map<string, EntityNode>();
	for (const node of nodes) {
		nodeMap.set(node.id, node);
	}

	for (const edge of ownershipEdges) {
		const isSelected =
			selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId;

		const sourceNode = nodeMap.get(edge.sourceId);
		const targetNode = nodeMap.get(edge.targetId);

		let sourceHandle: string | undefined = undefined;
		let targetHandle: string | undefined = undefined;

		if (sourceNode && targetNode) {
			const sourceSize = sourceNode.data.bubbleSize ?? MIN_BUBBLE_SIZE;
			const sourceCx = sourceNode.position.x + sourceSize / 2;
			const sourceCy = sourceNode.position.y + sourceSize / 2;

			const targetCx = targetNode.position.x + COMPANY_WIDTH / 2;
			const targetCy = targetNode.position.y + COMPANY_HEIGHT / 2;

			const dx = targetCx - sourceCx;
			const dy = targetCy - sourceCy;

			if (Math.abs(dx) >= Math.abs(dy)) {
				if (dx > 0) {
					// Source is to the left of company
					sourceHandle = "right";
					targetHandle = "left";
				} else {
					// Source is to the right of company
					sourceHandle = "left";
					targetHandle = "right";
				}
			} else {
				if (dy > 0) {
					// Source is above company
					sourceHandle = "bottom";
					targetHandle = "top";
				} else {
					// Source is below company
					sourceHandle = "top";
					targetHandle = "bottom";
				}
			}
		}

		edges.push({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
			sourceHandle,
			targetHandle,
			type: "ownership",
			data: {
				curve: 72 + (Math.abs(sourceNode?.position.x ?? 0) % 4) * 10,
			},

			label: buildEdgeLabel(edge),

			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: isSelected ? "#070a25" : "#a1a1aa",
				width: 11,
				height: 11,
			},

			ariaLabel: `${edge.shareholderName} owns ${buildEdgeLabel(
				edge,
			)} of ${edge.targetId}. Reported by Sectors`,

			style: {
				stroke: isSelected ? "#070a25" : "#a1a1aa",
				strokeWidth: isSelected ? 2 : 1.25,
			},
		});
	}

	for (const edge of metadataEdges) {
		const isSelected =
			selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId;

		const sourceNode = nodeMap.get(edge.sourceId);
		const targetNode = nodeMap.get(edge.targetId);

		let sourceHandle: string | undefined = undefined;
		let targetHandle: string | undefined = undefined;

		if (sourceNode && targetNode) {
			const sourceCx = sourceNode.position.x + COMPANY_WIDTH / 2;
			const sourceCy = sourceNode.position.y + COMPANY_HEIGHT / 2;

			const targetCx = targetNode.position.x + METADATA_WIDTH / 2;
			const targetCy = targetNode.position.y + METADATA_HEIGHT / 2;

			const dx = targetCx - sourceCx;
			const dy = targetCy - sourceCy;

			if (Math.abs(dy) >= Math.abs(dx)) {
				if (dy > 0) {
					sourceHandle = "meta-bottom";
					targetHandle = "top";
				} else {
					sourceHandle = "meta-top";
					targetHandle = "bottom";
				}
			} else {
				if (dx > 0) {
					sourceHandle = "meta-right";
					targetHandle = "left";
				} else {
					sourceHandle = "meta-left";
					targetHandle = "right";
				}
			}
		}

		edges.push({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
			sourceHandle,
			targetHandle,
			type: "smoothstep",
			animated: false,

			label: edge.label,

			labelStyle: {
				fontSize: 9,
				fill: "#71717a",
				fontWeight: 600,
			},

			labelBgStyle: {
				fill: "#ffffff",
				stroke: "#d4d4d8",
				strokeWidth: 1,
			},

			labelBgPadding: [5, 2],
			labelBgBorderRadius: 2,

			style: {
				stroke: isSelected ? "#71717a" : "#a1a1aa",
				strokeWidth: isSelected ? 1.75 : 1,
				strokeDasharray: "5 5",
			},
		});
	}

	return edges;
}

function buildEdgeLabel(edge: OwnershipEdgeType): string {
	if (edge.percentage === null || edge.percentage === undefined) {
		return "Not available";
	}

	return `${(edge.percentage * 100).toFixed(3)}%`;
}
