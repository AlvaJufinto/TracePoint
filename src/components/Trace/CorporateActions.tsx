/** @format */

import type { TracePointCorporateActions } from "../../types/tracepoint";
import { formatShares } from "../../utils/trace/format";

export default function CorporateActions({
	actions,
}: {
	actions: TracePointCorporateActions;
}) {
	const events = [
		...(actions.dividends || []).map((item) => ({
			date: item.exDate,
			label: "Dividend",
			description:
				"IDR " +
				formatShares(item.dividendAmount) +
				" per share · Payment: " +
				(item.paymentDate || "Not available"),
		})),
		...(actions.stockSplits || []).map((item) => ({
			date: item.date,
			label: "Stock split",
			description:
				item.splitRatio == null
					? "Ratio not available"
					: "Ratio 1:" + item.splitRatio,
		})),
		...(actions.agm || []).map((item) => ({
			date: item.date,
			label: "General meeting",
			description: item.place || "Location not available",
		})),
	].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

	if (!events.length)
		return (
			<p className="mt-4 text-sm">
				No corporate actions available from Sectors.
			</p>
		);
	return (
		<ul className="mt-4 divide-y divide-[var(--color-border)]">
			{events.map((event, index) => (
				<li
					className="grid gap-1 py-3 text-sm sm:grid-cols-[120px_140px_1fr]"
					key={event.label + event.date + index}
				>
					<span className="text-[var(--color-muted)]">
						{event.date || "Not available"}
					</span>
					<strong>{event.label}</strong>
					<span className="break-words">{event.description}</span>
				</li>
			))}
		</ul>
	);
}
