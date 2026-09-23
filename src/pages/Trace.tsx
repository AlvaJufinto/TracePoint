/** @format */

import "reactflow/dist/style.css";

import {
	type MouseEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

import ELK from "elkjs/lib/elk.bundled.js";
import { Building2, Search, User } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactFlow, {
	Background,
	type Edge,
	Handle,
	type Node,
	Position,
} from "reactflow";

import {
	getCompanyManagement,
	getCompanyOverview,
	getCompanyOwnership,
	getCorporateActions,
	getFreeFloat,
	getShareholderComposition,
	searchByShareholderName,
} from "../lib/tracepoint-api";
import type {
	GraphNode,
	MetadataEdge,
	OwnershipEdge as OwnershipEdgeType,
	PanelState,
	TracePointCompany,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
	TracePointOwnershipSnapshot,
	TraceCandidate,
} from "../types/tracepoint";

import TraceResultsDrawer from "../components/TraceResultsDrawer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const elk = new ELK();

const NODE_WIDTH = 260;
const NODE_HEIGHT = 72;

const elkLayoutOptions = {
	"elk.algorithm": "layered",
	"elk.direction": "RIGHT",

	"elk.spacing.nodeNode": "60",
	"elk.spacing.edgeNode": "40",

	"elk.layered.spacing.nodeNodeBetweenLayers": "220",
	"elk.layered.spacing.edgeNodeBetweenLayers": "80",

	"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
	"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",

	"elk.edgeRouting": "ORTHOGONAL",

	"elk.padding": "[top=100,left=100,bottom=100,right=100]",
};

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
};

type EntityNode = Node<EntityNodeData>;

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const dotColors: Record<EntityNodeData["dotColor"], string> = {
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	cyan: "bg-[var(--color-primary)]",
	green: "bg-green-500",
	gray: "bg-gray-400",
};

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
	const hasTarget =
		data.nodeType === "company" ||
		data.nodeType === "affiliate" ||
		data.nodeType === "conglomerate";

	const hasSource =
		data.nodeType === "company" || data.nodeType === "shareholder";

	return (
		<div
			className={`relative flex h-[72px] w-[260px] items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 shadow-sm transition-colors ${
				selected
					? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 ring-2 ring-[var(--color-accent)]/40"
					: "border-[var(--color-border)] bg-white"
			}`}
		>
			{hasTarget && (
				<Handle
					type="target"
					position={Position.Left}
					className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]"
				/>
			)}

			<div
				className={`h-3 w-3 shrink-0 rounded-full ${dotColors[data.dotColor]}`}
			/>

			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-bold text-[var(--color-primary)]">
					{data.label}
				</div>

				<div className="truncate text-xs text-[var(--color-muted)]">
					{data.subLabel}
				</div>
			</div>

			{hasSource && (
				<Handle
					type="source"
					position={Position.Right}
					className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]"
				/>
			)}
		</div>
	);
};

const nodeTypes = {
	customEntity: CustomEntityNode,
};

// ---------------------------------------------------------------------------
// Graph data builder
// ---------------------------------------------------------------------------

