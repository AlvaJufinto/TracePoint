/** @format */

import type { PanelState } from "../../types/tracepoint";

export default function PanelFeedback({
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
