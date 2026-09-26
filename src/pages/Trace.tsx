/** @format */

import "reactflow/dist/style.css";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Building2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ReactFlow, {
	BaseEdge,
	type Edge,
	type EdgeProps,
	getStraightPath,
	Handle,
	MarkerType,
	type Node,
	Position,
	type ReactFlowInstance,
	useNodesInitialized,
	useReactFlow,
} from "reactflow";

import TraceResultsDrawer from "../components/TraceResultsDrawer";
import {
	getCompanyManagement,
	getCompanyOverview,
	getCompanyOwnership,
	getCorporateActions,
	getFreeFloat,
	getShareholderComposition,
	searchByShareholderName,
	verifyTraceCandidates,
} from "../lib/trace-data-api";
import type {
	GraphNode,
	MetadataEdge,
	OwnershipEdge as OwnershipEdgeType,
	PanelState,
	TraceCandidate,
	TracePointCompany,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
	TracePointOwnershipSnapshot,
} from "../types/tracepoint";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPANY_WIDTH = 240;
const COMPANY_HEIGHT = 92;

const METADATA_WIDTH = 196;
const METADATA_HEIGHT = 62;

const MIN_BUBBLE_SIZE = 76;
const MAX_BUBBLE_SIZE = 188;

// ---------------------------------------------------------------------------
// Panel state helper
// ---------------------------------------------------------------------------

function createPanelState<T>(): PanelState<T> {
	return {
		status: "loading",
		data: null,
		error: null,
	};
}

// ---------------------------------------------------------------------------
// Node / edge types
// ---------------------------------------------------------------------------

type ShareholderCategory =
	| "major"
	| "minority"
	| "corporate"
	| "aggregate"
	| "other";

type EntityNodeData = {
	label: string;
	subLabel: string;
	dotColor: "purple" | "orange" | "cyan" | "green" | "gray";
	nodeType:
		| "company"
		| "shareholder"
		| "management"
		| "affiliate"
		| "conglomerate";
	ticker?: string;
	bubbleSize?: number;
	sharePercentage?: number | null;
	holderCategory?: string;
	shareCategory?: ShareholderCategory;
};

type EntityNode = Node<EntityNodeData>;

// ---------------------------------------------------------------------------
// Custom ReactFlow node
// ---------------------------------------------------------------------------

