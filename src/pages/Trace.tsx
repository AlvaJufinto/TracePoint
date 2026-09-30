/** @format */

import "reactflow/dist/style.css";

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import TraceCompanyContext from "../components/Trace/TraceCompanyContext";
import TraceGraph from "../components/Trace/TraceGraph";
import TraceHeader from "../components/Trace/TraceHeader";
import { useTraceData } from "../features/trace/hooks/useTraceData";
import { useTraceGraph } from "../features/trace/hooks/useTraceGraph";
import {
	buildShareholderConnections,
	type ShareholderTraceRecord,
	upsertShareholderTrace,
} from "../utils/trace/shareholder-network";

function normalizeTicker(value: string | null) {
	return (value || "BBCA").trim().toUpperCase().replace(/\.JK$/, "") + ".JK";
}

export default function Trace() {
	const [params] = useSearchParams();
	const ticker = normalizeTicker(params.get("ticker"));
	return <Investigation key={ticker} ticker={ticker} />;
}

function Investigation({ ticker }: { ticker: string }) {
	const [params, setParams] = useSearchParams();
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const shareholder = params.get("shareholder");
	const returnTo = params.get("returnTo");
	const searchLink = returnTo?.startsWith("/search?") ? returnTo : "/search";

	const {
		panels,
		retryPanel,
		completedTraces,
		traceLoading,
		traceError,
		refreshTrace,
		verifyNext,
		clearCompletedTrace,
		pendingCount,
	} = useTraceData(ticker, shareholder);
	const { company, ownership, management, composition, corporateActions } = panels;
	const { graphData, reactFlowNodes, layoutError, setFlow } = useTraceGraph(
		ticker,
		company.data,
		ownership.data,
	);

	const holder = ownership.data?.holders.find(
		(item) => "sh-" + encodeURIComponent(item.name) === selectedNode,
	);
	const shareholderTraces = useMemo(
		() =>
			completedTraces.reduce<ShareholderTraceRecord[]>((traces, trace) => {
				const tracedHolder = ownership.data?.holders.find(
					(item) => item.name === trace.shareholderName,
				);
				return upsertShareholderTrace(traces, {
					shareholderName: trace.shareholderName,
					connections: buildShareholderConnections(
						tracedHolder
							? {
									ticker,
									companyName:
										company.data?.name ||
										ownership.data?.companyName ||
										ticker,
									sharePercentage: tracedHolder.sharePercentage,
									shareAmount: tracedHolder.shareAmount,
								}
							: null,
						trace.candidates,
					),
				});
			}, []),
		[ticker, company.data, ownership.data, completedTraces],
	);
	const selected =
		graphData.nodes.find((node) => node.id === selectedNode) ||
		(holder
			? { id: selectedNode!, label: holder.name, type: "shareholder" as const }
			: undefined);

	function updateTraceName(name: string | null) {
		const next = new URLSearchParams(params);
		if (name) next.set("shareholder", name);
		else next.delete("shareholder");
		setParams(next, { replace: !name });
	}

	function openConnectedCompany(nextTicker: string) {
		setParams(
			new URLSearchParams({
				ticker: nextTicker,
				...(shareholder ? { via: shareholder, from: ticker } : {}),
				returnTo: searchLink,
			}),
		);
	}

	return (
		<div className="min-w-0">
			<TraceHeader
				ticker={ticker}
				company={company}
				ownership={ownership}
				continuedName={params.get("via")}
				origin={params.get("from")}
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
				inspect={setSelectedNode}
				clearSelection={() => setSelectedNode(null)}
				closeInspector={() => setSelectedNode(null)}
				tracedShareholder={shareholder}
				shareholderTraces={shareholderTraces}
				traceLoading={traceLoading}
				traceError={traceError}
				onRetryTrace={refreshTrace}
				onVerifyNext={pendingCount ? verifyNext : undefined}
				onClearTrace={() => {
					if (shareholder) clearCompletedTrace(shareholder);
					updateTraceName(null);
				}}
				onOpenConnectedCompany={openConnectedCompany}
			/>

			<TraceCompanyContext
				management={management}
				composition={composition}
				corporateActions={corporateActions}
				retry={retryPanel}
			/>

		</div>
	);
}