function buildGraphData(
	company: TracePointCompany | null,
	ownership: TracePointOwnershipSnapshot | null,
	management: TracePointManagement | null,
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

	// -------------------------------------------------------------------------
	// Shareholders
	// -------------------------------------------------------------------------

	if (ownership) {
		const seenShareholders = new Set<string>();
		const seenOwnershipEdges = new Set<string>();

		for (const sh of ownership.holders) {
			if (isNonTraceableShareholder(sh.name)) {
				continue;
			}

			const nodeId = `sh-${encodeURIComponent(sh.name)}`;

			if (!seenShareholders.has(sh.name)) {
				seenShareholders.add(sh.name);

				nodes.push({
					id: nodeId,
					label: truncateName(sh.name, 30),
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

		// -----------------------------------------------------------------------
		// Affiliates
		// -----------------------------------------------------------------------

		if (company.affiliates) {
			const seenAffiliates = new Set<string>();

			for (const aff of company.affiliates) {
				if (!aff || seenAffiliates.has(aff)) {
					continue;
				}

				seenAffiliates.add(aff);

				const affId = `aff-${encodeURIComponent(aff)}`;

				nodes.push({
					id: affId,
					label: truncateName(aff, 30),
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
		}

		// -----------------------------------------------------------------------
		// Conglomerates
		// -----------------------------------------------------------------------

		if (ownership.conglomeratesGroup) {
			const seenConglomerates = new Set<string>();

			for (const cg of ownership.conglomeratesGroup) {
				if (!cg || seenConglomerates.has(cg)) {
					continue;
				}

				seenConglomerates.add(cg);

				const cgId = `cg-${encodeURIComponent(cg)}`;

				nodes.push({
					id: cgId,
					label: truncateName(cg, 30),
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
		}
	}

	// -------------------------------------------------------------------------
	// Management
	//
	// Management is intentionally NOT connected to the ownership graph.
	// -------------------------------------------------------------------------

	if (management) {
		const seenManagement = new Set<string>();

		for (const exec of management.keyExecutives) {
			if (!exec.name || seenManagement.has(exec.name)) {
				continue;
			}

			seenManagement.add(exec.name);

			const nodeId = `mgmt-${encodeURIComponent(exec.name)}`;

			nodes.push({
				id: nodeId,
				label: truncateName(exec.name, 25),
				subLabel: exec.position,
				type: "management",
			});
		}
	}

	return {
		nodes,
		ownershipEdges,
		metadataEdges,
	};
}

// ---------------------------------------------------------------------------
// Graph helpers
// ---------------------------------------------------------------------------

function buildShareholderSubLabel(sh: {
	name: string;
	symbol?: string;
	sharePercentage: number;
}): string {
	if (sh.symbol) {
		return `Corporate shareholder · ${sh.symbol}`;
	}

	if (sh.sharePercentage > 0.01) {
		return "Major shareholder";
	}

	if (sh.sharePercentage > 0) {
		return "Minority shareholder";
	}

	return "Shareholder";
}

function truncateName(name: string, maxLen: number): string {
	if (name.length <= maxLen) {
		return name;
	}

	return `${name.slice(0, maxLen - 1)}…`;
}

function isNonTraceableShareholder(name: string): boolean {
	const normalized = name.trim().toLowerCase();

	return normalized === "public" || normalized === "treasury stock";
}

function formatShares(amount: number): string {
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

// ---------------------------------------------------------------------------
// ELK layout
// ---------------------------------------------------------------------------

async function layoutGraph(
	graphNodes: GraphNode[],
	ownershipEdges: OwnershipEdgeType[],
	metadataEdges: MetadataEdge[],
): Promise<EntityNode[]> {
	const topologyNodes = graphNodes.filter((node) => node.type !== "management");

	const managementNodes = graphNodes.filter(
		(node) => node.type === "management",
	);

	const topologyNodeIds = new Set(topologyNodes.map((node) => node.id));

	const elkEdges = [
		...ownershipEdges.map((edge) => ({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
		})),

		...metadataEdges.map((edge) => ({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
		})),
	].filter(
		(edge) =>
			topologyNodeIds.has(edge.source) && topologyNodeIds.has(edge.target),
	);

	const elkGraph = {
		id: "tracepoint-root",

		layoutOptions: elkLayoutOptions,

		children: topologyNodes.map((node) => ({
			id: node.id,
			width: NODE_WIDTH,
			height: NODE_HEIGHT,
		})),

		edges: elkEdges.map((edge) => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target],
		})),
	};

	const result = await elk.layout(elkGraph);

	const positions = new Map<
		string,
		{
			x: number;
			y: number;
		}
	>();

	for (const child of result.children ?? []) {
		positions.set(child.id, {
			x: child.x ?? 0,
			y: child.y ?? 0,
		});
	}

	// -------------------------------------------------------------------------
	// Management gets its own row below the graph.
	// -------------------------------------------------------------------------

	if (managementNodes.length > 0) {
		const topologyPositions = Array.from(positions.values());

		const maxY =
			topologyPositions.length > 0
				? Math.max(
						...topologyPositions.map((position) => position.y + NODE_HEIGHT),
					)
				: 0;

		const companyNode = topologyNodes.find((node) => node.type === "company");

		const companyPosition = companyNode
			? positions.get(companyNode.id)
			: undefined;

		const companyCenterX = companyPosition
			? companyPosition.x + NODE_WIDTH / 2
			: NODE_WIDTH / 2;

		const managementGap = 180;
		const managementGapX = 24;

		const managementWidth =
			managementNodes.length * NODE_WIDTH +
			Math.max(0, managementNodes.length - 1) * managementGapX;

		const managementStartX = companyCenterX - managementWidth / 2;

		const managementY = maxY + managementGap;

		managementNodes.forEach((node, index) => {
			positions.set(node.id, {
				x: managementStartX + index * (NODE_WIDTH + managementGapX),
				y: managementY,
			});
		});
	}

	return graphNodes.map((node) => {
		const position = positions.get(node.id) ?? {
			x: 0,
			y: 0,
		};

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
): Edge[] {
	const edges: Edge[] = [];

	for (const edge of ownershipEdges) {
		const isSelected =
			selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId;

		edges.push({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
			type: "smoothstep",

			label: buildEdgeLabel(edge),

			labelStyle: {
				fill: "#070A25",
				fontWeight: 600,
				fontSize: 11,
			},

			labelBgStyle: {
				fill: "#F8F8FF",
				color: "#070A25",
			},

			labelBgPadding: [8, 4],

			labelBgBorderRadius: 4,

			style: {
				stroke: isSelected ? "#CBFF2E" : "#070A25",
				strokeWidth: isSelected ? 2.5 : 1.75,
			},
		});
	}

	for (const edge of metadataEdges) {
		const isSelected =
			selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId;

		edges.push({
			id: edge.id,
			source: edge.sourceId,
			target: edge.targetId,
			type: "smoothstep",
			animated: false,

			style: {
				stroke: isSelected ? "#CBFF2E" : "#16a34a",
				strokeWidth: isSelected ? 2.5 : 1.5,
				strokeDasharray: "6 5",
			},
		});
	}

	return edges;
}

function buildEdgeLabel(edge: OwnershipEdgeType): string {
	if (edge.percentage === null || edge.percentage === undefined) {
		return "Not available";
	}

	const pct = `${(edge.percentage * 100).toFixed(3)}%`;

	if (edge.shareAmount !== null && edge.shareAmount !== undefined) {
		return `${pct}\n${formatShares(edge.shareAmount)}`;
	}

	return pct;
}

// ---------------------------------------------------------------------------
// Main Trace page
// ---------------------------------------------------------------------------

export default function Trace() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const tickerParam = searchParams.get("ticker");

	const ticker = tickerParam
		? `${tickerParam.toUpperCase().replace(/\.JK$/, "")}.JK`
		: "BBCA.JK";

	const [selectedNode, setSelectedNode] = useState<string | null>(null);

	const [company, setCompany] =
		useState<PanelState<TracePointCompany>>(createPanelState());

	const [ownership, setOwnership] =
		useState<PanelState<TracePointOwnershipSnapshot>>(createPanelState());

	const [management, setManagement] =
		useState<PanelState<TracePointManagement>>(createPanelState());

	const [freeFloat, setFreeFloat] =
		useState<PanelState<TracePointFreeFloat>>(createPanelState());

	const [composition, setComposition] =
		useState<PanelState<TracePointComposition>>(createPanelState());

	const [, setCorporateActions] =
		useState<PanelState<TracePointCorporateActions>>(createPanelState());

	const [reactFlowNodes, setReactFlowNodes] = useState<EntityNode[]>([]);

	const shareholderParam = searchParams.get("shareholder");
	const initialTickerParam = searchParams.get("ticker");

	const [traceCandidates, setTraceCandidates] = useState<TraceCandidate[]>([]);
	const [traceLoading, setTraceLoading] = useState(false);

	// -------------------------------------------------------------------------
	// Fetch
	// -------------------------------------------------------------------------

	const fetchCompanyData = useCallback(async () => {
		setCompany(createPanelState());
		setOwnership(createPanelState());
		setManagement(createPanelState());
		setFreeFloat(createPanelState());
		setComposition(createPanelState());
		setCorporateActions(createPanelState());

		setSelectedNode(null);

		const [companyResult, ownershipResult, managementResult] =
			await Promise.allSettled([
				getCompanyOverview(ticker),
				getCompanyOwnership(ticker),
				getCompanyManagement(ticker),
			]);

		if (companyResult.status === "fulfilled") {
			setCompany({
				status: "success",
				data: companyResult.value,
				error: null,
			});
		} else {
			setCompany({
				status: "error",
				data: null,
				error:
					companyResult.reason instanceof Error
						? companyResult.reason.message
						: String(companyResult.reason),
			});
		}

		if (ownershipResult.status === "fulfilled") {
			setOwnership({
				status: "success",
				data: ownershipResult.value,
				error: null,
			});
		} else {
			setOwnership({
				status: "error",
				data: null,
				error:
					ownershipResult.reason instanceof Error
						? ownershipResult.reason.message
						: String(ownershipResult.reason),
			});
		}

		if (managementResult.status === "fulfilled") {
			setManagement({
				status: "success",
				data: managementResult.value,
				error: null,
			});
		} else {
			setManagement({
				status: "error",
				data: null,
				error:
					managementResult.reason instanceof Error
						? managementResult.reason.message
						: String(managementResult.reason),
			});
		}

		const [freeFloatResult, compositionResult, corporateActionsResult] =
			await Promise.allSettled([
				getFreeFloat(ticker),
				getShareholderComposition(ticker),
				getCorporateActions(ticker),
			]);

		if (freeFloatResult.status === "fulfilled") {
			setFreeFloat({
				status: "success",
				data: freeFloatResult.value,
				error: null,
			});
		} else {
			setFreeFloat({
				status: "error",
				data: null,
				error:
					freeFloatResult.reason instanceof Error
						? freeFloatResult.reason.message
						: String(freeFloatResult.reason),
			});
		}

		if (compositionResult.status === "fulfilled") {
			setComposition({
				status: "success",
				data: compositionResult.value,
				error: null,
			});
		} else {
			setComposition({
				status: "error",
				data: null,
				error:
					compositionResult.reason instanceof Error
						? compositionResult.reason.message
						: String(compositionResult.reason),
			});
		}

		if (corporateActionsResult.status === "fulfilled") {
			setCorporateActions({
				status: "success",
				data: corporateActionsResult.value,
				error: null,
			});
		} else {
			setCorporateActions({
				status: "error",
				data: null,
				error:
					corporateActionsResult.reason instanceof Error
						? corporateActionsResult.reason.message
						: String(corporateActionsResult.reason),
			});
		}
	}, [ticker]);

	// Fetch company data when ticker changes
	// eslint-disable-next-line react-hooks/set-state-in-effect -- resetting panel states before async fetch is intentional
	useEffect(() => { fetchCompanyData(); }, [fetchCompanyData]);

	// Fetch trace candidates when shareholder param is present
	useEffect(() => {
		if (shareholderParam && initialTickerParam) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- setLoading(true) before async fetch is intentional
			setTraceLoading(true);
			searchByShareholderName(shareholderParam, 20)
				.then((result) => {
					const candidates: TraceCandidate[] = result.results.map((r) => ({
						ticker: r.ticker,
						companyName: r.companyName,
						screenerName: shareholderParam,
					}));
					setTraceCandidates(candidates);
					setTraceLoading(false);
				})
				.catch(() => {
					setTraceCandidates([]);
					setTraceLoading(false);
				});
		}
	}, [shareholderParam, initialTickerParam]);

	// -------------------------------------------------------------------------
	// Graph data
	// -------------------------------------------------------------------------

	const graphData = useMemo(() => {
		const companyData = company.status === "success" ? company.data : null;

		const ownershipData =
			ownership.status === "success" ? ownership.data : null;

		const managementData =
			management.status === "success" ? management.data : null;

		return buildGraphData(companyData, ownershipData, managementData);
	}, [
		company.status,
		company.data,
		ownership.status,
		ownership.data,
		management.status,
		management.data,
	]);

	// -------------------------------------------------------------------------
	// ELK layout
	// -------------------------------------------------------------------------

	useEffect(() => {
		let cancelled = false;

		async function applyLayout() {
			if (graphData.nodes.length === 0) {
				setReactFlowNodes([]);
				return;
			}

			try {
				const layoutedNodes = await layoutGraph(
					graphData.nodes,
					graphData.ownershipEdges,
					graphData.metadataEdges,
				);

				if (!cancelled) {
					setReactFlowNodes(layoutedNodes);
				}
			} catch (error) {
				console.error("Failed to layout ownership graph:", error);

				if (!cancelled) {
					setReactFlowNodes(
						graphData.nodes.map((node) => ({
							id: node.id,
							type: "customEntity",
							position: {
								x: 0,
								y: 0,
							},
							data: {
								label: node.label,
								subLabel: node.subLabel,
								dotColor: getNodeColor(node.type),
								nodeType: node.type,
								ticker: node.ticker,
							},
							draggable: false,
							selectable: true,
						})),
					);
				}
			}
		}

		void applyLayout();

		return () => {
			cancelled = true;
		};
	}, [graphData.nodes, graphData.ownershipEdges, graphData.metadataEdges]);

	// -------------------------------------------------------------------------
	// Edges
	// -------------------------------------------------------------------------

	const reactFlowEdges = useMemo(
		() =>
			toReactFlowEdges(
				graphData.ownershipEdges,
				graphData.metadataEdges,
				selectedNode,
			),
		[graphData.ownershipEdges, graphData.metadataEdges, selectedNode],
	);

	// -------------------------------------------------------------------------
	// Interaction
	// -------------------------------------------------------------------------

	const onNodeClick = useCallback((_event: MouseEvent, node: Node) => {
		setSelectedNode(node.id);
	}, []);

	const onPaneClick = useCallback(() => {
		setSelectedNode(null);
	}, []);

	// -------------------------------------------------------------------------
	// Derived data
	// -------------------------------------------------------------------------

	const totalOwnershipPct = useMemo(() => {
		if (!ownership.data) {
			return null;
		}

		let total = 0;

		for (const sh of ownership.data.holders) {
			if (isNonTraceableShareholder(sh.name)) {
				continue;
			}

			total += sh.sharePercentage;
		}

		return total;
	}, [ownership.data]);

	const freeFloatPct =
		freeFloat.status === "success" && freeFloat.data
			? `${(freeFloat.data.freeFloat * 100).toFixed(3)}%`
			: null;

	const latestComp =
		composition.status === "success" && composition.data
			? composition.data.latestSnapshot
			: null;

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	return (
		<div className="flex h-screen overflow-hidden bg-[var(--color-surface)] font-sans text-[var(--color-primary)]">
			<aside className="z-20 flex w-14 flex-col items-center border-r border-[var(--color-border)] bg-white py-4">
				<div className="mb-8 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]">
					<div className="h-3 w-3 rounded-full bg-[var(--color-primary)]" />
				</div>

				<nav className="flex flex-1 flex-col gap-6">
					<button
						type="button"
						onClick={() => navigate("/search")}
						className="text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
						title="Back to search"
						aria-label="Back to search"
					>
						<Search size={20} />
					</button>

					<button
						type="button"
						className={`rounded-[var(--radius-sm)] p-2 transition-colors ${
							selectedNode
								? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
								: "text-[var(--color-muted)] hover:text-[var(--color-primary)]"
						}`}
						onClick={() => {
							if (selectedNode) {
								setSelectedNode(null);
							}
						}}
						title="Clear selection"
						aria-label="Clear selection"
					>
						<User size={20} />
					</button>
				</nav>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
					<div>
						<div className="mb-0.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
							Investigation
						</div>

						<div className="flex items-baseline gap-2">
							<h1 className="text-lg font-bold">{ticker}</h1>

							<span className="text-sm text-[var(--color-muted)]">
								{company.status === "success" && company.data
									? company.data.name
									: company.status === "loading"
										? "Loading..."
										: "Error loading company"}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="relative">
							<Search
								size={16}
								className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
							/>

							<input
								type="text"
								readOnly
								value={ticker}
								className="w-48 cursor-not-allowed rounded-full border border-[var(--color-border)] bg-white py-1.5 pl-10 pr-12 text-sm text-[var(--color-primary)]"
								aria-label={`Current ticker: ${ticker}`}
							/>
						</div>

						<div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs text-[var(--color-muted)]">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							Live response
						</div>
					</div>
				</header>

				<main className="flex min-h-0 flex-1 gap-6 overflow-hidden p-6">
					<div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white">
						<div className="pointer-events-none absolute left-6 top-4 z-10 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
							OWNERSHIP MAP
						</div>

						<div className="pointer-events-none absolute right-6 top-4 z-10">
							<div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs text-[var(--color-muted)]">
								<div className="h-2 w-2 rounded-full bg-green-500" />
								Live response
							</div>
						</div>

						<div className="min-h-0 flex-1">
							<ReactFlow
								nodes={reactFlowNodes}
								edges={reactFlowEdges}
								onNodeClick={onNodeClick}
								onPaneClick={onPaneClick}
								nodeTypes={nodeTypes}
								fitView
								fitViewOptions={{
									padding: 0.25,
									minZoom: 0.35,
									maxZoom: 1.2,
								}}
								defaultEdgeOptions={{
									type: "smoothstep",
								}}
								className="bg-[var(--color-surface)]"
							>
								<Background color="#d1d5db" gap={24} size={1} />
							</ReactFlow>
						</div>

						<div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-4">
							<div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs text-[var(--color-muted)]">
								<div className="h-0.5 w-4 bg-[var(--color-primary)]" />
								Reported ownership
							</div>

							<div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs text-[var(--color-muted)]">
								<div className="h-0 w-4 border-t-2 border-dashed border-green-500" />
								Context metadata
							</div>
						</div>
					</div>

					<div className="flex w-[420px] shrink-0 flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white">
						{selectedNode ? (
							<SelectedNodeDetail
								nodeId={selectedNode}
								graphNodes={graphData.nodes}
								ownershipData={
									ownership.status === "success" ? ownership.data : null
								}
								companyData={company.status === "success" ? company.data : null}
							/>
						) : (
							<div className="flex-1 overflow-y-auto p-6">
								<h2 className="mb-1 text-xl font-bold text-[var(--color-primary)]">
									{ticker} ownership context
								</h2>

								<p className="mb-6 text-sm text-[var(--color-muted)]">
									Latest available snapshot · Live from Sectors API
								</p>

								<div className="mb-6 grid grid-cols-2 gap-4">
									<div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-gray-50 p-4">
										<div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
											FREE FLOAT
										</div>

										<div className="mb-1 text-2xl font-bold text-[var(--color-primary)]">
											{freeFloatPct || (
												<span className="text-[var(--color-muted)]">
													{freeFloat.status === "loading"
														? "..."
														: "Not available"}
												</span>
											)}
										</div>

										{freeFloat.status === "success" && freeFloat.data && (
											<div className="text-xs text-[var(--color-primary)]">
												From Sectors endpoint
											</div>
										)}
									</div>

									<div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-gray-50 p-4">
										<div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
											SHAREHOLDERS
										</div>

										<div className="mb-1 text-2xl font-bold text-[var(--color-primary)]">
											{ownership.status === "success" && ownership.data
												? ownership.data.holders.length
												: ownership.status === "loading"
													? "..."
													: "Not available"}
										</div>

										{latestComp && (
											<div className="text-xs text-green-600">
												+{latestComp.changeInShareholders.toLocaleString()} vs
												prior month
											</div>
										)}
									</div>
								</div>

								{ownership.status === "success" && ownership.data && (
									<div className="mb-6 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-gray-50 p-4">
										<div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
											TOTAL REPORTED OWNERSHIP
										</div>

										<div className="text-2xl font-bold text-[var(--color-primary)]">
											{totalOwnershipPct !== null
												? `${(totalOwnershipPct * 100).toFixed(2)}%`
												: "Not available"}
										</div>

										<p className="mt-1 text-xs text-[var(--color-muted)]">
											Sum of reported major shareholders. Remaining is
											public/free float.
										</p>
									</div>
								)}

								{latestComp && (
									<div className="mb-6 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-gray-50 p-5">
										<div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
											LOCAL / FOREIGN COMPOSITION
										</div>

										<div className="mb-5">
											<div className="mb-2 flex justify-between text-sm text-[var(--color-primary)]">
												<span>Local</span>

												<span>
													{(
														(latestComp.local.total / latestComp.sharesNumber) *
														100
													).toFixed(2)}
													%
												</span>
											</div>

											<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
												<div
													className="h-full bg-[var(--color-primary)]"
													style={{
														width: `${(
															(latestComp.local.total /
																latestComp.sharesNumber) *
															100
														).toFixed(2)}%`,
													}}
												/>
											</div>
										</div>

										<div>
											<div className="mb-2 flex justify-between text-sm text-[var(--color-primary)]">
												<span>Foreign</span>

												<span>
													{(
														(latestComp.foreign.total /
															latestComp.sharesNumber) *
														100
													).toFixed(2)}
													%
												</span>
											</div>

											<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
												<div
													className="h-full bg-purple-500"
													style={{
														width: `${(
															(latestComp.foreign.total /
																latestComp.sharesNumber) *
															100
														).toFixed(2)}%`,
													}}
												/>
											</div>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</main>
			</div>

			<TraceResultsDrawer candidates={traceCandidates} isLoading={traceLoading} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Selected node detail
// ---------------------------------------------------------------------------

function SelectedNodeDetail({
	nodeId,
	graphNodes,
	ownershipData,
	companyData,
}: {
	nodeId: string;
	graphNodes: GraphNode[];
	ownershipData: TracePointOwnershipSnapshot | null;
	companyData: TracePointCompany | null;
}) {
	const node = graphNodes.find((candidate) => candidate.id === nodeId);

	const navigate = useNavigate();

	if (!node) {
		return (
			<div className="flex-1 overflow-y-auto p-6 text-center text-[var(--color-muted)]">
				Node not found
			</div>
		);
	}

	const shareholder =
		ownershipData && node.type === "shareholder"
			? (ownershipData.holders.find(
					(holder) =>
						holder.name === decodeURIComponent(nodeId.replace("sh-", "")),
				) ?? null)
			: null;

	const isSelectedShareholder = node.type === "shareholder";

	return (
		<div className="flex-1 overflow-y-auto p-6">
			<div className="mb-1 text-xs font-semibold text-[var(--color-primary)]">
				{node.type === "company"
					? "Company"
					: node.type === "shareholder"
						? "Shareholder"
						: node.type === "management"
							? "Management"
							: node.type === "affiliate"
								? "Affiliate"
								: "Conglomerate"}
			</div>

			<h2 className="mb-4 text-2xl font-bold text-[var(--color-primary)]">
				{node.label}
			</h2>

			<div className="mb-6 flex flex-wrap gap-2">
				<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
					{node.type}
				</span>

				{node.ticker && (
					<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
						{node.ticker}
					</span>
				)}

				<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
					Reported by Sectors
				</span>
			</div>

			{isSelectedShareholder && shareholder && (
				<div className="mb-8 space-y-4 border-t border-[var(--color-border)] pt-4">
					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--color-muted)]">
							Ownership in {companyData?.ticker || "company"}
						</span>

						<span className="font-bold text-[var(--color-primary)]">
							{(shareholder.sharePercentage * 100).toFixed(3)}%
						</span>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--color-muted)]">
							Shares held
						</span>

						<span className="font-bold text-[var(--color-primary)]">
							{formatShares(shareholder.shareAmount)}
						</span>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--color-muted)]">
							Share value
						</span>

						<span className="font-bold text-[var(--color-primary)]">
							IDR {formatShares(shareholder.shareValue)}
						</span>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--color-muted)]">
							Ownership date
						</span>

						<span className="font-bold text-orange-600">Not available</span>
					</div>
				</div>
			)}

			<div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-gray-50 p-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm font-bold text-[var(--color-primary)]">
							{isSelectedShareholder
								? "Trace this shareholder"
								: "Open as focal company"}
						</div>

						<div className="mt-0.5 text-xs text-[var(--color-muted)]">
							{isSelectedShareholder
								? "Verify across other companies via Company Report"
								: "Explore further ownership relationships"}
						</div>
					</div>

					<button
						type="button"
						onClick={() => {
							if (isSelectedShareholder && shareholder) {
								navigate(
									`/trace?shareholder=${encodeURIComponent(shareholder.name)}&ticker=${encodeURIComponent(companyData?.ticker ?? "")}`,
								);
							} else if (companyData) {
								navigate(
									`/trace?ticker=${encodeURIComponent(companyData.ticker)}`,
								);
							}
						}}
						className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-accent)] transition-colors hover:opacity-90"
					>
						<Building2 size={14} />
						{isSelectedShareholder ? "Trace" : "Open"}
					</button>
				</div>
			</div>
		</div>
	);
}
