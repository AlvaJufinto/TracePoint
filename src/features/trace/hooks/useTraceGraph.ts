/** @format */

import { useEffect, useMemo, useState } from "react";
import type { ReactFlowInstance } from "reactflow";

import type { EntityNode } from "../../../interfaces/trace";
import type {
	TracePointCompany,
	TracePointOwnershipSnapshot,
} from "../../../types/tracepoint";
import { buildGraphData, layoutGraph } from "../../../utils/trace/graph";

export function useTraceGraph(
	ticker: string,
	company: TracePointCompany | null,
	ownership: TracePointOwnershipSnapshot | null,
) {
	const [reactFlowNodes, setReactFlowNodes] = useState<EntityNode[]>([]);
	const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
	const [layoutError, setLayoutError] = useState(false);
	const graphData = useMemo(
		() =>
			buildGraphData(
				company || (ownership ? { ticker, name: ownership.companyName } : null),
				ownership,
			),
		[ticker, company, ownership],
	);

	useEffect(() => {
		let active = true;
		void layoutGraph(
			graphData.nodes,
			graphData.ownershipEdges,
			graphData.metadataEdges,
			ownership,
		)
			.then((nodes) => {
				if (active) {
					setLayoutError(false);
					setReactFlowNodes(nodes);
				}
			})
			.catch(() => {
				if (active) {
					setReactFlowNodes([]);
					setLayoutError(true);
				}
			});

		return () => {
			active = false;
		};
	}, [graphData, ownership]);

	useEffect(() => {
		if (!flow || !reactFlowNodes.length) return;
		const frame = requestAnimationFrame(() => {
			void flow.fitView({ padding: 0.12, minZoom: 0.1, maxZoom: 1 });
		});
		return () => cancelAnimationFrame(frame);
	}, [flow, reactFlowNodes]);

	return { graphData, reactFlowNodes, layoutError, setFlow };
}
