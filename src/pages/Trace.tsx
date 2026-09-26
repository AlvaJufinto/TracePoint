/** @format */

import "reactflow/dist/style.css";

import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";
import type { ReactFlowInstance } from "reactflow";

import TraceCompanyContext from "../components/Trace/TraceCompanyContext";
import TraceGraph from "../components/Trace/TraceGraph";
import TraceHeader from "../components/Trace/TraceHeader";
import TraceResultsDrawer from "../components/TraceResultsDrawer";
import type { EntityNode } from "../interfaces/trace";
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
	PanelState,
	TraceCandidate,
	TracePointCompany,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
	TracePointOwnershipSnapshot,
} from "../types/tracepoint";
import {
	buildGraphData,
	buildShareholderSubLabel,
	isNonTraceableShareholder,
	layoutGraph,
	toReactFlowEdges,
} from "../utils/trace/graph";

function createPanelState<T>(): PanelState<T> {
	return {
		status: "loading",
		data: null,
		error: null,
	};
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

	return (
		<div className="min-w-0">
			<TraceHeader
				ticker={ticker}
				company={company}
				ownership={ownership}
				continuedName={continuedName}
				origin={origin}
				searchLink={searchLink}
				retryCompany={() => retryPanel("company")}
			/>

			<TraceGraph
				ticker={ticker}
				company={company}
				ownership={ownership}
				graphData={graphData}
				reactFlowNodes={reactFlowNodes}
				selectedNode={selectedNode}
				selected={selected}
				holder={holder}
				layoutError={layoutError}
				searchLink={searchLink}
				retryOwnership={() => retryPanel("ownership")}
				setFlow={setFlow}
				inspect={inspect}
				clearSelection={() => setSelectedNode(null)}
				startTrace={startTrace}
				closeInspector={() => setSelectedNode(null)}
				buildEdges={toReactFlowEdges}
				buildShareholderSubLabel={buildShareholderSubLabel}
				isNonTraceableShareholder={isNonTraceableShareholder}
			/>

			<TraceCompanyContext
				freeFloat={freeFloat}
				management={management}
				composition={composition}
				corporateActions={corporateActions}
				retry={retryPanel}
			/>

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
