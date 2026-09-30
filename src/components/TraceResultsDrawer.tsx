/** @format */

import { useEffect, useRef } from "react";

import { Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";

import type { TraceCandidate } from "../types/tracepoint";

interface Props {
	name: string;
	origin: string;
	searchLink: string;
	candidates: TraceCandidate[];
	isLoading: boolean;
	error: boolean;
	hasMore: boolean;
	onClose: () => void;
	onRetry: () => void;
	onVerifyNext?: () => void;
}

export default function TraceResultsDrawer({
	name,
	origin,
	searchLink,
	candidates,
	isLoading,
	error,
	hasMore,
	onClose,
	onRetry,
	onVerifyNext,
}: Props) {
	const dialog = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const element = dialog.current!;
		const previous = document.activeElement as HTMLElement | null;
		element.showModal();
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			element.close();
			document.body.style.overflow = overflow;
			previous?.focus();
		};
	}, []);
	const confirmed = candidates.filter(
		(item) => item.verification?.status === "confirmed",
	);
	const remaining = candidates.filter(
		(item) => item.verification?.status !== "confirmed",
	);
	function results(items: TraceCandidate[]) {
		return items.map((candidate) => {
			const checked = candidate.verification;
			return (
				<article
					key={candidate.ticker}
					className="border-t border-(--color-border) py-4"
				>
					<div className="text-base font-bold">
						{candidate.ticker.replace(/\.JK$/, "")}
					</div>
					<p className="mt-1 text-sm">{candidate.companyName}</p>
					<p className="mt-3 text-xs font-semibold">
						{checked?.status === "confirmed"
							? "Confirmed name match · Reported by Sectors"
							: checked?.status === "mismatch"
								? "Not confirmed · No exact ownership name match"
								: checked?.status === "not_found"
									? "Check failed · Ownership report unavailable"
									: "Candidate · Not checked yet"}
					</p>
					{checked?.status === "confirmed" && (
						<div className="mt-2 text-xs text-(--color-muted)">
							<p className="break-words">{checked.ownershipName}</p>
							<p className="mt-1">
								Ownership:{" "}
								{checked.sharePercentage == null
									? "Not available"
									: (checked.sharePercentage * 100).toFixed(3) + "%"}
							</p>
							<p>
								Shares:{" "}
								{checked.shareAmount?.toLocaleString() ?? "Not available"}
							</p>
							<p>Ownership date unavailable</p>
						</div>
					)}
					<Link
						onClick={onClose}
						to={
							"/trace?" +
							new URLSearchParams({
								ticker: candidate.ticker,
								via: name,
								from: origin,
								returnTo: searchLink,
							})
						}
						className="mt-3 inline-flex min-h-11 items-center border border-(--color-primary) px-4 text-sm font-semibold hover:bg-(--color-accent) hover:no-underline"
					>
						Open company
					</Link>
				</article>
			);
		});
	}
	return (
		<dialog
			ref={dialog}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			aria-labelledby="trace-title"
			className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-lg border-l border-(--color-border) bg-white p-0 text-(--color-primary) backdrop:bg-black/20"
		>
			<div className="flex h-full flex-col">
				<header className="flex items-start justify-between gap-3 border-b border-(--color-border) p-5">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-wider text-(--color-muted)">
							Tracing from {origin}
						</p>
						<h2 id="trace-title" className="mt-2 break-words text-xl font-bold">
							{name}
						</h2>
					</div>
					<button
						onClick={onClose}
						aria-label="Close trace results"
						className="flex h-11 w-11 shrink-0 items-center justify-center hover:bg-gray-100"
					>
						<X size={20} />
					</button>
				</header>
				<div className="min-h-0 flex-1 overflow-y-auto p-5">
					<p className="mb-5 text-sm text-(--color-muted)">
						A candidate becomes a confirmed name match only when its ownership
						report lists this exact shareholder name. This does not establish
						beneficial ownership.
					</p>
					<div aria-live="polite">
						{isLoading && (
							<p role="status" className="mb-4 flex items-center gap-2 text-sm">
								<Loader2 size={16} className="animate-spin" />
								Checking ownership reports…
							</p>
						)}
						{error && (
							<div
								role="alert"
								className="mb-4 border border-(--color-border) p-4 text-sm"
							>
								<p>
									Trace could not be completed. Your investigation is still
									available.
								</p>
								<button
									disabled={isLoading}
									onClick={onVerifyNext || onRetry}
									className="mt-3 min-h-11 border px-4 font-semibold"
								>
									Retry trace
								</button>
							</div>
						)}
						{!isLoading && !error && !candidates.length && (
							<div className="py-6">
								<h3 className="text-lg font-bold">
									No candidate companies returned
								</h3>
								<p className="mt-2 text-sm text-(--color-muted)">
									Sectors did not return matches for this name. This does not
									prove that other holdings do not exist.
								</p>
							</div>
						)}
						{confirmed.length > 0 && (
							<section>
								<h3 className="mb-2 text-sm font-bold">
									Confirmed name matches · {confirmed.length}
								</h3>
								{results(confirmed)}
							</section>
						)}
						{remaining.length > 0 && (
							<section className="mt-5">
								<h3 className="mb-2 text-sm font-bold">
									Candidates / unconfirmed · {remaining.length}
								</h3>
								{results(remaining)}
							</section>
						)}
					</div>
					{onVerifyNext && (
						<button
							disabled={isLoading}
							onClick={onVerifyNext}
							className="mt-4 min-h-11 w-full bg-(--color-accent) px-4 font-bold hover:brightness-95"
						>
							Check next candidates / retry failed checks
						</button>
					)}
					{hasMore && (
						<p className="mt-4 text-xs text-(--color-muted)">
							Showing the first 20 screener candidates. Additional matches may
							exist.
						</p>
					)}
				</div>
				<footer className="border-t border-(--color-border) p-5 text-xs text-(--color-muted)">
					Only five candidates are checked per action. Unconfirmed candidates
					are never added as ownership relationships.
				</footer>
			</div>
		</dialog>
	);
}