const CustomEntityNode = ({
	data,
	selected,
}: {
	data: EntityNodeData;
	selected?: boolean;
}) => {
	const isCompany = data.nodeType === "company";
	const isShareholder = data.nodeType === "shareholder";

	if (isShareholder) {
		const size = data.bubbleSize ?? MIN_BUBBLE_SIZE;
		const category = data.shareCategory ?? "other";
		const isLarge = size >= 132;
		const isMedium = size >= 102 && size < 132;

		const categoryLabel =
			category === "aggregate"
				? "Aggregate"
				: category === "corporate"
					? "Corporate"
					: category === "major"
						? "Major"
						: category === "minority"
							? "Minority"
							: "Shareholder";

		const categoryClasses = {
			major: "border-[var(--color-primary)] bg-[var(--color-accent)]/15",
			corporate:
				"border-[var(--color-border-strong)] bg-[var(--color-surface)]",
			minority: "border-[var(--color-border)] bg-white",
			aggregate:
				"border-[var(--color-border-strong)] border-dashed bg-[var(--color-surface)]",
			other: "border-[var(--color-border)] bg-white",
		}[category];
		const selectedClasses = selected
			? "border-2 border-[var(--color-primary)] bg-[var(--color-accent)]/20"
			: "border";
		const indicatorClasses = {
			major: "bg-[var(--color-accent)]",
			corporate: "bg-[var(--color-border-strong)]",
			minority: "bg-[var(--color-border)]",
			aggregate: "border border-[var(--color-border-strong)] bg-transparent",
			other: "bg-[var(--color-border)]",
		}[category];

		return (
			<div
				className={`relative flex flex-col items-center justify-center rounded-full text-center transition-colors duration-150 select-none ${categoryClasses} ${selectedClasses}`}
				style={{
					width: size,
					height: size,
					padding: isLarge ? "14px" : isMedium ? "10px" : "7px",
				}}
			>
				{/* 4 invisible handles on all four quadrants */}
				<Handle
					id="top"
					type="source"
					position={Position.Top}
					className="!opacity-0 !pointer-events-none"
				/>
				<Handle
					id="right"
					type="source"
					position={Position.Right}
					className="!opacity-0 !pointer-events-none"
				/>
				<Handle
					id="bottom"
					type="source"
					position={Position.Bottom}
					className="!opacity-0 !pointer-events-none"
				/>
				<Handle
					id="left"
					type="source"
					position={Position.Left}
					className="!opacity-0 !pointer-events-none"
				/>

				<div className="pointer-events-none flex max-w-[88%] flex-col items-center justify-center overflow-hidden">
					<div className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
						<span className={`h-1.5 w-1.5 shrink-0 ${indicatorClasses}`} />
						{(isLarge || isMedium) && <span>{categoryLabel}</span>}
					</div>

					<div
						title={data.label}
						className={`break-words font-semibold leading-tight text-[var(--color-primary)] ${
							isLarge
								? "line-clamp-3 text-xs"
								: isMedium
									? "line-clamp-2 text-[11px]"
									: "line-clamp-2 text-[10px]"
						}`}
					>
						{data.label}
					</div>

					<div
						className={`mt-1 tabular-nums tracking-tight font-bold text-[var(--color-primary)] ${
							isLarge ? "text-sm" : isMedium ? "text-xs" : "text-[10px]"
						}`}
					>
						{data.sharePercentage != null
							? `${(data.sharePercentage * 100).toFixed(2)}%`
							: "N/A"}
					</div>
				</div>
			</div>
		);
	}

	if (isCompany) {
		return (
			<div
				className={`relative flex h-[92px] w-[240px] flex-col justify-center rounded-[var(--radius-sm)] border px-4 py-3 transition-colors select-none ${
					selected
						? "border-2 border-[var(--color-primary)] bg-[var(--color-accent)]/15"
						: "border-[var(--color-border-strong)] bg-white hover:border-[var(--color-primary)]"
				}`}
			>
				{/* Incoming ownership handles */}
				<Handle
					id="top"
					type="target"
					position={Position.Top}
					className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--color-primary)]"
				/>
				<Handle
					id="right"
					type="target"
					position={Position.Right}
					className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--color-primary)]"
				/>
				<Handle
					id="bottom"
					type="target"
					position={Position.Bottom}
					className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--color-primary)]"
				/>
				<Handle
					id="left"
					type="target"
					position={Position.Left}
					className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--color-primary)]"
				/>

				{/* Outgoing metadata handles */}
				<Handle
					id="meta-top"
					type="source"
					position={Position.Top}
					className="!pointer-events-none !opacity-0"
				/>
				<Handle
					id="meta-right"
					type="source"
					position={Position.Right}
					className="!pointer-events-none !opacity-0"
				/>
				<Handle
					id="meta-bottom"
					type="source"
					position={Position.Bottom}
					className="!pointer-events-none !opacity-0"
				/>
				<Handle
					id="meta-left"
					type="source"
					position={Position.Left}
					className="!pointer-events-none !opacity-0"
				/>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						<Building2 size={13} aria-hidden="true" />
						<span>Target Company</span>
					</div>
					<span
						className="h-2 w-2 bg-[var(--color-accent)]"
						title="Active Target"
					/>
				</div>

				<div className="mt-1">
					<div
						title={data.label}
						className="truncate text-lg font-bold tracking-tight text-[var(--color-primary)]"
					>
						{data.label}
					</div>

					<div
						title={data.subLabel}
						className="truncate text-xs text-[var(--color-muted)]"
					>
						{data.subLabel}
					</div>
				</div>
			</div>
		);
	}

	const isAffiliate = data.nodeType === "affiliate";

	return (
		<div
			className={`relative flex min-h-[62px] w-[196px] flex-col justify-center rounded-[var(--radius-sm)] border border-dashed px-3 py-2 transition-colors select-none ${
				selected
					? "border-2 border-[var(--color-primary)] bg-[var(--color-accent)]/10"
					: "border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
			}`}
		>
			<Handle
				id="top"
				type="target"
				position={Position.Top}
				className="!h-2 !w-2 !opacity-0"
			/>
			<Handle
				id="right"
				type="target"
				position={Position.Right}
				className="!h-2 !w-2 !opacity-0"
			/>
			<Handle
				id="bottom"
				type="target"
				position={Position.Bottom}
				className="!h-2 !w-2 !opacity-0"
			/>
			<Handle
				id="left"
				type="target"
				position={Position.Left}
				className="!h-2 !w-2 !opacity-0"
			/>

			<div className="flex items-center gap-1.5">
				<span
					className="h-1.5 w-1.5 border border-[var(--color-border-strong)]"
					aria-hidden="true"
				/>
				<span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					{isAffiliate ? "Affiliate Context" : "Conglomerate Group"}
				</span>
			</div>

			<div
				className="mt-1 truncate text-xs font-semibold text-[var(--color-primary)]"
				title={data.label}
			>
				{data.label}
			</div>

			<div className="truncate text-[10px] leading-tight text-[var(--color-muted)]">
				{data.subLabel}
			</div>
		</div>
	);
};

