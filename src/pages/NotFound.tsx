/** @format */

import { Link } from "react-router-dom";

export default function NotFound() {
	return (
		<div className="mx-auto max-w-2xl px-4 py-16 text-center">
			<h1 className="text-4xl font-bold tracking-tight text-(--color-primary)">
				404
			</h1>
			<p className="mt-2 text-lg text-(--color-muted)">Page not found.</p>
			<p className="mt-1 text-sm text-(--color-muted)">
				The page you are looking for does not exist.
			</p>
			<div className="mt-6">
				<Link
					to="/search"
					className="inline-flex items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary) hover:border-(--color-accent) hover:text-(--color-accent)"
				>
					<span className="inline-flex h-3 w-3 rounded-full bg-(--color-accent)" />
					Go to Search
				</Link>
			</div>
		</div>
	);
}
