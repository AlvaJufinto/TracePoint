/** @format */

import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import BrandLogo from "../components/BrandLogo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const pathname = location.pathname;

	const isLanding = pathname === "/";
	const isTrace = pathname === "/trace";
	const showNav = !isLanding;

	return (
		<div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-primary)] font-sans">
			{showNav && (
				<header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/90 shadow-sm backdrop-blur-xl">
					<div className="mx-auto flex max-w-[1400px] items-center justify-between py-3 px-4 lg:px-20">
						<Link
							to="/"
							aria-label="TracePoint home"
							className="group inline-flex items-center"
						>
							<BrandLogo className="h-10 transition-opacity group-hover:opacity-70" />
						</Link>
						{isTrace && (
							<Link
								to="/search"
								className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
							>
								<Search aria-hidden="true" size={15} />
								Search
							</Link>
						)}
					</div>
				</header>
			)}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:block focus:p-3"
			>
				Skip to content
			</a>
			<main
				id="main-content"
				className={`mx-auto  ${
					isLanding ? "" : "max-w-7xl px-4 pb-12 sm:px-6 pt-8"
				}`}
			>
				{children}
			</main>

			<footer className="border-t border-[var(--color-border)] bg-[var(--color-primary)]">
				<div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 pt-8">
					<div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
						{/* Brand */}
						<BrandLogo variant="white" className="h-12" />

						{/* Description */}
						<div className="max-w-md text-left sm:text-right">
							<p className="text-xs leading-relaxed text-[var(--color-surface)]">
								Explore ownership relationships and company structures for
								Indonesian listed companies.
							</p>
						</div>
					</div>

					<div className="my-6 border-t border-[var(--color-border)]" />

					{/* Bottom row */}
					<div className="flex flex-col gap-2 text-xs text-[var(--color-surface)] sm:flex-row sm:items-center sm:justify-between">
						<span>Data as reported by Sectors.</span>

						<span>© {new Date().getFullYear()} TracePoint</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
