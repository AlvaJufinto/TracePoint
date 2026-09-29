/** @format */

import { useEffect } from "react";

import { useNodesInitialized, useReactFlow } from "reactflow";

export default function FitWhenReady({ changeKey }: { changeKey: string }) {
	const ready = useNodesInitialized();
	const { fitView } = useReactFlow();

	useEffect(() => {
		if (!ready) return;
		let secondFrame: number | undefined;
		const firstFrame = requestAnimationFrame(() => {
			secondFrame = requestAnimationFrame(() => {
				void fitView({ padding: 0.14, minZoom: 0.1, maxZoom: 1, duration: 280 });
			});
		});
		return () => {
			cancelAnimationFrame(firstFrame);
			if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
		};
	}, [ready, fitView, changeKey]);

	return null;
}
