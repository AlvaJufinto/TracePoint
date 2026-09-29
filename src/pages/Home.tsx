/** @format */

import { ArrowRight, Building2, GitBranch, Search } from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo from "../components/BrandLogo";
import OwnershipGraph from "../components/Home/OwnershipGraph";

const features = [
	{
		icon: Search,
		label: "01",
		title: "Search",
		description:
			"Find Indonesian listed companies by ticker, company name, or shareholder name.",
	},
	{
		icon: Building2,
		label: "02",
		title: "Inspect",
		description:
			"Review reported shareholders, ownership percentages, company data, and market context.",
	},
	{
		icon: GitBranch,
		label: "03",
		title: "Trace",
		description:
			"Follow shareholder names across companies and verify exact matches in ownership reports.",
	},
];

export default function Home() {
	return (
		<div className="min-h-full bg-white text-black">
			<section className="bg-[var(--color-primary)] text-white">
				<div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
					<div className="grid items-end gap-12 lg:grid-cols-[1.4fr_0.6fr]">
						<div>
							<div className="mb-10">
								<BrandLogo variant="white" className="h-16 sm:h-20" />
							</div>
							<h1 className="max-w-4xl text-4xl font-bold leading-[1.12] sm:text-5xl lg:text-6xl">
								<span className="bg-[var(--color-accent)] px-1 text-black">
									Understand who owns
								</span>
								<br />
								<span className="text-white!">what.</span>
							</h1>
							<p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
								Explore reported ownership relationships across Indonesian
								listed companies. Search shareholders, inspect ownership
								structures, and trace names across the market.
							</p>

							<div className="mt-9 flex flex-wrap gap-3">
								<Link
									to="/search"
									className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-[var(--color-accent)] px-6 text-base font-bold text-black transition-colors hover:bg-[var(--color-primary-dark)] hover:text-[var(--color-accent)]! border hover:border-[var(--color-accent)]!"
								>
									Search companies
									<ArrowRight size={17} strokeWidth={2.5} />
								</Link>

								<Link
									to="/search?mode=shareholder"
									className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] border border-white/50 px-6 text-base font-bold text-white! transition-colors hover:border-white hover:bg-white/10"
								>
									Search shareholders
								</Link>
							</div>
						</div>

						<div className="border-l border-white/20 pl-6 lg:mb-1">
							<p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
								TracePoint
							</p>

							<p className="mt-4 text-sm leading-6 text-white/70">
								A research interface for navigating reported ownership data from
								Indonesian listed companies.
							</p>

							<div className="mt-7 h-px bg-white/20" />

							<p className="mt-5 text-xs leading-5 text-white/50">
								Data source
								<br />
								<span className="text-white/80">Sectors Financial API v2</span>
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="border-b border-[var(--color-border)]">
				<div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
					<div className="grid sm:grid-cols-3">
						{features.map((feature, index) => {
							const Icon = feature.icon;

							return (
								<div
									key={feature.title}
									className={`relative px-0 py-10 sm:px-7 sm:py-12 ${
										index > 0
											? "border-t border-[var(--color-border)] sm:border-l sm:border-t-0"
											: ""
									}`}
								>
									<div className="absolute right-0 top-0 h-3 w-3 bg-[var(--color-accent)]" />

									<div className="flex items-center justify-between">
										<Icon
											size={23}
											strokeWidth={2}
											className="text-[var(--color-accent)]"
										/>

										<span className="text-xs font-bold text-[var(--color-muted)]">
											{feature.label}
										</span>
									</div>

									<h2 className="mt-8 text-xl font-bold">{feature.title}</h2>

									<p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
										{feature.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>
			<OwnershipGraph />
			<section>
				<div
					className="mx-Ownership graph

 max-w-7xl px-6 py-14 sm:px-10 sm:py-20 lg:px-12"
				>
					<div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
								How it works
							</p>

							<h2 className="mt-4 max-w-md text-3xl font-bold leading-tight sm:text-4xl">
								From company search to ownership trace.
							</h2>
						</div>

						<div className="border-t border-[var(--color-border)]">
							<div className="grid gap-6 border-b border-[var(--color-border)] py-6 sm:grid-cols-[80px_1fr]">
								<span className="text-xs font-bold text-[var(--color-muted)]">
									01
								</span>
								<div>
									<h3 className="font-bold">Search</h3>
									<p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
										Search by ticker, company name, or shareholder name.
									</p>
								</div>
							</div>

							<div className="grid gap-6 border-b border-[var(--color-border)] py-6 sm:grid-cols-[80px_1fr]">
								<span className="text-xs font-bold text-[var(--color-muted)]">
									02
								</span>
								<div>
									<h3 className="font-bold">Inspect</h3>
									<p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
										Open a company workspace to inspect its reported ownership
										and company data.
									</p>
								</div>
							</div>

							<div className="grid gap-6 border-b border-[var(--color-border)] py-6 sm:grid-cols-[80px_1fr]">
								<span className="text-xs font-bold text-[var(--color-muted)]">
									03
								</span>
								<div>
									<h3 className="font-bold">Trace</h3>
									<p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
										Select a shareholder and search for the same name across
										other company ownership reports.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="bg-[#f7f7f7]">
				<div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">
					<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-bold">
								Reported data. Transparent terminology.
							</p>
							<p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--color-muted)]">
								Ownership percentages are reported by Sectors and may not sum to
								100%. A confirmed trace means an exact shareholder-name match in
								an ownership report; it does not establish beneficial ownership.
							</p>
						</div>

						<Link
							to="/search"
							className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[var(--color-primary)]"
						>
							Start exploring
							<ArrowRight size={16} strokeWidth={2.5} />
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
}
