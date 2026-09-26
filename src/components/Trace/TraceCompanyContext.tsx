/** @format */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type {
	PanelState,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
} from "../../types/tracepoint";
import { percentage } from "../../utils/trace/format";
import CorporateActions from "./CorporateActions";
import PanelFeedback from "./PanelFeedback";

type Props = {
	freeFloat: PanelState<TracePointFreeFloat>;
	management: PanelState<TracePointManagement>;
	composition: PanelState<TracePointComposition>;
	corporateActions: PanelState<TracePointCorporateActions>;
	retry: (name: string) => void;
};

const categoryLabels: Record<string, string> = {
	individual: "Individual",
	institutional: "Institutional",
	corporate: "Corporate",
	government: "Government",
	fund: "Fund",
	employee: "Employee",
	other: "Other",
};

const investorCategoryColors: Record<string, string> = {
	individual: "#76b900",
	institutional: "#5a8d00",
	corporate: "#bff230",
	government: "#952fc6",
	fund: "#4d1368",
	employee: "#df6500",
	other: "#0046a4",
};

const fallbackChartColors = [
	"#76b900",
	"#5a8d00",
	"#bff230",
	"#952fc6",
	"#4d1368",
	"#df6500",
	"#ef9100",
	"#0046a4",
];

const chartColors = {
	primary: "var(--color-primary)",
	accent: "var(--color-accent)",
	border: "var(--color-border)",
	background: "var(--color-background)",
	muted: "var(--color-muted)",
};

function formatCategoryLabel(key: string) {
	return (
		categoryLabels[key] ??
		key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())
	);
}

function getCategoryColor(key: string, index: number) {
	return (
		investorCategoryColors[key] ??
		fallbackChartColors[index % fallbackChartColors.length]
	);
}

function LocalForeignComparison({
	local,
	foreign,
	total,
}: {
	local: number | null | undefined;
	foreign: number | null | undefined;
	total: number | null | undefined;
}) {
	const localPercentage =
		local != null && total != null && total > 0 ? local / total : null;

	const foreignPercentage =
		foreign != null && total != null && total > 0 ? foreign / total : null;

	const hasLocalData = localPercentage != null;
	const hasForeignData = foreignPercentage != null;

	if (!hasLocalData && !hasForeignData) {
		return (
			<p className="mt-4 text-sm text-[var(--color-muted)]">
				Local and foreign share data is not available.
			</p>
		);
	}

	const localWidth = (localPercentage ?? 0) * 100;
	const foreignWidth = (foreignPercentage ?? 0) * 100;

	return (
		<div className="mt-5">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						Local
					</p>

					<p className="mt-1 text-2xl font-bold">
						{percentage(localPercentage)}
					</p>
				</div>

				<div className="text-right">
					<p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
						Foreign
					</p>

					<p className="mt-1 text-2xl font-bold">
						{percentage(foreignPercentage)}
					</p>
				</div>
			</div>

			<div className="relative mt-4 h-16 w-full overflow-hidden">
				<div className="absolute inset-0 flex items-center">
					<div
						className="h-12 bg-[var(--color-primary)]"
						style={{
							width: `${localWidth / 2}%`,
							marginLeft: `${50 - localWidth / 2}%`,
						}}
					/>

					<div
						className="h-12 bg-[var(--color-accent)]"
						style={{
							width: `${foreignWidth / 2}%`,
						}}
					/>
				</div>

				<div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white" />
			</div>

			<div className="mt-2 grid grid-cols-2 gap-4 text-[10px] text-[var(--color-muted)]">
				<span>{local?.toLocaleString() ?? "Not available"} shares</span>

				<span className="text-right">
					{foreign?.toLocaleString() ?? "Not available"} shares
				</span>
			</div>
		</div>
	);
}

function InvestorCategoryPieChart({
	local,
	foreign,
}: {
	local: Record<string, number | null | undefined>;
	foreign: Record<string, number | null | undefined>;
}) {
	const categories = Object.keys(local)
		.filter((key) => key !== "total")
		.map((key) => {
			const localValue = local[key] ?? 0;
			const foreignValue = foreign[key] ?? 0;

			return {
				key,
				name: formatCategoryLabel(key),
				value: localValue + foreignValue,
			};
		})
		.filter((category) => category.value > 0);

	const total = categories.reduce((sum, category) => sum + category.value, 0);

	if (!categories.length || total <= 0) {
		return (
			<p className="mt-4 text-sm text-[var(--color-muted)]">
				Investor category data is not available.
			</p>
		);
	}

	const data = categories.map((category) => ({
		...category,
		percentage: category.value / total,
	}));

	return (
		<div className="mt-5 grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
			<div className="h-[180px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							nameKey="name"
							cx="50%"
							cy="50%"
							innerRadius={48}
							outerRadius={78}
							paddingAngle={1}
							stroke={chartColors.background}
							strokeWidth={2}
							isAnimationActive={false}
						>
							{data.map((entry, index) => (
								<Cell
									key={entry.key}
									fill={getCategoryColor(entry.key, index)}
								/>
							))}
						</Pie>

						<Tooltip
							formatter={(value, _name, item) => [
								`${((Number(value) / total) * 100).toFixed(1)}%`,
								item.payload.name,
							]}
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>

			<div className="space-y-3">
				{data.map((category, index) => (
					<div
						key={category.key}
						className="flex items-center justify-between gap-4 text-sm"
					>
						<div className="flex min-w-0 items-center gap-2">
							<span
								className="h-2.5 w-2.5 shrink-0"
								style={{
									backgroundColor: getCategoryColor(category.key, index),
								}}
							/>

							<span className="truncate">{category.name}</span>
						</div>

						<span className="shrink-0 tabular-nums font-semibold">
							{percentage(category.percentage)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

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

					<details
						open
						className="mt-6 border-t border-[var(--color-border)] pt-4"
					>
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

							<LocalForeignComparison
								local={latest.local.total}
								foreign={latest.foreign.total}
								total={latest.sharesNumber}
							/>

							<div className="mt-6 border-t border-[var(--color-border)] pt-5">
								<h4 className="text-sm font-bold">Investor categories</h4>

								<p className="mt-1 text-xs text-[var(--color-muted)]">
									Share distribution by investor category.
								</p>

								<InvestorCategoryPieChart
									local={latest.local}
									foreign={latest.foreign}
								/>
							</div>
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
