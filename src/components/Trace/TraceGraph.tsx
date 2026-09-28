/** @format */

import { X } from "lucide-react";
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
import Skeleton from "../Skeleton";
import Detail from "./Detail";
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
}: Props) {
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

							<div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 border border-[var(--color-border)] bg-white/95 px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:gap-4">
								<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
									Legend
								</span>

								<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
									<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-primary)] bg-[var(--color-accent)]" />
									Major
								</div>

								<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
									<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)]" />
									Corporate
								</div>

								<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
									<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border)] bg-white" />
									Minority
								</div>

								<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
									<span className="h-2.5 w-2.5 rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]" />
									Aggregate
								</div>

								<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
									<span className="w-5 border-t border-dashed border-[var(--color-border-strong)]" />
									Context
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
