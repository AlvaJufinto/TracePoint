/** @format */

import { Link } from "react-router-dom";

export default function NotFound() {
	return (
		<div className="mx-auto max-w-2xl px-4 py-16 text-center">
			<h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
				404
			</h1>
			<p className="mt-2 text-lg text-[var(--color-muted)]">Page not found.</p>
			<p className="mt-1 text-sm text-[var(--color-muted)]">
				The page you are looking for does not exist.
			</p>
			<div className="mt-6">
				<Link
					to="/search"
					className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
				>
					<span className="inline-flex h-3 w-3 rounded-full bg-[var(--color-accent)]" />
					Go to Search
				</Link>
			</div>
		</div>
	);
}
