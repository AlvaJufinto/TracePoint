/** @format */

import { type FormEvent, useEffect, useState } from "react";

import { ArrowRight, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
	getCompanyOverview,
	searchByShareholderName,
	searchCompanies,
} from "../lib/tracepoint-api";
import type { TracePointScreenerResponse } from "../types/tracepoint";

export default function SearchPage() {
	const [params, setParams] = useSearchParams();
	const query = params.get("q") || "";
	const mode = params.get("mode") === "shareholder" ? "shareholder" : "company";
	return (
		<SearchForm
			key={query + mode}
			submitted={query}
			searchMode={mode}
			onSearch={(q, mode) => setParams({ q, mode })}
		/>
	);
}

function SearchForm({
	submitted,
	searchMode,
	onSearch,
}: {
	submitted: string;
	searchMode: "company" | "shareholder";
	onSearch: (q: string, mode: "company" | "shareholder") => void;
}) {
	const [query, setQuery] = useState(submitted);
	const [mode, setMode] = useState(searchMode);
	const [result, setResult] = useState<TracePointScreenerResponse | null>(null);
	const [error, setError] = useState(false);
	const [retry, setRetry] = useState(0);
	useEffect(() => {
		if (!submitted) return;
		let active = true;
		async function search() {
			try {
				let response: TracePointScreenerResponse;
				if (searchMode === "shareholder")
					response = await searchByShareholderName(submitted, 20);
				else if (/^[A-Z]{2,5}(\.JK)?$/i.test(submitted)) {
					try {
						const company = await getCompanyOverview(
							submitted.toUpperCase().replace(/\.JK$/, "") + ".JK",
						);
						response = {
							results: [{ ticker: company.ticker, companyName: company.name }],
							totalCount: 1,
							hasMore: false,
							nextOffset: null,
						};
					} catch {
						// Short company names can resemble tickers.
						response = await searchCompanies(submitted, { limit: 20 });
					}
				} else response = await searchCompanies(submitted, { limit: 20 });
				if (active) setResult(response);
			} catch {
				if (active) setError(true);
			}
		}
		void search();
		return () => {
			active = false;
		};
	}, [submitted, searchMode, retry]);
	function submit(event: FormEvent) {
		event.preventDefault();
		if (query.trim() === submitted && mode === searchMode) {
			setResult(null);
			setError(false);
			setRetry(retry + 1);
		} else onSearch(query.trim(), mode);
	}
	const loading = !!submitted && !result && !error;
	const returnTo =
		"/search?" + new URLSearchParams({ q: submitted, mode: searchMode });
	return (
		<div className="mx-auto max-w-2xl py-4 sm:py-8 min-h-[800px]">
			<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
				Start an investigation
			</p>
			<h1 className="text-3xl font-bold">Find a company</h1>
			<p className="mt-3 text-[var(--color-muted)]">
				Search Indonesian listed companies, then inspect their reported
				ownership.
			</p>
			<form onSubmit={submit} className="my-8">
				<div className="mb-5 flex gap-2" aria-label="Search mode">
					{(["company", "shareholder"] as const).map((value) => (
						<button
							key={value}
							type="button"
							aria-pressed={mode === value}
							onClick={() => setMode(value)}
							className={`min-h-11 rounded-[var(--radius-sm)] border px-4 font-semibold ${mode === value ? "border-[var(--color-primary)] bg-[var(--color-accent)]" : "border-[var(--color-border)] bg-white hover:bg-gray-50"}`}
						>
							{value === "company" ? "Company" : "Shareholder"}
						</button>
					))}
				</div>
				<label
					htmlFor="company-search"
					className="mb-2 block text-sm font-semibold"
				>
					{mode === "company" ? "Ticker or company name" : "Shareholder name"}
				</label>
				<div className="flex gap-2">
					<input
						id="company-search"
						type="search"
						autoFocus
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={
							mode === "company"
								? "BBCA or Bank Central Asia"
								: "PT Dwimuria Investama Andalan"
						}
						className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-3"
					/>
					<button
						disabled={!query.trim()}
						className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 font-bold hover:brightness-95"
					>
						Search
					</button>
				</div>
				<p className="mt-3 text-xs text-[var(--color-muted)]">
					{mode === "shareholder"
						? "Results are candidates. Inspect ownership before tracing an exact shareholder name."
						: "Tickers work with or without the .JK suffix."}
				</p>
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<span className="text-xs text-[var(--color-muted)]">Try</span>
					{["BBCA", "BREN", "ADRO", "AMMN", "TLKM"].map((ticker) => (
						<button
							key={ticker}
							type="button"
							onClick={() => onSearch(ticker, "company")}
							className="min-h-11 border border-[var(--color-border)] bg-white px-3 text-xs font-semibold hover:border-[var(--color-primary)]"
						>
							{ticker}
						</button>
					))}
				</div>
			</form>
			<section aria-live="polite" aria-busy={loading}>
				{loading && (
					<p role="status" className="flex items-center gap-3 py-8">
						<Loader2 className="animate-spin" size={18} /> Searching{" "}
						{searchMode === "company" ? "companies" : "shareholder candidates"}…
					</p>
				)}
				{error && (
					<div
						role="alert"
						className="border border-[var(--color-border)] bg-white p-6"
					>
						<h2 className="text-lg font-bold">Search could not be completed</h2>
						<p className="mt-2 text-sm">
							Please retry. Your search has been kept.
						</p>
						<button
							onClick={() => {
								setError(false);
								setResult(null);
								setRetry(retry + 1);
							}}
							className="mt-4 min-h-11 border px-4 font-semibold"
						>
							Retry search
						</button>
					</div>
				)}
				{result && (
					<>
						<h2 className="mb-3 text-sm font-semibold">
							{searchMode === "shareholder"
								? "Candidate companies"
								: "Search results"}{" "}
							· {result.results.length}
							{result.hasMore ? " shown" : ""}
						</h2>
						{searchMode === "shareholder" && (
							<p className="mb-4 text-sm text-[var(--color-muted)]">
								Screener matches are not confirmed ownership relationships.
							</p>
						)}
						{!result.results.length && (
							<div className="border-t border-[var(--color-border)] py-8">
								<h3 className="text-lg">No matching companies</h3>
								<p className="mt-2 text-[var(--color-muted)]">
									Try another ticker or a longer name.
								</p>
							</div>
						)}
						<div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
							{result.results.map((item) => (
								<Link
									key={item.ticker}
									to={
										"/trace?" +
										new URLSearchParams({ ticker: item.ticker, returnTo })
									}
									className="flex items-center justify-between gap-4 bg-white p-4 hover:bg-gray-50 hover:no-underline"
								>
									<div className="min-w-0">
										<span className="block text-base font-bold">
											{item.ticker.replace(/\.JK$/, "")}
										</span>
										<span className="mt-1 block text-sm text-[var(--color-muted)]">
											{item.companyName}
										</span>
										{searchMode === "shareholder" && (
											<span className="mt-2 block text-xs font-semibold">
												Candidate · Not confirmed
											</span>
										)}
									</div>
									<span className="flex shrink-0 items-center gap-2 text-xs font-semibold">
										<span className="hidden sm:inline">Open company</span>
										<ArrowRight size={14} />
									</span>
								</Link>
							))}
						</div>
						{result.hasMore && (
							<p className="mt-4 text-sm text-[var(--color-muted)]">
								Showing the first {result.results.length} matches. Refine your
								search for a specific company.
							</p>
						)}
					</>
				)}
				{!submitted && (
					<p className="border-t border-[var(--color-border)] py-8 text-sm text-[var(--color-muted)]">
						Select a company to see its shareholders, inspect a relationship,
						and trace a shareholder to other companies.
					</p>
				)}
			</section>
		</div>
	);
}