const nodeTypes = {
	customEntity: CustomEntityNode,
};

// ---------------------------------------------------------------------------
// Ownership edge
// ---------------------------------------------------------------------------

function OwnershipLine(props: EdgeProps) {
	const [path] = getStraightPath({
		sourceX: props.sourceX,
		sourceY: props.sourceY,
		targetX: props.targetX,
		targetY: props.targetY,
	});

	// Position label 42% along the vector from source to target
	const labelX = props.sourceX * 0.58 + props.targetX * 0.42;
	const labelY = props.sourceY * 0.58 + props.targetY * 0.42;

	return (
		<BaseEdge
			path={path}
			markerEnd={props.markerEnd}
			style={props.style}
			label={props.label}
			labelX={labelX}
			labelY={labelY}
			labelStyle={{
				fill: "#18181B",
				fontSize: 9,
				fontWeight: 700,
			}}
			labelBgStyle={{
				fill: "#FFFFFF",
				stroke: "#D4D4D8",
				strokeWidth: 1,
			}}
			labelBgPadding={[5, 2]}
			labelBgBorderRadius={2}
		/>
	);
}

const edgeTypes = {
	ownership: OwnershipLine,
};

// ---------------------------------------------------------------------------
// Graph helpers
// ---------------------------------------------------------------------------

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

