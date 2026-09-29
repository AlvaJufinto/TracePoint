/** @format */

import { ArrowRight, Building2, GitBranch, Search } from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo from "../components/BrandLogo";
import OwnershipGraph from "../components/Home/OwnershipGraph";

const features = [
	{
		icon: Search,
		label: "01",
		title: "Find ownership data",
		description:
			"Search companies or shareholders and get to the relevant ownership data faster.",
	},
	{
		icon: Building2,
		label: "02",
		title: "See the structure",
		description:
			"See reported shareholders and ownership percentages in one connected view.",
	},
	{
		icon: GitBranch,
		label: "03",
		title: "Connect the relationships",
		description:
			"Follow shareholders across companies to uncover reported ownership connections.",
	},
];

export default function Home() {
	return (
		<div className="min-h-full bg-white text-black">
			<section className="bg-[var(--color-primary)] text-white">
				<div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
					<div>
						<div>
							<div className="mb-10">
								<BrandLogo variant="white" className="h-16 sm:h-20" />
							</div>
							<h1 className="max-w-5xl text-4xl font-bold leading-[1.12] sm:text-5xl lg:text-6xl">
								<span className="text-white!">
									Trace shareholder connections in 3 step
								</span>
								<br />
								<span className="bg-[var(--color-accent)] px-1 text-black">
									Start &gt; Type &gt; Search
								</span>
							</h1>
							<p className="mt-7 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
								Shareholder relationships, uncover ownership, and trace the same shareholders into one connected view across Indonesian listed companies.
							</p>

							<div className="mt-9 flex flex-wrap gap-3">
								<Link
									to="/search"
									className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-[var(--color-accent)] px-6 text-base font-bold text-black transition-colors hover:bg-[var(--color-primary-dark)] hover:text-[var(--color-accent)]! border hover:border-[var(--color-accent)]!"
								>
									Start Trace
									<ArrowRight size={17} strokeWidth={2.5} />
								</Link>
							</div>
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
									className={`relative border border-[var(--color-border)] border-b-0 px-0 py-10 sm:px-7 sm:py-12 ${
										index > 0 ? "border-t-0 sm:border-l-0 sm:border-t" : ""
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
				<div className="mx-auto graph max-w-7xl py-14 px-4 sm:py-20 ">
					<div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
						<div>
							<h2 className="max-w-md text-3xl font-bold leading-tight sm:text-4xl">
								From fragmented data to one clear view.
							</h2>
						</div>

						<div className="border-t border-[var(--color-border)]">
							<div className="grid gap-6 border-b border-[var(--color-border)] py-6 sm:grid-cols-[80px_1fr]">
								<span className="text-xs font-bold text-[var(--color-muted)]">
									01
								</span>
								<div>
									<h3 className="font-bold">Find</h3>
									<p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
										Search for a company or shareholder.
									</p>
								</div>
							</div>

							<div className="grid gap-6 border-b border-[var(--color-border)] py-6 sm:grid-cols-[80px_1fr]">
								<span className="text-xs font-bold text-[var(--color-muted)]">
									02
								</span>
								<div>
									<h3 className="font-bold">Understand</h3>
									<p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
										Explore its reported ownership structure in one view.
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
										Follow shareholder connections across companies.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
