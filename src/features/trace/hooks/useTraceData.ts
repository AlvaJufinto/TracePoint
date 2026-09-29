/** @format */

import { useEffect, useState } from "react";

import {
	getCompanyManagement,
	getCompanyOverview,
	getCompanyOwnership,
	getCorporateActions,
	getFreeFloat,
	getShareholderComposition,
	searchByShareholderName,
	verifyTraceCandidates,
} from "../../../lib/trace-data-api";
import type {
	PanelState,
	TraceCandidate,
	TracePointCompany,
	TracePointComposition,
	TracePointCorporateActions,
	TracePointFreeFloat,
	TracePointManagement,
	TracePointOwnershipSnapshot,
} from "../../../types/tracepoint";

type TracePanels = {
	company: PanelState<TracePointCompany>;
	ownership: PanelState<TracePointOwnershipSnapshot>;
	management: PanelState<TracePointManagement>;
	freeFloat: PanelState<TracePointFreeFloat>;
	composition: PanelState<TracePointComposition>;
	corporateActions: PanelState<TracePointCorporateActions>;
};

type PanelKey = keyof TracePanels;

type CompletedShareholderTrace = {
	shareholderName: string;
	candidates: TraceCandidate[];
};

function createPanelState<T>(): PanelState<T> {
	return { status: "loading", data: null, error: null };
}

function useTracePanel<T>(
	ticker: string,
	revision: number,
	request: (ticker: string) => Promise<T>,
): PanelState<T> {
	const [state, setState] = useState<PanelState<T>>(createPanelState);
	const [loadedFor, setLoadedFor] = useState<{
		ticker: string;
		revision: number;
	} | null>(null);

	useEffect(() => {
		let active = true;
		void request(ticker)
			.then((data) => {
				if (active) {
					setState({ status: "success", data, error: null });
					setLoadedFor({ ticker, revision });
				}
			})
			.catch(() => {
				if (active) {
					setState({ status: "error", data: null, error: "Request failed" });
					setLoadedFor({ ticker, revision });
				}
			});

		return () => {
			active = false;
		};
	}, [ticker, revision, request]);

	return loadedFor?.ticker === ticker && loadedFor.revision === revision
		? state
		: createPanelState();
}

export function useTraceData(ticker: string, shareholder: string | null) {
	const [revisions, setRevisions] = useState<Record<PanelKey, number>>({
		company: 0,
		ownership: 0,
		management: 0,
		freeFloat: 0,
		composition: 0,
		corporateActions: 0,
	});
	const [traceCandidates, setTraceCandidates] = useState<TraceCandidate[]>([]);
	const [completedTraces, setCompletedTraces] = useState<CompletedShareholderTrace[]>([]);
	const [traceLoading, setTraceLoading] = useState(false);
	const [traceError, setTraceError] = useState(false);
	const [traceMore, setTraceMore] = useState(false);
	const [traceRevision, setTraceRevision] = useState(0);
	const panels: TracePanels = {
		company: useTracePanel(ticker, revisions.company, getCompanyOverview),
		ownership: useTracePanel(ticker, revisions.ownership, getCompanyOwnership),
		management: useTracePanel(
			ticker,
			revisions.management,
			getCompanyManagement,
		),
		freeFloat: useTracePanel(ticker, revisions.freeFloat, getFreeFloat),
		composition: useTracePanel(
			ticker,
			revisions.composition,
			getShareholderComposition,
		),
		corporateActions: useTracePanel(
			ticker,
			revisions.corporateActions,
			getCorporateActions,
		),
	};

	useEffect(() => {
		if (!shareholder) {
			return;
		}

		let active = true;
		const controller = new AbortController();

		void (async () => {
			setTraceLoading(true);
			setTraceError(false);
			setTraceCandidates([]);

			try {
				const response = await searchByShareholderName(
					shareholder,
					20,
					controller.signal,
				);
				const candidates = response.results.map((item) => ({
					...item,
					screenerName: shareholder,
				}));

				if (!active) return;
				setTraceCandidates(candidates);
				setTraceMore(response.hasMore);

				let completedCandidates = candidates;
				if (candidates.length) {
					const checked = await verifyTraceCandidates(
						{ candidates: candidates.slice(0, 5) },
						controller.signal,
					);
					if (!active) return;
					completedCandidates = candidates.map((candidate) => ({
							...candidate,
							verification: checked.results.find(
								(item) => item.ticker === candidate.ticker,
							),
						}));
					setTraceCandidates(completedCandidates);
				}
				setCompletedTraces((current) => {
					const nextTrace = { shareholderName: shareholder, candidates: completedCandidates };
					const existing = current.findIndex(
						(trace) => trace.shareholderName === shareholder,
					);
					if (existing === -1) return [...current, nextTrace];
					return current.map((trace, index) =>
						index === existing ? nextTrace : trace,
					);
				});
			} catch (error) {
				if (
					active &&
					!(error instanceof DOMException && error.name === "AbortError")
				) {
					setTraceError(true);
				}
			} finally {
				if (active) setTraceLoading(false);
			}
		})();

		return () => {
			active = false;
			controller.abort();
		};
	}, [shareholder, traceRevision]);

	function retryPanel(key: string) {
		if (!(key in revisions)) return;
		setRevisions((current) => ({
			...current,
			[key as PanelKey]: current[key as PanelKey] + 1,
		}));
	}

	async function verifyNext() {
		const pending = traceCandidates
			.filter(
				(candidate) =>
					!candidate.verification ||
					candidate.verification.status === "not_found",
			)
			.slice(0, 5);

		setTraceLoading(true);
		setTraceError(false);
		try {
			const checked = await verifyTraceCandidates({ candidates: pending });
			const nextCandidates = traceCandidates.map((candidate) => ({
					...candidate,
					verification:
						checked.results.find((item) => item.ticker === candidate.ticker) ||
						candidate.verification,
				}));
			setTraceCandidates(nextCandidates);
			if (shareholder) {
				setCompletedTraces((current) =>
					current.map((trace) =>
						trace.shareholderName === shareholder
							? { ...trace, candidates: nextCandidates }
							: trace,
					),
				);
			}
		} catch {
			setTraceError(true);
		} finally {
			setTraceLoading(false);
		}
	}

	return {
		panels,
		retryPanel,
		traceCandidates,
		completedTraces,
		traceLoading,
		traceError,
		traceMore,
		refreshTrace: () => setTraceRevision((value) => value + 1),
		verifyNext,
		clearCompletedTrace: (shareholderName: string) =>
			setCompletedTraces((current) =>
				current.filter((trace) => trace.shareholderName !== shareholderName),
			),
		pendingCount: traceCandidates.filter(
			(item) => !item.verification || item.verification.status === "not_found",
		).length,
	};
}
