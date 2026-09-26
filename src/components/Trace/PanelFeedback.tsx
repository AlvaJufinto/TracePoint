/** @format */

import Skeleton from "../Skeleton";
import type { PanelState } from "../../types/tracepoint";

type SkeletonVariant = "text" | "value" | "list" | "chart" | "actions";

export default function PanelFeedback({
	state,
	label,
	retry,
	variant = "text",
}: {
	state: PanelState<unknown>;
	label: string;
	retry: () => void;
	variant?: SkeletonVariant;
}) {
	if (state.status === "loading") {
		return (
			<div role="status" className="py-4">
				{variant === "text" && (
					<div className="space-y-2">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-3 w-32" />
					</div>
				)}
				{variant === "value" && (
					<div className="space-y-2">
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-3 w-40" />
					</div>
				)}
				{variant === "list" && (
					<div className="space-y-3">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-5/6" />
						<Skeleton className="h-4 w-4/6" />
					</div>
				)}
				{variant === "chart" && (
					<div className="space-y-3">
						<div className="flex gap-4">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="h-8 w-16" />
						</div>
						<Skeleton className="h-10 w-full" />
						<div className="flex gap-3">
							<Skeleton className="h-[180px] w-[180px] rounded-full" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-4 w-4/6" />
								<Skeleton className="h-4 w-3/6" />
							</div>
						</div>
					</div>
				)}
				{variant === "actions" && (
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-5/6" />
					</div>
				)}
				<span className="sr-only">Loading {label}…</span>
			</div>
		);
	}
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
