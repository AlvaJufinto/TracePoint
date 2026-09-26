/** @format */

import "reactflow/dist/style.css";

import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import TraceCompanyContext from "../components/Trace/TraceCompanyContext";
import TraceGraph from "../components/Trace/TraceGraph";
import TraceHeader from "../components/Trace/TraceHeader";
import TraceResultsDrawer from "../components/TraceResultsDrawer";
import { useTraceData } from "../features/trace/hooks/useTraceData";
import { useTraceGraph } from "../features/trace/hooks/useTraceGraph";

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
		traceCandidates,
		traceLoading,
		traceError,
		traceMore,
		refreshTrace,
		verifyNext,
		pendingCount,
	} = useTraceData(ticker, shareholder);
	const { company, ownership, management, freeFloat, composition, corporateActions } = panels;
	const { graphData, reactFlowNodes, layoutError, setFlow } = useTraceGraph(
		ticker,
		company.data,
		ownership.data,
	);

	const holder = ownership.data?.holders.find(
		(item) => "sh-" + encodeURIComponent(item.name) === selectedNode,
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
				startTrace={updateTraceName}
				closeInspector={() => setSelectedNode(null)}
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
					onClose={() => updateTraceName(null)}
					onRetry={refreshTrace}
					onVerifyNext={pendingCount ? verifyNext : undefined}
				/>
			)}
		</div>
	);
}
