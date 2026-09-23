/** @format */

import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const pathname = location.pathname;

	const isLanding = pathname === "/";
	const showNav = !isLanding;

	return (
		<div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-primary)] font-sans">
			{showNav && (
				<header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
					<div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
						<Link to="/" className="inline-flex items-center gap-2 group">
							<div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)]">
								<Search
									className="h-4 w-4 text-[var(--color-accent)]"
									strokeWidth={2.5}
								/>
							</div>
							<span className="text-base font-bold tracking-tight">
								TracePoint
							</span>
						</Link>

						<nav className="flex items-center gap-1">
							<Link
								to="/search"
								className={`inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors ${
									pathname.startsWith("/search")
										? "bg-[var(--color-primary)] text-[var(--color-accent)]"
										: "text-[var(--color-muted)] hover:bg-gray-100 hover:text-[var(--color-primary)]"
								}`}
							>
								<Search size={14} />
								Search
							</Link>
						</nav>

						<Link
							to="/search"
							className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 py-1.5 text-sm font-bold text-[var(--color-primary)] transition-colors hover:opacity-90"
						>
							<Search size={14} />
							New search
						</Link>
					</div>
				</header>
			)}

			<main
				className={`mx-auto max-w-[1400px] px-6 pb-12 ${isLanding ? "pt-12" : "pt-8"}`}
			>
				{children}
			</main>

			{showNav && (
				<footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-6">
					<div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-6 text-center text-xs text-[var(--color-muted)]">
						<span>
							TracePoint — Ownership relationship explorer for Indonesian listed
							companies.
						</span>
						<span className="text-[var(--color-muted)]">
							Data as reported by Sectors.
						</span>
					</div>
				</footer>
			)}
		</div>
	);
}
