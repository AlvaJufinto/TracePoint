/** @format */

import { Building2, X } from "lucide-react";
import { Link } from "react-router-dom";
import ReactFlow, {
	BaseEdge,
	type Edge,
	type EdgeProps,
	Handle,
	Position,
	type ReactFlowInstance,
} from "reactflow";

import type { EntityNode, EntityNodeData } from "../../interfaces/trace";
import type {
	GraphData,
	GraphNode,
	OwnershipEdge,
	PanelState,
	TracePointCompany,
	TracePointOwnershipSnapshot,
	TracePointShareholder,
} from "../../types/tracepoint";
import { percentage } from "../../utils/trace/format";
import Detail from "./Detail";
import FitWhenReady from "./FitWhenReady";
import PanelFeedback from "./PanelFeedback";

const MIN_BUBBLE_SIZE = 76;

function CustomEntityNode({
	data,
	selected,
}: {
	data: EntityNodeData;
	selected?: boolean;
}) {
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
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={id}
						id={id}
						type="source"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!opacity-0 !pointer-events-none"
					/>
				))}
				<div className="pointer-events-none flex max-w-[88%] flex-col items-center justify-center overflow-hidden">
					<div className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
						<span className={`h-1.5 w-1.5 shrink-0 ${indicatorClasses}`} />
						{(isLarge || isMedium) && <span>{categoryLabel}</span>}
					</div>
					<div
						title={data.label}
						className={`break-words font-semibold leading-tight text-[var(--color-primary)] ${isLarge ? "line-clamp-3 text-xs" : isMedium ? "line-clamp-2 text-[11px]" : "line-clamp-2 text-[10px]"}`}
					>
						{data.label}
					</div>
					<div
						className={`mt-1 tabular-nums tracking-tight font-bold text-[var(--color-primary)] ${isLarge ? "text-sm" : isMedium ? "text-xs" : "text-[10px]"}`}
					>
						{data.sharePercentage != null
							? `${(data.sharePercentage * 100).toFixed(2)}%`
							: "N/A"}
					</div>
				</div>
			</div>
		);
	}

	if (isCompany)
		return (
			<div
				className={`relative flex h-[92px] w-[240px] flex-col justify-center rounded-[var(--radius-sm)] border px-4 py-3 transition-colors select-none ${selected ? "border-2 border-[var(--color-primary)] bg-[var(--color-accent)]/15" : "border-[var(--color-border-strong)] bg-white hover:border-[var(--color-primary)]"}`}
			>
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={id}
						id={id}
						type="target"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[var(--color-primary)]"
					/>
				))}
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={`meta-${id}`}
						id={`meta-${id}`}
						type="source"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!pointer-events-none !opacity-0"
					/>
				))}
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

	const isAffiliate = data.nodeType === "affiliate";
	return (
		<div
			className={`relative flex min-h-[62px] w-[196px] flex-col justify-center rounded-[var(--radius-sm)] border border-dashed px-3 py-2 transition-colors select-none ${selected ? "border-2 border-[var(--color-primary)] bg-[var(--color-accent)]/10" : "border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"}`}
		>
			{["top", "right", "bottom", "left"].map((id) => (
				<Handle
					key={id}
					id={id}
					type="target"
					position={
						id === "top"
							? Position.Top
							: id === "right"
								? Position.Right
								: id === "bottom"
									? Position.Bottom
									: Position.Left
					}
					className="!h-2 !w-2 !opacity-0"
				/>
			))}
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
}

function OwnershipLine(props: EdgeProps) {
	const dx = props.sourceX - props.targetX;
	const dy = props.sourceY - props.targetY;
	const distance = Math.sqrt(dx * dx + dy * dy) || 1;
	const curve = typeof props.data?.curve === "number" ? props.data.curve : 78;
	const outwardX = (dx / distance) * curve;
	const outwardY = (dy / distance) * curve;
	const control1X = props.sourceX + outwardX;
	const control1Y = props.sourceY + outwardY;
	const control2X = props.targetX + outwardX * 0.62;
	const control2Y = props.targetY + outwardY * 0.62;
	const path = `M ${props.sourceX},${props.sourceY} C ${control1X},${control1Y} ${control2X},${control2Y} ${props.targetX},${props.targetY}`;
	const labelX =
		(props.sourceX + 3 * control1X + 3 * control2X + props.targetX) / 8;
	const labelY =
		(props.sourceY + 3 * control1Y + 3 * control2Y + props.targetY) / 8;

	return (
		<BaseEdge
			path={path}
			markerEnd={props.markerEnd}
			style={props.style}
			label={props.label}
			labelX={labelX}
			labelY={labelY}
			labelStyle={{ fill: "#18181B", fontSize: 9, fontWeight: 700 }}
			labelBgStyle={{ fill: "#FFFFFF", stroke: "#D4D4D8", strokeWidth: 1 }}
			labelBgPadding={[5, 2]}
			labelBgBorderRadius={2}
		/>
	);
}

const nodeTypes = { customEntity: CustomEntityNode };
const edgeTypes = { ownership: OwnershipLine };

type Props = {
	ticker: string;
	company: PanelState<TracePointCompany>;
	ownership: PanelState<TracePointOwnershipSnapshot>;
	graphData: GraphData;
	reactFlowNodes: EntityNode[];
	selectedNode: string | null;
	selected?: Pick<GraphNode, "id" | "label" | "type">;
	holder?: TracePointShareholder;
	layoutError: boolean;
	searchLink: string;
	retryOwnership: () => void;
	setFlow: (instance: ReactFlowInstance) => void;
	inspect: (id: string) => void;
	clearSelection: () => void;
	startTrace: (name: string) => void;
	closeInspector: () => void;
	buildEdges: (
		ownershipEdges: OwnershipEdge[],
		metadataEdges: GraphData["metadataEdges"],
		selectedNode: string | null,
		nodes: EntityNode[],
	) => Edge[];
	buildShareholderSubLabel: (holder: TracePointShareholder) => string;
	isNonTraceableShareholder: (name: string) => boolean;
};

export default function TraceGraph({
	ticker,
	company,
	ownership,
	graphData,
	reactFlowNodes,
	selectedNode,
	selected,
	holder,
	layoutError,
	searchLink,
	retryOwnership,
	setFlow,
	inspect,
	clearSelection,
	startTrace,
	closeInspector,
	buildEdges,
	buildShareholderSubLabel,
	isNonTraceableShareholder,
}: Props) {
	return (
		<section
			aria-label="Ownership relationships"
			className="min-w-0 border   border-[var(--color-border)] bg-white"
		>
			<div className="px-4">
				<PanelFeedback
					state={ownership}
					label="ownership"
					retry={retryOwnership}
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
				<div className="relative h-[80vh] overflow-hidden">
					{layoutError ? (
						<div className="flex h-full items-center justify-center p-6">
							<div className="text-center">
								<p>
									Graph layout could not be loaded. Ownership records remain
									available.
								</p>
								<button
									className="mt-4 min-h-11 border px-4"
									onClick={retryOwnership}
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
							edges={buildEdges(
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
							onPaneClick={clearSelection}
							nodeTypes={nodeTypes}
							nodesConnectable={false}
							nodesDraggable={false}
							deleteKeyCode={null}
							minZoom={0.1}
							maxZoom={1.5}
							fitView
							fitViewOptions={{ padding: 0.12, minZoom: 0.1, maxZoom: 1 }}
							className="bg-[var(--color-surface)]"
						>
							<FitWhenReady />
						</ReactFlow>
					)}

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
									onClick={closeInspector}
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
	);
}
