/** @format */

import { useMemo } from "react";

import { Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import ReactFlow, {
	Background,
	BackgroundVariant,
	type ReactFlowInstance,
} from "reactflow";

import type { EntityNode } from "../../interfaces/trace";
import type {
	GraphData,
	GraphNode,
	PanelState,
	TracePointCompany,
	TracePointOwnershipSnapshot,
	TracePointShareholder,
} from "../../types/tracepoint";
import { percentage } from "../../utils/trace/format";
import {
	buildShareholderSubLabel,
	isNonTraceableShareholder,
	toReactFlowEdges,
} from "../../utils/trace/graph";
import {
	buildShareholderTraceGraph,
	mergeShareholderTraceGraphs,
	shouldShowTraceShareholderAction,
	type ShareholderTraceRecord,
} from "../../utils/trace/shareholder-network";
import Skeleton from "../Skeleton";
import Detail from "./Detail";
import FitWhenReady from "./FitWhenReady";
import PanelFeedback from "./PanelFeedback";
import { CustomEntityNode, OwnershipLine } from "./TraceGraphPrimitives";

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
	tracedShareholder: string | null;
	shareholderTraces: ShareholderTraceRecord[];
	traceLoading: boolean;
	traceError: boolean;
	onRetryTrace: () => void;
	onVerifyNext?: () => void;
	onClearTrace: () => void;
	onOpenConnectedCompany: (ticker: string) => void;
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
	tracedShareholder,
	shareholderTraces,
	traceLoading,
	traceError,
	onRetryTrace,
	onVerifyNext,
	onClearTrace,
	onOpenConnectedCompany,
}: Props) {
	const { expansion, activeTraceCount } = useMemo(() => {
		const companyNode = reactFlowNodes.find((node) => node.id === ticker);
		if (!companyNode) {
			return { expansion: { nodes: [], edges: [] }, activeTraceCount: 0 };
		}

		const traceGraphs = shareholderTraces.map((trace) => {
			const shareholderId = `sh-${encodeURIComponent(trace.shareholderName)}`;
			const shareholderNode = reactFlowNodes.find(
				(node) => node.id === shareholderId,
			);
			if (!shareholderNode) return { nodes: [], edges: [] };

			return buildShareholderTraceGraph({
				shareholderId,
				shareholderName: trace.shareholderName,
				currentTicker: ticker,
				shareholderNode,
				companyNode,
				connections: trace.connections,
			});
		});
		const activeIndex = shareholderTraces.findIndex(
			(trace) => trace.shareholderName === tracedShareholder,
		);

		return {
			expansion: mergeShareholderTraceGraphs(traceGraphs),
			activeTraceCount:
				activeIndex === -1 ? 0 : traceGraphs[activeIndex].nodes.length,
		};
	}, [tracedShareholder, ticker, reactFlowNodes, shareholderTraces]);
	const visibleNodes = [...reactFlowNodes, ...expansion.nodes];
	const visibleEdges = [
		...toReactFlowEdges(
			graphData.ownershipEdges,
			graphData.metadataEdges,
			selectedNode,
			reactFlowNodes,
		),
		...expansion.edges,
	];
	const shareholderCategories = new Set(
		reactFlowNodes
			.filter((node) => node.data.nodeType === "shareholder")
			.map((node) => node.data.shareCategory)
			.filter(Boolean),
	);
	const traceCount = expansion.edges.length;
	const selectedHolderTrace = holder
		? shareholderTraces.find((trace) => trace.shareholderName === holder.name)
		: undefined;
	const selectedHolderTraceCount = selectedHolderTrace
		? selectedHolderTrace.connections.filter(
				(connection) => connection.ticker !== ticker,
			).length
		: activeTraceCount;

	return (
		<section
			aria-label="Ownership relationships"
			className="min-w-0 border border-[var(--color-border)] bg-white"
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
						<div className="flex h-full items-center justify-center p-6">
							<div className="w-full max-w-lg space-y-4">
								<div className="flex items-center justify-center gap-4">
									<Skeleton className="h-20 w-20 rounded-full" />

									<div className="h-px w-12 bg-[var(--color-border)]" />

									<Skeleton className="h-16 w-16 rounded-full" />

									<div className="h-px w-12 bg-[var(--color-border)]" />

									<Skeleton className="h-14 w-14 rounded-full" />
								</div>

								<div className="flex items-center justify-center gap-2">
									<Skeleton className="h-10 w-10 rounded-full" />

									<div className="h-px w-8 bg-[var(--color-border)]" />

									<Skeleton className="h-12 w-12 rounded-full" />
								</div>

								<p
									role="status"
									className="text-center text-sm text-[var(--color-muted)]"
								>
									Arranging ownership graph…
								</p>
							</div>
						</div>
					) : (
						<ReactFlow
							nodes={visibleNodes.map((node) => ({
								...node,
								selected: node.id === selectedNode,
								ariaLabel: node.data.label + ", " + node.data.subLabel,
							}))}
							edges={visibleEdges}
							edgeTypes={edgeTypes}
							onInit={setFlow}
							onNodeClick={(_, node) => {
								if (node.data.companyRole === "connected" && node.data.ticker) {
									onOpenConnectedCompany(node.data.ticker);
									return;
								}
								inspect(node.id);
							}}
							onEdgeClick={(_, edge) =>
								inspect(edge.id.startsWith("me-") ? edge.target : edge.source)
							}
							onPaneClick={clearSelection}
							nodeTypes={nodeTypes}
							nodesConnectable={false}
							panOnDrag={[0]}
							selectionOnDrag={false}
							nodesDraggable
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
							<Background
								variant={BackgroundVariant.Lines}
								gap={60}
								size={2}
								color="#9C9C9C17"
							/>
							<FitWhenReady
								changeKey={`${shareholderTraces.map((trace) => trace.shareholderName).join("|") || "base"}-${traceCount}`}
							/>

							{tracedShareholder && (
								<div className="absolute left-4 top-4 z-10 w-[min(340px,calc(100%-2rem))] border border-[var(--color-border)] bg-white/95 p-3 shadow-sm backdrop-blur-sm">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
												Shareholder trace
											</p>
											<p className="mt-1 truncate text-xs font-bold" title={tracedShareholder}>
												{tracedShareholder}
											</p>
										</div>
										<button
											onClick={onClearTrace}
											aria-label="Clear shareholder trace"
											className="flex h-8 w-8 shrink-0 items-center justify-center hover:bg-[var(--color-surface)]"
										>
											<X size={15} />
										</button>
									</div>
									{traceLoading ? (
										<p role="status" className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
											<Loader2 size={14} className="animate-spin" />
											Finding and confirming connected companies…
										</p>
									) : traceError ? (
										<div className="mt-2 flex items-center justify-between gap-3 text-xs">
											<span>Trace could not be completed.</span>
											<button onClick={onRetryTrace} className="font-bold underline">
												Retry
											</button>
										</div>
									) : (
										<div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
											<span>
												{activeTraceCount > 0
													? `${activeTraceCount} other confirmed ${activeTraceCount === 1 ? "company" : "companies"} added`
													: "No other confirmed companies found"}
											</span>
											{onVerifyNext && (
												<button onClick={onVerifyNext} className="shrink-0 font-bold text-[var(--color-primary)] underline">
													Check more
												</button>
											)}
										</div>
									)}
								</div>
							)}

							<div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden max-w-[calc(100%-2rem)] flex-col items-start gap-2.5 border border-[var(--color-border)] bg-white/95 px-3 py-2.5 shadow-sm sm:flex">
								<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Legend</span>
								<div>
									<p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Shareholder classification</p>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
										{shareholderCategories.has("major") && <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full border border-[var(--color-primary)] bg-[var(--color-accent)]" />Major shareholder</div>}
										{shareholderCategories.has("corporate") && <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-surface)]" />Corporate shareholder</div>}
										{shareholderCategories.has("minority") && <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border)] bg-white" />Minority shareholder</div>}
										{shareholderCategories.has("aggregate") && <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]" />Aggregate holding</div>}
									</div>
								</div>
								<div className="border-t border-[var(--color-border)] pt-2">
									<p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Connection type</p>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
										<div className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 border-t border-[var(--color-border-strong)]" />Direct ownership</div>
										{traceCount > 0 && <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 border-t-2 border-[var(--color-primary)]" />Traced ownership</div>}
										{graphData.metadataEdges.length > 0 && <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-5 border-t border-dashed border-[var(--color-border-strong)]" />Context / affiliation</div>}
									</div>
								</div>
							</div>
						</ReactFlow>
					)}

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

										{!isNonTraceableShareholder(holder.name) &&
										shouldShowTraceShareholderAction({
											holderName: holder.name,
											tracedShareholder: selectedHolderTrace
												? holder.name
												: tracedShareholder,
											traceLoading:
												tracedShareholder === holder.name && traceLoading,
											traceError:
												tracedShareholder === holder.name && traceError,
											connectedCompanyCount: selectedHolderTraceCount,
										}) ? (
											<button
												onClick={() => startTrace(holder.name)}
												className="mt-4 min-h-11 w-full bg-[var(--color-accent)] px-4 font-bold hover:brightness-95"
											>
												Trace shareholder
											</button>
										) : isNonTraceableShareholder(holder.name) ? (
											<p className="mt-4 text-sm">
												This aggregate entry does not identify a single
												shareholder and cannot be traced.
											</p>
										) : null}

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
													}).toString()
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
