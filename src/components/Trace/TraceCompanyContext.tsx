/** @format */

import type {
	PanelState,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
} from "../../types/tracepoint";
import { percentage } from "../../utils/trace/format";
import CorporateActions from "./CorporateActions";
import Detail from "./Detail";
import PanelFeedback from "./PanelFeedback";

type Props = {
	freeFloat: PanelState<TracePointFreeFloat>;
	management: PanelState<TracePointManagement>;
	composition: PanelState<TracePointComposition>;
	corporateActions: PanelState<TracePointCorporateActions>;
	retry: (name: string) => void;
};

export default function TraceCompanyContext({
	freeFloat,
	management,
	composition,
	corporateActions,
	retry,
}: Props) {
	const latest = composition.data?.latestSnapshot;

	return (
		<section
			className="mt-8 border-t border-[var(--color-border)] pt-6"
			aria-label="Supporting company context"
		>
			<h2 className="text-xl font-bold">Company context</h2>
			<p className="mt-2 text-sm text-[var(--color-muted)]">
				Supporting information reported by Sectors. Composition dates are
				separate from ownership dates.
			</p>

			<div className="mt-5 grid gap-6 lg:grid-cols-2">
				<div className="min-w-0 border border-[var(--color-border)] bg-white p-5">
					<h3 className="text-base font-bold">Free float</h3>
					<PanelFeedback
						state={freeFloat}
						label="free float"
						retry={() => retry("freeFloat")}
					/>
					{freeFloat.status === "success" && (
						<>
							<p className="mt-3 text-2xl font-bold">
								{percentage(freeFloat.data?.freeFloat)}
							</p>
							<p className="mt-2 text-xs text-[var(--color-muted)]">
								Reported by Sectors; not calculated from shareholder holdings.
							</p>
						</>
					)}

					<details className="mt-6 border-t border-[var(--color-border)] pt-4">
						<summary className="cursor-pointer font-semibold">
							Management
						</summary>
						<PanelFeedback
							state={management}
							label="management"
							retry={() => retry("management")}
						/>
						{management.data?.keyExecutives.length ? (
							<ul className="mt-3 space-y-3">
								{management.data.keyExecutives.map((person, index) => (
									<li key={person.name + index} className="text-sm">
										{person.name}
										<span className="block text-xs text-[var(--color-muted)]">
											{person.position}
										</span>
									</li>
								))}
							</ul>
						) : (
							management.status === "success" && (
								<p className="mt-3 text-sm">No management records available.</p>
							)
						)}
					</details>
				</div>

				<div className="min-w-0 border border-[var(--color-border)] bg-white p-5">
					<h3 className="text-base font-bold">Shareholder composition</h3>
					<PanelFeedback
						state={composition}
						label="composition"
						retry={() => retry("composition")}
					/>
					{composition.status === "success" && !latest && (
						<p className="mt-3 text-sm">
							No composition snapshot available from Sectors.
						</p>
					)}
					{latest && (
						<>
							<p className="mt-2 text-xs text-[var(--color-muted)]">
								Composition snapshot · {latest.date}
							</p>
							<dl className="mt-4 space-y-3 text-sm">
								<Detail
									label="Total shareholders"
									value={
										latest.numberOfShareholders?.toLocaleString() ??
										"Not available"
									}
								/>
								<Detail
									label="Change from prior month"
									value={
										latest.changeInShareholders == null
											? "Not available"
											: (latest.changeInShareholders > 0 ? "+" : "") +
												latest.changeInShareholders.toLocaleString()
									}
								/>
								<Detail
									label="Local / total shares"
									value={percentage(
										latest.local.total != null &&
											latest.sharesNumber != null &&
											latest.sharesNumber > 0
											? latest.local.total / latest.sharesNumber
											: null,
									)}
								/>
								<Detail
									label="Foreign / total shares"
									value={percentage(
										latest.foreign.total != null &&
											latest.sharesNumber != null &&
											latest.sharesNumber > 0
											? latest.foreign.total / latest.sharesNumber
											: null,
									)}
								/>
							</dl>
							<details className="mt-4 border-t border-[var(--color-border)] pt-4">
								<summary className="cursor-pointer text-sm font-semibold">
									Investor categories · shares
								</summary>
								<div className="mt-3 overflow-x-auto">
									<table className="w-full text-left text-xs">
										<thead>
											<tr>
												<th className="py-2">Category</th>
												<th className="px-2 text-right">Local</th>
												<th className="text-right">Foreign</th>
											</tr>
										</thead>
										<tbody>
											{(
												Object.keys(latest.local) as Array<
													keyof typeof latest.local
												>
											)
												.filter((key) => key !== "total")
												.map((key) => (
													<tr
														className="border-t border-[var(--color-border)]"
														key={key}
													>
														<th className="py-2 font-normal capitalize">
															{key.replace(/([A-Z])/g, " $1")}
														</th>
														<td className="px-2 text-right tabular-nums">
															{latest.local[key]?.toLocaleString() ??
																"Not available"}
														</td>
														<td className="text-right tabular-nums">
															{latest.foreign[key]?.toLocaleString() ??
																"Not available"}
														</td>
													</tr>
												))}
										</tbody>
									</table>
								</div>
							</details>
						</>
					)}
				</div>

				<div className="min-w-0 border border-[var(--color-border)] bg-white p-5 lg:col-span-2">
					<h3 className="text-base font-bold">Corporate actions</h3>
					<p className="mt-2 text-xs text-[var(--color-muted)]">
						Company events, not shareholder transactions.
					</p>
					<PanelFeedback
						state={corporateActions}
						label="corporate actions"
						retry={() => retry("corporateActions")}
					/>
					{corporateActions.data && (
						<CorporateActions actions={corporateActions.data} />
					)}
				</div>
			</div>
		</section>
	);
}