function buildShareholderSubLabel(sh: {
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

function isNonTraceableShareholder(name: string): boolean {
	const normalized = name.trim().toLowerCase();

	return (
		normalized === "public" ||
		normalized === "treasury stock" ||
		normalized === "treasury"
	);
}

function formatShares(amount: number | null | undefined): string {
	if (amount == null || !Number.isFinite(amount)) {
		return "Not available";
	}

	if (amount >= 1_000_000_000_000) {
		return `${(amount / 1_000_000_000_000).toFixed(2)}T`;
	}

	if (amount >= 1_000_000_000) {
		return `${(amount / 1_000_000_000).toFixed(2)}B`;
	}

	if (amount >= 1_000_000) {
		return `${(amount / 1_000_000).toFixed(2)}M`;
	}

	if (amount >= 1_000) {
		return `${(amount / 1_000).toFixed(0)}K`;
	}

	return amount.toLocaleString();
}

function percentage(value: number | null | undefined): string {
	return value == null || !Number.isFinite(value)
		? "Not available"
		: `${(value * 100).toFixed(3)}%`;
}

// ---------------------------------------------------------------------------
// Bubble normalization
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Graph data builder
// ---------------------------------------------------------------------------

function buildGraphData(
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

	// -------------------------------------------------------------------------
	// Affiliates
	// -------------------------------------------------------------------------

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

	// -------------------------------------------------------------------------
	// Conglomerates
	// -------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Radial Bubble Network Layout
// ---------------------------------------------------------------------------

async function layoutGraph(
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
		const R1 = Math.max(248, minInnerR, circInnerR);

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

// ---------------------------------------------------------------------------
// ReactFlow edges
// ---------------------------------------------------------------------------

function toReactFlowEdges(
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

// ---------------------------------------------------------------------------
// Fit graph
// ---------------------------------------------------------------------------

function FitWhenReady() {
	const ready = useNodesInitialized();
	const { fitView } = useReactFlow();

	useEffect(() => {
		if (ready) {
			void fitView({
				padding: 0.12,
				minZoom: 0.1,
				maxZoom: 1,
			});
		}
	}, [ready, fitView]);

	return null;
}

// ---------------------------------------------------------------------------
// Panel feedback
// ---------------------------------------------------------------------------

function PanelFeedback({
	state,
	label,
	retry,
}: {
	state: PanelState<unknown>;
	label: string;
	retry: () => void;
}) {
	if (state.status === "loading") {
		return (
			<p role="status" className="py-4 text-sm text-[var(--color-muted)]">
				Loading {label}…
			</p>
		);
	}

	if (state.status === "error") {
		return (
			<div role="alert" className="py-4 text-sm">
				<p>{label} could not be loaded.</p>

				<button
					className="mt-2 min-h-11 border px-4 font-semibold hover:bg-gray-50"
					onClick={retry}
				>
					Retry {label}
				</button>
			</div>
		);
	}

	return null;
}

// ---------------------------------------------------------------------------
// Main Trace page
// ---------------------------------------------------------------------------

export default function Trace() {
	const [params] = useSearchParams();

	const ticker =
		(params.get("ticker") || "BBCA").trim().toUpperCase().replace(/\.JK$/, "") +
		".JK";

	return <Investigation key={ticker} ticker={ticker} />;
}

function Investigation({ ticker }: { ticker: string }) {
	const [params, setParams] = useSearchParams();

	const [selectedNode, setSelectedNode] = useState<string | null>(null);

	const [company, setCompany] =
		useState<PanelState<TracePointCompany>>(createPanelState);

	const [ownership, setOwnership] =
		useState<PanelState<TracePointOwnershipSnapshot>>(createPanelState);

	const [management, setManagement] =
		useState<PanelState<TracePointManagement>>(createPanelState);

	const [freeFloat, setFreeFloat] =
		useState<PanelState<TracePointFreeFloat>>(createPanelState);

	const [composition, setComposition] =
		useState<PanelState<TracePointComposition>>(createPanelState);

	const [corporateActions, setCorporateActions] =
		useState<PanelState<TracePointCorporateActions>>(createPanelState);

	const [revisions, setRevisions] = useState<Record<string, number>>({});

	const [reactFlowNodes, setReactFlowNodes] = useState<EntityNode[]>([]);

	const [flow, setFlow] = useState<ReactFlowInstance | null>(null);

	const [layoutError, setLayoutError] = useState(false);

	const shareholder = params.get("shareholder");

	const [traceCandidates, setTraceCandidates] = useState<TraceCandidate[]>([]);

	const [traceLoading, setTraceLoading] = useState(false);
	const [traceError, setTraceError] = useState(false);
	const [traceMore, setTraceMore] = useState(false);
	const [traceRevision, setTraceRevision] = useState(0);

	const returnTo = params.get("returnTo");

	const searchLink = returnTo?.startsWith("/search?") ? returnTo : "/search";

	function retryPanel(name: string) {
		setRevisions((current) => ({
			...current,
			[name]: (current[name] || 0) + 1,
		}));
	}

	// -------------------------------------------------------------------------
	// Company
	// -------------------------------------------------------------------------

	useEffect(() => {
		let active = true;

		async function load() {
			setCompany(createPanelState());

			try {
				const data = await getCompanyOverview(ticker);

				if (active) {
					setCompany({
						status: "success",
						data,
						error: null,
					});
				}
			} catch {
				if (active) {
					setCompany({
						status: "error",
						data: null,
						error: "Request failed",
					});
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [ticker, revisions.company]);

	// -------------------------------------------------------------------------
	// Ownership
	// -------------------------------------------------------------------------

	useEffect(() => {
		let active = true;

		async function load() {
			setOwnership(createPanelState());

			try {
				const data = await getCompanyOwnership(ticker);

				if (active) {
					setOwnership({
						status: "success",
						data,
						error: null,
					});
				}
			} catch {
				if (active) {
					setOwnership({
						status: "error",
						data: null,
						error: "Request failed",
					});
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [ticker, revisions.ownership]);

	// -------------------------------------------------------------------------
	// Free float
	// -------------------------------------------------------------------------

	useEffect(() => {
		let active = true;

		async function load() {
			setFreeFloat(createPanelState());

			try {
				const data = await getFreeFloat(ticker);

				if (active) {
					setFreeFloat({
						status: "success",
						data,
						error: null,
					});
				}
			} catch {
				if (active) {
					setFreeFloat({
						status: "error",
						data: null,
						error: "Request failed",
					});
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [ticker, revisions.freeFloat]);

	// -------------------------------------------------------------------------
	// Composition
	// -------------------------------------------------------------------------

	useEffect(() => {
		let active = true;

		async function load() {
			setComposition(createPanelState());

			try {
				const data = await getShareholderComposition(ticker);

				if (active) {
					setComposition({
						status: "success",
						data,
						error: null,
					});
				}
			} catch {
				if (active) {
					setComposition({
						status: "error",
						data: null,
						error: "Request failed",
					});
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [ticker, revisions.composition]);

	// -------------------------------------------------------------------------
	// Corporate actions
	// -------------------------------------------------------------------------

	useEffect(() => {
		let active = true;

		async function load() {
			setCorporateActions(createPanelState());

			try {
				const data = await getCorporateActions(ticker);

				if (active) {
					setCorporateActions({
						status: "success",
						data,
						error: null,
					});
				}
			} catch {
				if (active) {
					setCorporateActions({
						status: "error",
						data: null,
						error: "Request failed",
					});
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [ticker, revisions.corporateActions]);

	// -------------------------------------------------------------------------
	// Management
	// -------------------------------------------------------------------------

	useEffect(() => {
		let active = true;

		async function load() {
			setManagement(createPanelState());

			try {
				const data = await getCompanyManagement(ticker);

				if (active) {
					setManagement({
						status: "success",
						data,
						error: null,
					});
				}
			} catch {
				if (active) {
					setManagement({
						status: "error",
						data: null,
						error: "Request failed",
					});
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [ticker, revisions.management]);

	// -------------------------------------------------------------------------
	// Shareholder tracing
	// -------------------------------------------------------------------------

	useEffect(() => {
		if (!shareholder) {
			return;
		}

		const activeShareholder = shareholder;
		let active = true;

		const controller = new AbortController();

		async function trace() {
			setTraceLoading(true);
			setTraceError(false);
			setTraceCandidates([]);

			try {
				const response = await searchByShareholderName(
					activeShareholder,
					20,
					controller.signal,
				);

				const candidates: TraceCandidate[] = response.results.map((item) => ({
					...item,
					screenerName: activeShareholder,
				}));

				if (!active) {
					return;
				}

				setTraceCandidates(candidates);
				setTraceMore(response.hasMore);

				if (candidates.length) {
					const checked = await verifyTraceCandidates(
						{
							candidates: candidates.slice(0, 5),
						},
						controller.signal,
					);

					if (!active) {
						return;
					}

					setTraceCandidates(
						candidates.map((candidate) => ({
							...candidate,
							verification: checked.results.find(
								(item) => item.ticker === candidate.ticker,
							),
						})),
					);
				}
			} catch (error) {
				if (
					active &&
					!(error instanceof DOMException && error.name === "AbortError")
				) {
					setTraceError(true);
				}
			} finally {
				if (active) {
					setTraceLoading(false);
				}
			}
		}

		void trace();

		return () => {
			active = false;
			controller.abort();
		};
	}, [shareholder, traceRevision]);

	async function verifyNext() {
		const pending = traceCandidates
			.filter(
				(candidate) =>
					!candidate.verification ||
					candidate.verification.status === "not_found",
			)
			.slice(0, 5);

		setTraceLoading(true);
		setTraceError(false);

		try {
			const checked = await verifyTraceCandidates({
				candidates: pending,
			});

			setTraceCandidates((current) =>
				current.map((candidate) => ({
					...candidate,
					verification:
						checked.results.find((item) => item.ticker === candidate.ticker) ||
						candidate.verification,
				})),
			);
		} catch {
			setTraceError(true);
		} finally {
			setTraceLoading(false);
		}
	}

	// -------------------------------------------------------------------------
	// Graph
	// -------------------------------------------------------------------------

	const graphData = useMemo(() => {
		const identity =
			company.data ||
			(ownership.data
				? {
						ticker,
						name: ownership.data.companyName,
					}
				: null);

		return buildGraphData(identity, ownership.data);
	}, [company.data, ownership.data, ticker]);

	useEffect(() => {
		let active = true;

		async function layout() {
			setLayoutError(false);

			try {
				const nodes = await layoutGraph(
					graphData.nodes,
					graphData.ownershipEdges,
					graphData.metadataEdges,
					ownership.data,
				);

				if (active) {
					setReactFlowNodes(nodes);
				}
			} catch {
				if (active) {
					setReactFlowNodes([]);
					setLayoutError(true);
				}
			}
		}

		void layout();

		return () => {
			active = false;
		};
	}, [graphData, ownership.data]);

	useEffect(() => {
		if (!flow || !reactFlowNodes.length) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			void flow.fitView({
				padding: 0.12,
				minZoom: 0.1,
				maxZoom: 1,
			});
		});

		return () => cancelAnimationFrame(frame);
	}, [flow, reactFlowNodes]);

	// -------------------------------------------------------------------------
	// Selected entity
	// -------------------------------------------------------------------------

	const holder = ownership.data?.holders.find(
		(item) => "sh-" + encodeURIComponent(item.name) === selectedNode,
	);

	const selected =
		graphData.nodes.find((node) => node.id === selectedNode) ||
		(holder
			? {
					id: selectedNode!,
					label: holder.name,
					type: "shareholder" as const,
				}
			: undefined);

	const continuedName = params.get("via");
	const origin = params.get("from");

	const latest = composition.data?.latestSnapshot;

	function closeTrace() {
		const next = new URLSearchParams(params);

		next.delete("shareholder");

		setParams(next, {
			replace: true,
		});
	}

	function startTrace(name: string) {
		const next = new URLSearchParams(params);

		next.set("shareholder", name);

		setParams(next);
	}

	function inspect(id: string) {
		setSelectedNode(id);
	}

	const pendingCount = traceCandidates.filter(
		(item) => !item.verification || item.verification.status === "not_found",
	).length;

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	return (
		<div className="min-w-0">
			<header className="mb-6">
				<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
					<h1 className="text-3xl font-bold">{ticker.replace(/\.JK$/, "")}</h1>

					<p className="text-base">
						{company.data?.name ||
							ownership.data?.companyName ||
							(company.status === "loading"
								? "Loading company…"
								: "Company name unavailable")}
					</p>
				</div>

				<PanelFeedback
					state={company}
					label="company details"
					retry={() => retryPanel("company")}
				/>

				{continuedName && (
					<p className="mt-3 break-words text-sm">
						Continuing trace of <strong>{continuedName}</strong>
						{origin && (
							<>
								{" "}
								from{" "}
								<Link
									className="underline"
									to={
										"/trace?" +
										new URLSearchParams({
											ticker: origin,
											shareholder: continuedName,
											returnTo: searchLink,
										})
									}
								>
									{origin}
								</Link>
							</>
						)}
						. Inspect this company’s report to continue.
					</p>
				)}
			</header>

			{/* ----------------------------------------------------------------- */}
			{/* Ownership graph */}
			{/* ----------------------------------------------------------------- */}

			<section
				aria-label="Ownership relationships"
				className="min-w-0 border border-[var(--color-border)] bg-white"
			>
				<div className="px-4">
					<PanelFeedback
						state={ownership}
						label="ownership"
						retry={() => retryPanel("ownership")}
					/>
				</div>

				{ownership.status === "success" && !ownership.data?.holders.length && (
					<div className="p-6">
						<h3 className="text-base font-bold">
							No ownership records available
						</h3>

						<p className="mt-2 text-sm text-[var(--color-muted)]">
							Sectors did not return shareholder records for this company.
							Supporting context may still be available below.
						</p>

						<Link to={searchLink} className="mt-4 inline-block underline">
							Search another company
						</Link>
					</div>
				)}

				{ownership.data && ownership.data.holders.length > 0 && (
					<div className="relative h-[700px] overflow-hidden">
						{layoutError ? (
							<div className="flex h-full items-center justify-center p-6">
								<div className="text-center">
									<p>
										Graph layout could not be loaded. Ownership records remain
										available.
									</p>

									<button
										className="mt-4 min-h-11 border px-4"
										onClick={() => retryPanel("ownership")}
									>
										Retry graph
									</button>
								</div>
							</div>
						) : !reactFlowNodes.length ? (
							<div className="flex h-full items-center justify-center">
								<p role="status">Arranging ownership graph…</p>
							</div>
						) : (
							<ReactFlow
								nodes={reactFlowNodes.map((node) => ({
									...node,
									selected: node.id === selectedNode,
									ariaLabel: node.data.label + ", " + node.data.subLabel,
								}))}
								edges={toReactFlowEdges(
									graphData.ownershipEdges,
									graphData.metadataEdges,
									selectedNode,
									reactFlowNodes,
								)}
								edgeTypes={edgeTypes}
								onInit={setFlow}
								onNodeClick={(_, node) => inspect(node.id)}
								onEdgeClick={(_, edge) =>
									inspect(edge.id.startsWith("me-") ? edge.target : edge.source)
								}
								onPaneClick={() => setSelectedNode(null)}
								nodeTypes={nodeTypes}
								nodesConnectable={false}
								nodesDraggable={false}
								deleteKeyCode={null}
								minZoom={0.1}
								maxZoom={1.5}
								fitView
								fitViewOptions={{
									padding: 0.12,
									minZoom: 0.1,
									maxZoom: 1,
								}}
								className="bg-[var(--color-surface)]"
							>
								<FitWhenReady />
							</ReactFlow>
						)}

						{/* ----------------------------------------------------- */}
						{/* Floating legend */}
						{/* ----------------------------------------------------- */}
						<div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white/95 px-3 py-2 shadow-sm sm:flex">
							<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
								Legend
							</span>

							<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
								<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-primary)] bg-[var(--color-accent)]" />
								<span>Major</span>
							</div>

							<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
								<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)]" />
								<span>Corporate</span>
							</div>

							<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
								<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border)] bg-white" />
								<span>Minority</span>
							</div>

							<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
								<span className="h-2.5 w-2.5 rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]" />
								<span>Aggregate</span>
							</div>

							<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
								<span className="w-5 border-t border-dashed border-[var(--color-border-strong)]" />
								<span>Context</span>
							</div>
						</div>

						{/* ----------------------------------------------------- */}
						{/* Floating inspector */}
						{/* ----------------------------------------------------- */}

						{selected && (
							<div className="absolute right-4 top-4 z-10 w-[min(360px,calc(100%-2rem))] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white shadow-sm">
								<div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
									<div className="min-w-0">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
											{selected.type === "affiliate"
												? "Affiliate metadata"
												: selected.type === "conglomerate"
													? "Conglomerate metadata"
													: selected.type}
										</p>

										<h3 className="mt-1 break-words text-base font-bold">
											{holder?.name ||
												(selected.type === "company"
													? company.data?.name || selected.label
													: selected.label)}
										</h3>
									</div>

									<button
										aria-label="Close inspector"
										onClick={() => setSelectedNode(null)}
										className="flex h-10 w-10 shrink-0 items-center justify-center hover:bg-gray-100"
									>
										<X size={18} />
									</button>
								</div>

								<div className="max-h-[420px] overflow-y-auto p-4">
									{holder ? (
										<>
											<dl className="space-y-3 text-sm">
												<Detail
													label={"Ownership in " + ticker}
													value={percentage(holder.sharePercentage)}
												/>

												<Detail
													label="Shares held"
													value={
														holder.shareAmount == null
															? "Not available"
															: holder.shareAmount.toLocaleString()
													}
												/>

												<Detail
													label="Share value"
													value={
														holder.shareValue == null
															? "Not available"
															: "IDR " + holder.shareValue.toLocaleString()
													}
												/>

												<Detail
													label="Category"
													value={buildShareholderSubLabel(holder)}
												/>
											</dl>

											<p className="mt-4 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted)]">
												Reported by Sectors
												<br />
												Ownership date unavailable
											</p>

											{!isNonTraceableShareholder(holder.name) ? (
												<button
													onClick={() => startTrace(holder.name)}
													className="mt-4 min-h-11 w-full bg-[var(--color-accent)] px-4 font-bold hover:brightness-95"
												>
													Trace shareholder
												</button>
											) : (
												<p className="mt-4 text-sm">
													This aggregate entry does not identify a single
													shareholder and cannot be traced.
												</p>
											)}

											{holder.symbol && (
												<Link
													className="mt-4 inline-block underline"
													to={
														"/trace?" +
														new URLSearchParams({
															ticker: holder.symbol,
															from: ticker,
															via: holder.name,
															returnTo: searchLink,
														})
													}
												>
													Open shareholder company ({holder.symbol})
												</Link>
											)}
										</>
									) : selected.type === "company" ? (
										<p className="text-sm text-[var(--color-muted)]">
											This is the company under investigation. Incoming arrows
											show reported holdings in this company.
										</p>
									) : (
										<p className="text-sm text-[var(--color-muted)]">
											Reported by Sectors as context metadata. This is not
											evidence of an ownership relationship.
										</p>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</section>

			{/* ----------------------------------------------------------------- */}
			{/* Supporting company context */}
			{/* ----------------------------------------------------------------- */}

			<section
				className="mt-8 border-t border-[var(--color-border)] pt-6"
				aria-label="Supporting company context"
			>
				<h2 className="text-xl font-bold">Company context</h2>

				<p className="mt-2 text-sm text-[var(--color-muted)]">
					Supporting information reported by Sectors. Composition dates are
					separate from ownership dates.
				</p>

				<div className="mt-5 grid gap-6 lg:grid-cols-2">
					<div className="min-w-0 border border-[var(--color-border)] bg-white p-5">
						<h3 className="text-base font-bold">Free float</h3>

						<PanelFeedback
							state={freeFloat}
							label="free float"
							retry={() => retryPanel("freeFloat")}
						/>

						{freeFloat.status === "success" && (
							<>
								<p className="mt-3 text-2xl font-bold">
									{percentage(freeFloat.data?.freeFloat)}
								</p>

								<p className="mt-2 text-xs text-[var(--color-muted)]">
									Reported by Sectors; not calculated from shareholder holdings.
								</p>
							</>
						)}

						<details className="mt-6 border-t border-[var(--color-border)] pt-4">
							<summary className="cursor-pointer font-semibold">
								Management
							</summary>

							<PanelFeedback
								state={management}
								label="management"
								retry={() => retryPanel("management")}
							/>

							{management.data?.keyExecutives.length ? (
								<ul className="mt-3 space-y-3">
									{management.data.keyExecutives.map((person, index) => (
										<li key={person.name + index} className="text-sm">
											{person.name}

											<span className="block text-xs text-[var(--color-muted)]">
												{person.position}
											</span>
										</li>
									))}
								</ul>
							) : (
								management.status === "success" && (
									<p className="mt-3 text-sm">
										No management records available.
									</p>
								)
							)}
						</details>
					</div>

					<div className="min-w-0 border border-[var(--color-border)] bg-white p-5">
						<h3 className="text-base font-bold">Shareholder composition</h3>

						<PanelFeedback
							state={composition}
							label="composition"
							retry={() => retryPanel("composition")}
						/>

						{composition.status === "success" && !latest && (
							<p className="mt-3 text-sm">
								No composition snapshot available from Sectors.
							</p>
						)}

						{latest && (
							<>
								<p className="mt-2 text-xs text-[var(--color-muted)]">
									Composition snapshot · {latest.date}
								</p>

								<dl className="mt-4 space-y-3 text-sm">
									<Detail
										label="Total shareholders"
										value={
											latest.numberOfShareholders?.toLocaleString() ??
											"Not available"
										}
									/>

									<Detail
										label="Change from prior month"
										value={
											latest.changeInShareholders == null
												? "Not available"
												: (latest.changeInShareholders > 0 ? "+" : "") +
													latest.changeInShareholders.toLocaleString()
										}
									/>

									<Detail
										label="Local / total shares"
										value={percentage(
											latest.local.total != null &&
												latest.sharesNumber != null &&
												latest.sharesNumber > 0
												? latest.local.total / latest.sharesNumber
												: null,
										)}
									/>

									<Detail
										label="Foreign / total shares"
										value={percentage(
											latest.foreign.total != null &&
												latest.sharesNumber != null &&
												latest.sharesNumber > 0
												? latest.foreign.total / latest.sharesNumber
												: null,
										)}
									/>
								</dl>

								<details className="mt-4 border-t border-[var(--color-border)] pt-4">
									<summary className="cursor-pointer text-sm font-semibold">
										Investor categories · shares
									</summary>

									<div className="mt-3 overflow-x-auto">
										<table className="w-full text-left text-xs">
											<thead>
												<tr>
													<th className="py-2">Category</th>
													<th className="px-2 text-right">Local</th>
													<th className="text-right">Foreign</th>
												</tr>
											</thead>

											<tbody>
												{(
													Object.keys(latest.local) as Array<
														keyof typeof latest.local
													>
												)
													.filter((key) => key !== "total")
													.map((key) => (
														<tr
															className="border-t border-[var(--color-border)]"
															key={key}
														>
															<th className="py-2 font-normal capitalize">
																{key.replace(/([A-Z])/g, " $1")}
															</th>

															<td className="px-2 text-right tabular-nums">
																{latest.local[key]?.toLocaleString() ??
																	"Not available"}
															</td>

															<td className="text-right tabular-nums">
																{latest.foreign[key]?.toLocaleString() ??
																	"Not available"}
															</td>
														</tr>
													))}
											</tbody>
										</table>
									</div>
								</details>
							</>
						)}
					</div>

					<div className="min-w-0 border border-[var(--color-border)] bg-white p-5 lg:col-span-2">
						<h3 className="text-base font-bold">Corporate actions</h3>

						<p className="mt-2 text-xs text-[var(--color-muted)]">
							Company events, not shareholder transactions.
						</p>

						<PanelFeedback
							state={corporateActions}
							label="corporate actions"
							retry={() => retryPanel("corporateActions")}
						/>

						{corporateActions.data && (
							<CorporateActions actions={corporateActions.data} />
						)}
					</div>
				</div>
			</section>

			{/* ----------------------------------------------------------------- */}
			{/* Trace drawer */}
			{/* ----------------------------------------------------------------- */}

			{shareholder && (
				<TraceResultsDrawer
					key={shareholder}
					name={shareholder}
					origin={ticker}
					searchLink={searchLink}
					candidates={traceCandidates}
					isLoading={traceLoading}
					error={traceError}
					hasMore={traceMore}
					onClose={closeTrace}
					onRetry={() => setTraceRevision((value) => value + 1)}
					onVerifyNext={pendingCount ? verifyNext : undefined}
				/>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

function Detail({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
			<dt className="text-[var(--color-muted)]">{label}</dt>
			<dd className="font-semibold tabular-nums">{value}</dd>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Corporate actions
// ---------------------------------------------------------------------------

function CorporateActions({
	actions,
}: {
	actions: TracePointCorporateActions;
}) {
	const events = [
		...(actions.dividends || []).map((item) => ({
			date: item.exDate,
			label: "Dividend",
			description:
				"IDR " +
				formatShares(item.dividendAmount) +
				" per share · Payment: " +
				(item.paymentDate || "Not available"),
		})),

		...(actions.stockSplits || []).map((item) => ({
			date: item.date,
			label: "Stock split",
			description:
				item.splitRatio == null
					? "Ratio not available"
					: "Ratio 1:" + item.splitRatio,
		})),

		...(actions.agm || []).map((item) => ({
			date: item.date,
			label: "General meeting",
			description: item.place || "Location not available",
		})),
	].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

	if (!events.length) {
		return (
			<p className="mt-4 text-sm">
				No corporate actions available from Sectors.
			</p>
		);
	}

	return (
		<ul className="mt-4 divide-y divide-[var(--color-border)]">
			{events.map((event, index) => (
				<li
					className="grid gap-1 py-3 text-sm sm:grid-cols-[120px_140px_1fr]"
					key={event.label + event.date + index}
				>
					<span className="text-[var(--color-muted)]">
						{event.date || "Not available"}
					</span>

					<strong>{event.label}</strong>

					<span className="break-words">{event.description}</span>
				</li>
			))}
		</ul>
	);
}
