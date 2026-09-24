/** @format */

import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import LogoNav from "../assets/logo/logo-nav.png";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const pathname = location.pathname;

	const isLanding = pathname === "/";
	const showNav = !isLanding;

	return (
		<div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-primary)] font-sans">
			{showNav && (
				<header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--color-primary)]/80 backdrop-blur-md backdrop-saturate-150">
					<div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
						<Link to="/" className="group inline-flex items-center gap-2">
							<img
								src={LogoNav}
								alt="TracePoint"
								className="h-8 transition-opacity group-hover:opacity-80"
							/>
						</Link>

						<Link
							to="/search"
							className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-1.5 text-sm font-bold text-[var(--color-primary)] shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
						>
							<Search size={14} />
							New search
						</Link>
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
				className={`mx-auto max-w-[1400px] px-4 pb-12 sm:px-6 ${
					isLanding ? "pt-12" : "pt-8"
				}`}
			>
				{children}
			</main>

			{showNav && (
				<footer className="border-t border-[var(--color-border)] bg-[var(--color-primary)]">
					<div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
						<div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
							{/* Brand */}
							<div className="flex items-center gap-3">
								<img
									src="/src/assets/logo/logo-square.png"
									alt="TracePoint"
									className="h-9 w-9 rounded-lg object-contain"
								/>

								<div className="flex flex-col">
									<span className="text-sm font-semibold text-[var(--color-surface)]">
										TracePoint
									</span>
									<span className="text-xs text-[var(--color-surface)]">
										Ownership relationship explorer
									</span>
								</div>
							</div>

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
			)}
		</div>
	);
}
