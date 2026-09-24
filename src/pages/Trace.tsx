/** @format */

import "reactflow/dist/style.css";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import ELK from "elkjs/lib/elk.bundled.js";
import { Building2, Maximize2, User, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import ReactFlow, {
	Background,
	BaseEdge,
	type Edge,
	type EdgeProps,
	getSmoothStepPath,
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
} from "../lib/tracepoint-api";
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

const elk = new ELK();

const NODE_WIDTH = 260;
const NODE_HEIGHT = 96;

const elkLayoutOptions = {
	"elk.algorithm": "layered",
	"elk.direction": "RIGHT",

	"elk.spacing.nodeNode": "24",
	"elk.spacing.edgeNode": "40",

	"elk.layered.spacing.nodeNodeBetweenLayers": "160",
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
			className={`relative flex h-24 w-[260px] items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-3 transition-colors ${
				selected
					? "border-[var(--color-primary)] bg-[var(--color-accent)]/20 ring-2 ring-[var(--color-primary)]"
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

			{data.nodeType === "company" ? (
				<Building2 size={18} aria-hidden="true" />
			) : data.nodeType === "shareholder" ? (
				<User size={18} aria-hidden="true" />
			) : (
				<span className="text-lg" aria-hidden="true">
					◇
				</span>
			)}

			<div className="min-w-0 flex-1">
				<div
					title={data.label}
					className="line-clamp-2 break-words text-sm font-bold text-[var(--color-primary)]"
				>
					{data.label}
				</div>

				<div className="mt-1 text-xs text-[var(--color-muted)]">
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

function OwnershipLine(props: EdgeProps) {
	const [path] = getSmoothStepPath(props);
	return (
		<BaseEdge
			path={path}
			markerEnd={props.markerEnd}
			style={props.style}
			label={props.label}
			labelX={props.sourceX + 68}
			labelY={props.sourceY - 12}
			labelStyle={{ fill: "#070A25", fontSize: 12, fontWeight: 600 }}
			labelBgStyle={{ fill: "#F8F8FF" }}
			labelBgPadding={[5, 3]}
		/>
	);
}
const edgeTypes = { ownership: OwnershipLine };

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

	// -------------------------------------------------------------------------
	// Shareholders
	// -------------------------------------------------------------------------

	if (ownership) {
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
	sharePercentage: number | null;
}): string {
	if (isNonTraceableShareholder(sh.name))
		return "Aggregate holding · Not traceable";
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
	if (amount == null || !Number.isFinite(amount)) return "Not available";
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
			markerEnd: { type: MarkerType.ArrowClosed, color: "#070A25" },
			ariaLabel: `${edge.shareholderName} owns ${buildEdgeLabel(edge)} of ${edge.targetId}. Reported by Sectors`,

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
				stroke: "#070A25",
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
			label: edge.label + " metadata",
			labelStyle: { fontSize: 11, fill: "#52525b" },

			style: {
				stroke: "#71717a",
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

	return pct;
}

// ---------------------------------------------------------------------------
// Main Trace page
// ---------------------------------------------------------------------------

function percentage(value: number | null | undefined) {
	return value == null || !Number.isFinite(value)
		? "Not available"
		: (value * 100).toFixed(3) + "%";
}

function FitWhenReady() {
	const ready = useNodesInitialized();
	const { fitView } = useReactFlow();
	useEffect(() => {
		if (ready) void fitView({ padding: 0.12, minZoom: 0.15, maxZoom: 1 });
	}, [ready, fitView]);
	return null;
}

function PanelFeedback({
	state,
	label,
	retry,
}: {
	state: PanelState<unknown>;
	label: string;
	retry: () => void;
}) {
	if (state.status === "loading")
		return (
			<p role="status" className="py-4 text-sm text-[var(--color-muted)]">
				Loading {label}…
			</p>
		);
	if (state.status === "error")
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
	return null;
}

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
	const [showMetadata, setShowMetadata] = useState(false);
	const [graphPage, setGraphPage] = useState(0);
	const [view, setView] = useState<"graph" | "list">(() =>
		window.matchMedia("(max-width: 767px)").matches ? "list" : "graph",
	);
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

	// Each section settles independently; cleanup prevents an older company request
	// from overwriting the next investigation.
	useEffect(() => {
		let active = true;
		async function load<T>(
			fetcher: () => Promise<T>,
			setter: (state: PanelState<T>) => void,
		) {
			setter(createPanelState());
			try {
				const data = await fetcher();
				if (active) setter({ status: "success", data, error: null });
			} catch {
				if (active)
					setter({ status: "error", data: null, error: "Request failed" });
			}
		}
		void load(() => getCompanyOverview(ticker), setCompany);
		return () => {
			active = false;
		};
	}, [ticker, revisions.company]);
	useEffect(() => {
		let active = true;
		async function load() {
			setOwnership(createPanelState());
			try {
				const data = await getCompanyOwnership(ticker);
				if (active) setOwnership({ status: "success", data, error: null });
			} catch {
				if (active)
					setOwnership({
						status: "error",
						data: null,
						error: "Request failed",
					});
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [ticker, revisions.ownership]);
	useEffect(() => {
		let active = true;
		async function load() {
			setFreeFloat(createPanelState());
			try {
				const data = await getFreeFloat(ticker);
				if (active) setFreeFloat({ status: "success", data, error: null });
			} catch {
				if (active)
					setFreeFloat({
						status: "error",
						data: null,
						error: "Request failed",
					});
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [ticker, revisions.freeFloat]);
	useEffect(() => {
		let active = true;
		async function load() {
			setComposition(createPanelState());
			try {
				const data = await getShareholderComposition(ticker);
				if (active) setComposition({ status: "success", data, error: null });
			} catch {
				if (active)
					setComposition({
						status: "error",
						data: null,
						error: "Request failed",
					});
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [ticker, revisions.composition]);
	useEffect(() => {
		let active = true;
		async function load() {
			setCorporateActions(createPanelState());
			try {
				const data = await getCorporateActions(ticker);
				if (active)
					setCorporateActions({ status: "success", data, error: null });
			} catch {
				if (active)
					setCorporateActions({
						status: "error",
						data: null,
						error: "Request failed",
					});
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [ticker, revisions.corporateActions]);
	useEffect(() => {
		let active = true;
		async function load() {
			setManagement(createPanelState());
			try {
				const data = await getCompanyManagement(ticker);
				if (active) setManagement({ status: "success", data, error: null });
			} catch {
				if (active)
					setManagement({
						status: "error",
						data: null,
						error: "Request failed",
					});
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [ticker, revisions.management]);

	useEffect(() => {
		if (!shareholder) return;
		let active = true;
		const controller = new AbortController();
		async function trace() {
			setTraceLoading(true);
			setTraceError(false);
			setTraceCandidates([]);
			try {
				const response = await searchByShareholderName(
					shareholder!,
					20,
					controller.signal,
				);
				const candidates = response.results.map((item) => ({
					...item,
					screenerName: shareholder!,
				}));
				if (!active) return;
				setTraceCandidates(candidates);
				setTraceMore(response.hasMore);
				if (candidates.length) {
					const checked = await verifyTraceCandidates(
						{ candidates: candidates.slice(0, 5) },
						controller.signal,
					);
					if (!active) return;
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
				)
					setTraceError(true);
			} finally {
				if (active) setTraceLoading(false);
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
			const checked = await verifyTraceCandidates({ candidates: pending });
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

	const graphData = useMemo(() => {
		const identity =
			company.data ||
			(ownership.data ? { ticker, name: ownership.data.companyName } : null);
		const pagedOwnership = ownership.data
			? {
					...ownership.data,
					holders: ownership.data.holders.slice(
						graphPage * 5,
						graphPage * 5 + 5,
					),
				}
			: null;
		const graph = buildGraphData(identity, pagedOwnership);
		return showMetadata
			? graph
			: {
					...graph,
					nodes: graph.nodes.filter(
						(node) => node.type === "company" || node.type === "shareholder",
					),
					metadataEdges: [],
				};
	}, [company.data, ownership.data, ticker, showMetadata, graphPage]);

	useEffect(() => {
		let active = true;
		async function layout() {
			setLayoutError(false);
			try {
				const nodes = await layoutGraph(
					graphData.nodes,
					graphData.ownershipEdges,
					graphData.metadataEdges,
				);
				if (active) setReactFlowNodes(nodes);
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
	}, [graphData]);

	useEffect(() => {
		if (!flow || !reactFlowNodes.length) return;
		const frame = requestAnimationFrame(() => {
			void flow.fitView({ padding: 0.15, minZoom: 0.15, maxZoom: 1 });
		});
		return () => cancelAnimationFrame(frame);
	}, [flow, reactFlowNodes, view]);

	const holder = ownership.data?.holders.find(
		(item) => "sh-" + encodeURIComponent(item.name) === selectedNode,
	);
	const selected =
		graphData.nodes.find((node) => node.id === selectedNode) ||
		(holder
			? { id: selectedNode!, label: holder.name, type: "shareholder" as const }
			: undefined);
	const continuedName = params.get("via");
	const origin = params.get("from");
	const latest = composition.data?.latestSnapshot;
	const hasMetadata = !!(
		company.data?.affiliates?.length ||
		ownership.data?.conglomeratesGroup?.length
	);
	function closeTrace() {
		const next = new URLSearchParams(params);
		next.delete("shareholder");
		setParams(next, { replace: true });
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

			<div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
				<section
					aria-label="Ownership relationships"
					className="min-w-0 border border-[var(--color-border)] bg-white"
				>
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
						<h2 className="text-lg font-bold">Ownership</h2>
						<div className="flex flex-wrap gap-2">
							{(["graph", "list"] as const).map((value) => (
								<button
									key={value}
									aria-pressed={view === value}
									onClick={() => setView(value)}
									className={`min-h-11 border px-3 text-sm font-semibold ${view === value ? "border-[var(--color-primary)] bg-[var(--color-accent)]" : "border-[var(--color-border)] hover:bg-gray-50"}`}
								>
									{value === "graph" ? "Graph" : "Shareholder list"}
								</button>
							))}
							{view === "graph" && (
								<button
									disabled={!reactFlowNodes.length}
									onClick={() =>
										flow?.fitView({ padding: 0.15, minZoom: 0.15, maxZoom: 1 })
									}
									className="flex min-h-11 items-center gap-2 border border-[var(--color-border)] px-3 text-sm hover:bg-gray-50"
								>
									<Maximize2 size={14} />
									Fit graph
								</button>
							)}
						</div>
					</div>
					<div className="px-4">
						<PanelFeedback
							state={ownership}
							label="ownership"
							retry={() => retryPanel("ownership")}
						/>
					</div>
					{ownership.status === "success" &&
						!ownership.data?.holders.length && (
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
						<>
							{view === "graph" ? (
								<>
									<div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2 text-xs">
										<span>
											Showing holders {graphPage * 5 + 1}–
											{Math.min(
												graphPage * 5 + 5,
												ownership.data.holders.length,
											)}{" "}
											of {ownership.data.holders.length}
										</span>
										{ownership.data.holders.length > 5 && (
											<div className="flex gap-2">
												<button
													disabled={graphPage === 0}
													onClick={() => {
														setGraphPage((value) => value - 1);
														setSelectedNode(null);
													}}
													className="min-h-11 border px-3 hover:bg-gray-50"
												>
													Previous holders
												</button>
												<button
													disabled={
														(graphPage + 1) * 5 >= ownership.data.holders.length
													}
													onClick={() => {
														setGraphPage((value) => value + 1);
														setSelectedNode(null);
													}}
													className="min-h-11 border px-3 hover:bg-gray-50"
												>
													Next holders
												</button>
											</div>
										)}
									</div>
									<div className="flex flex-wrap justify-between gap-2 px-4 py-3 text-xs text-[var(--color-muted)]">
										<span>
											Shareholder → Company · Select a node or ownership line to
											inspect
										</span>
										{hasMetadata && (
											<label className="flex items-center gap-2">
												<input
													type="checkbox"
													checked={showMetadata}
													onChange={(event) => {
														setShowMetadata(event.target.checked);
														setSelectedNode(null);
													}}
												/>
												Show context metadata
											</label>
										)}
									</div>
									<div className="h-[480px] sm:h-[560px]">
										{layoutError ? (
											<div className="p-6">
												<p>
													Graph layout could not be loaded. Ownership records
													remain available.
												</p>
												<button
													className="mt-4 min-h-11 border px-4"
													onClick={() => setView("list")}
												>
													Open shareholder list
												</button>
											</div>
										) : !reactFlowNodes.length ? (
											<p role="status" className="p-6">
												Arranging ownership graph…
											</p>
										) : (
											<ReactFlow
												key={graphPage + "-" + showMetadata}
												nodes={reactFlowNodes.map((node) => ({
													...node,
													selected: node.id === selectedNode,
													ariaLabel:
														node.data.label + ", " + node.data.subLabel,
												}))}
												edges={toReactFlowEdges(
													graphData.ownershipEdges,
													graphData.metadataEdges,
													selectedNode,
												).map((edge) =>
													edge.id.startsWith("me-")
														? edge
														: { ...edge, type: "ownership" },
												)}
												edgeTypes={edgeTypes}
												onInit={setFlow}
												onNodeClick={(_, node) => inspect(node.id)}
												onEdgeClick={(_, edge) =>
													inspect(
														edge.id.startsWith("me-")
															? edge.target
															: edge.source,
													)
												}
												onPaneClick={() => setSelectedNode(null)}
												nodeTypes={nodeTypes}
												nodesConnectable={false}
												nodesDraggable={false}
												deleteKeyCode={null}
												minZoom={0.15}
												maxZoom={1.5}
												fitView
												fitViewOptions={{
													padding: 0.15,
													minZoom: 0.15,
													maxZoom: 1,
												}}
												onKeyDown={(event) => {
													if (event.key === "Enter" || event.key === " ") {
														const nodeElement = (
															event.target as HTMLElement
														).closest(".react-flow__node");
														const id = nodeElement?.getAttribute("data-id");
														if (id) {
															event.preventDefault();
															inspect(id);
														}
													}
												}}
												className="bg-[var(--color-surface)]"
											>
												<Background color="#d4d4d8" gap={24} size={1} />
												<FitWhenReady />
											</ReactFlow>
										)}
									</div>
									<p className="border-t border-[var(--color-border)] p-4 text-xs text-[var(--color-muted)]">
										Solid arrows: reported ownership. Dashed lines: metadata,
										not ownership. Scroll to zoom; drag the canvas to pan. Use
										the shareholder list for full names and keyboard inspection.
									</p>
								</>
							) : (
								<div className="divide-y divide-[var(--color-border)]">
									{ownership.data.holders.map((item) => (
										<button
											key={item.name}
											onClick={() =>
												inspect("sh-" + encodeURIComponent(item.name))
											}
											aria-pressed={holder?.name === item.name}
											className={`flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-gray-50 ${holder?.name === item.name ? "bg-[var(--color-accent)]/20" : ""}`}
										>
											<span className="min-w-0 break-words font-medium">
												{item.name}
												<span className="mt-1 block text-xs text-[var(--color-muted)]">
													{isNonTraceableShareholder(item.name)
														? "Aggregate holding · Not traceable"
														: "Inspect shareholder"}
												</span>
											</span>
											<span className="shrink-0 text-sm font-semibold tabular-nums">
												{percentage(item.sharePercentage)}
											</span>
										</button>
									))}
								</div>
							)}
						</>
					)}
				</section>

				<aside
					aria-label="Entity inspector"
					className="min-w-0 self-start border border-[var(--color-border)] bg-white p-5"
				>
					<div className="mb-4 flex items-center justify-between gap-3">
						<h2 className="text-lg font-bold">Inspector</h2>
						{selected && (
							<button
								aria-label="Close inspector"
								onClick={() => setSelectedNode(null)}
								className="flex h-11 w-11 items-center justify-center hover:bg-gray-100"
							>
								<X size={18} />
							</button>
						)}
					</div>
					{!selected ? (
						<>
							<p className="text-sm text-[var(--color-muted)]">
								Select a shareholder or ownership line to inspect the reported
								holding.
							</p>
							<p className="mt-4 text-sm">
								Then use <strong>Trace shareholder</strong> to look for the same
								name in other company reports.
							</p>
						</>
					) : (
						<>
							<p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
								{selected.type === "affiliate"
									? "Affiliate metadata"
									: selected.type === "conglomerate"
										? "Conglomerate metadata"
										: selected.type}
							</p>
							<h3 className="mt-2 break-words text-lg font-bold">
								{holder?.name ||
									(selected.type === "company"
										? company.data?.name || selected.label
										: selected.label)}
							</h3>
							{holder ? (
								<>
									<dl className="mt-5 space-y-4 text-sm">
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
									</dl>
									<p className="mt-5 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted)]">
										Reported by Sectors
										<br />
										Ownership date unavailable
									</p>
									{!isNonTraceableShareholder(holder.name) ? (
										<button
											onClick={() => startTrace(holder.name)}
											className="mt-5 min-h-11 w-full bg-[var(--color-accent)] px-4 font-bold hover:brightness-95"
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
							) : (
								<p className="mt-4 text-sm text-[var(--color-muted)]">
									{selected.type === "company"
										? "This is the company under investigation. Incoming arrows show reported holdings in this company."
										: "Reported by Sectors as context metadata. This is not evidence of an ownership relationship."}
								</p>
							)}
						</>
					)}
				</aside>
			</div>

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

function Detail({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
			<dt className="text-[var(--color-muted)]">{label}</dt>
			<dd className="font-semibold tabular-nums">{value}</dd>
		</div>
	);
}

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
	if (!events.length)
		return (
			<p className="mt-4 text-sm">
				No corporate actions available from Sectors.
			</p>
		);
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
