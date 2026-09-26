/** @format */

import { useEffect } from "react";

import { useNodesInitialized, useReactFlow } from "reactflow";

export default function FitWhenReady() {
	const ready = useNodesInitialized();
	const { fitView } = useReactFlow();

	useEffect(() => {
		if (ready) void fitView({ padding: 0.12, minZoom: 0.1, maxZoom: 1 });
	}, [ready, fitView]);

	return null;
}
