/**
 * Search page — TracePoint entry point.
 *
 * Search companies by ticker or name, then trace a shareholder to other companies.
 * Uses live Sectors API data via the server-side proxy.
 *
 * [Verified] against live Sectors API responses on 2026-09-22.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  User,
} from 'lucide-react';
import {
  searchCompanies,
  searchByShareholderName,
  verifyTraceCandidates,
  getCompanyOverview,
} from '../lib/tracepoint-api';
import type { TraceCandidate, TraceVerification } from '../types/tracepoint';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SearchMode = 'company' | 'shareholder';

interface SearchResultItem {
  ticker: string;
  companyName: string;
  type: 'company' | 'candidate';
  verification?: TraceVerification;
  sourceTicker?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTickerInput(value: string): string {
  return value.trim().toUpperCase().replace(/\.JK$/, '');
}

function classifyQuery(value: string): 'ticker' | 'name' {
  const cleaned = value.trim().toUpperCase().replace(/\.JK$/, '');
  if (/^[A-Z]{2,5}$/.test(cleaned)) return 'ticker';
  return 'name';
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ResultCard({
  item,
  onSelect,
  onTrace,
}: {
  item: SearchResultItem;
  onSelect: (ticker: string) => void;
  onTrace: (candidate: TraceCandidate) => void;
}) {
  const isCandidate = item.type === 'candidate';

  return (
    <div
      className={`rounded-xl border p-4 transition-all cursor-pointer ${
        isCandidate
          ? 'border-[#1d3245] bg-[#0c1824] hover:border-[#a87ffb] hover:bg-[#122a3d]'
          : 'border-[#1d3245] bg-[#0c1824] hover:border-[#00c3d9] hover:bg-[#0d2232]'
      }`}
      onClick={() => onSelect(item.ticker)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item.ticker);
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isCandidate ? 'bg-[#122a3d] text-[#a87ffb]' : 'bg-[#122a3d] text-[#00c3d9]'
            }`}
          >
            {isCandidate ? <User size={16} /> : <Building2 size={16} />}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm text-[#00c3d9]">{item.ticker}</div>
            <div className="text-sm text-gray-300 truncate">{item.companyName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCandidate && item.verification && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                item.verification.status === 'confirmed'
                  ? 'border border-[#1d3245] bg-[#0d2232] text-[#4ade80]'
                  : item.verification.status === 'mismatch'
                  ? 'border border-[#1d3245] bg-[#1a1a1a] text-[#f5a623]'
                  : 'border border-[#1d3245] bg-[#1a1a1a] text-gray-400'
              }`}
            >
              {item.verification.status === 'confirmed' && 'Confirmed'}
              {item.verification.status === 'mismatch' && 'Mismatch'}
              {item.verification.status === 'not_found' && 'Not found'}
            </span>
          )}
          {isCandidate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTrace(item as unknown as TraceCandidate);
              }}
              className="text-gray-500 transition-colors hover:text-[#a87ffb]"
              title="Trace this shareholder"
            >
              <ArrowRight size={16} />
            </button>
          )}
          {!isCandidate && (
            <ArrowRight size={16} className="text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
      <Loader2 size={20} className="animate-spin text-[#00c3d9]" />
      <span className="text-sm">{label || 'Loading...'}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle size={32} className="text-gray-500" />
      <span className="text-sm text-gray-400 max-w-md">{message}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle size={32} className="text-[#f5a623]" />
      <span className="text-sm text-gray-400 max-w-md">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-[#00c3d9] hover:underline mt-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialMode = searchParams.get('mode') === 'shareholder' ? 'shareholder' : 'company';

  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'empty'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tracedCandidates, setTracedCandidates] = useState<TraceCandidate[]>([]);
  const [verifying, setVerifying] = useState(false);

  // Auto-search on mount if initial query param present
  useEffect(() => {
    if (initialQuery && status === 'idle') {
      const fakeEvent = { preventDefault: () => {} } as FormEvent;
      handleSearch(fakeEvent);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e?: FormEvent) {
    e?.preventDefault();
    setError(null);

    const value = query.trim();
    if (!value) {
      setStatus('empty');
      setResults([]);
      return;
    }

    setStatus('loading');
    setResults([]);
    setTracedCandidates([]);

    searchAsync(value);
  }

  async function searchAsync(value: string) {
    try {
      const classification = classifyQuery(value);

      if (classification === 'ticker') {
        const ticker = `${normalizeTickerInput(value)}.JK`;
        const company = await getCompanyOverview(ticker);

        setResults([
          { ticker: company.ticker, companyName: company.name, type: 'company' },
        ]);
        setStatus('success');
      } else if (mode === 'shareholder') {
        const normalizedName = value.trim().replace(/\s+/g, ' ').toLowerCase();
        const searchResult = await searchByShareholderName(normalizedName, 20);

        const items: SearchResultItem[] = searchResult.results.map((r) => ({
          ticker: r.ticker,
          companyName: r.companyName,
          type: 'candidate' as const,
        }));

        setResults(items);
        setTracedCandidates(
          searchResult.results.map((r) => ({
            ticker: r.ticker,
            companyName: r.companyName,
            screenerName: normalizedName,
          })),
        );
        setStatus(items.length === 0 ? 'empty' : 'success');
      } else {
        const searchResult = await searchCompanies(value, { limit: 20 });

        const items: SearchResultItem[] = searchResult.results.map((r) => ({
          ticker: r.ticker,
          companyName: r.companyName,
          type: 'company' as const,
        }));

        setResults(items);
        setStatus(items.length === 0 ? 'empty' : 'success');
      }
    } catch (err) {
      const message = (err as Error).message;
      console.error('Search error:', message);
      setError(message);
      setStatus('error');
    }
  }

  function handleTrace(candidate: TraceCandidate) {
    const existingIndex = tracedCandidates.findIndex((c) => c.ticker === candidate.ticker);

    if (existingIndex >= 0) {
      const updated = [...tracedCandidates];
      updated[existingIndex] = candidate;
      setTracedCandidates(updated);
    } else {
      setTracedCandidates((prev) => [...prev, candidate]);
    }

    setResults((prev) =>
      prev.map((item) => {
        if (item.ticker === candidate.ticker && item.type === 'candidate') {
          return { ...item, verification: candidate.verification };
        }
        return item;
      }),
    );
  }

  function handleVerify() {
    if (tracedCandidates.length === 0) return;

    setVerifying(true);
    verifyAsync(tracedCandidates);
  }

  async function verifyAsync(candidates: TraceCandidate[]) {
    try {
      const response = await verifyTraceCandidates({
        candidates,
        maxBatch: candidates.length,
      });

      setResults((prev) =>
        prev.map((item) => {
          const verification = response.results.find((v) => v.ticker === item.ticker);
          if (verification && item.type === 'candidate') {
            return { ...item, verification };
          }
          return item;
        }),
      );

      setTracedCandidates((prev) =>
        prev.map((c) => {
          const verification = response.results.find((v) => v.ticker === c.ticker);
          return verification ? { ...c, verification } : c;
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setVerifying(false);
    }
  }

  function handleSelect(ticker: string) {
    navigate(`/trace?ticker=${encodeURIComponent(ticker)}`);
  }

  const confirmedCount = results.filter(
    (r) => r.type === 'candidate' && r.verification?.status === 'confirmed',
  ).length;

  return (
    <div className="min-h-screen bg-[#080d14] text-white font-sans relative overflow-hidden flex flex-col">
      <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#0c1a24] rounded-full opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute top-[-30%] right-[-20%] w-[1200px] h-[1200px] bg-[#0a141d] rounded-full opacity-80 blur-3xl pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Search className="w-8 h-8 text-[#00c3d9]" strokeWidth={2.5} />
            <div className="absolute w-1.5 h-1.5 bg-[#00c3d9] rounded-full mt-[-2px] ml-[-2px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wide">TracePoint</span>
            <span className="text-[10px] font-bold text-[#00c3d9] tracking-widest mt-[-2px]">
              OWNERSHIP EXPLORER
            </span>
          </div>
        </div>
        <a href="#" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
          How it works
        </a>
      </nav>

      <main className="relative z-10 flex-grow flex flex-col px-8 pb-12 max-w-[1400px] mx-auto w-full mt-12 lg:mt-24">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-24 mb-16">
          <div className="flex flex-col items-start pt-4">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#1d3245] bg-transparent mb-8">
              <span className="text-[11px] font-semibold tracking-wide text-[#00c3d9]">
                SECTORS-NATIVE RESEARCH
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Trace ownership.{' '}
              <span className="text-[#00c3d9]">Follow the connection.</span>
            </h1>

            <p className="text-[#8ba3b8] text-[15px] mb-12 max-w-xl leading-relaxed">
              Mulai dari satu emiten, lihat siapa yang terhubung, lalu telusuri{' '}
              <span className="underline decoration-[#00c3d9] decoration-1 underline-offset-4">
                entitas tersebut ke emiten lain—tanpa mengarang hubungan.
              </span>
            </p>

            <form onSubmit={(e) => handleSearch(e)} className="w-full max-w-xl mb-8">
              <div className="flex gap-2">
                <div className="flex rounded-lg border border-[#1d3245] bg-[#0c1824] p-0.5">
                  <button
                    type="button"
                    onClick={() => setMode('company')}
                    className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                      mode === 'company' ? 'bg-[#122a3d] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('shareholder')}
                    className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                      mode === 'shareholder' ? 'bg-[#122a3d] text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Shareholder
                  </button>
                </div>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    mode === 'company'
                      ? 'Search by ticker (BBCA) or company name...'
                      : 'Search by shareholder name (PT Dwimuria)...'
                  }
                  className="flex-1 rounded-lg border border-[#1d3245] bg-[#0c1824] px-4 py-3 text-white placeholder-gray-500 focus:border-[#00c3d9] focus:outline-none text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#00c3d9] px-6 py-3 text-sm font-bold text-[#080d14] hover:bg-[#00a8bb] transition-colors"
                >
                  Search
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {['BBCA', 'BREN', 'ADRO', 'AMMN', 'TLKM'].map((ticker) => (
                  <button
                    key={ticker}
                    type="button"
                    onClick={() => {
                      setQuery(ticker);
                      setMode('company');
                    }}
                    className="px-3 py-1 rounded-full border border-[#1d3245] bg-[#122230] text-xs text-gray-300 hover:bg-[#1a2f42] hover:text-white transition-colors"
                  >
                    {ticker}
                  </button>
                ))}
              </div>
            </form>

            {tracedCandidates.length > 0 && status === 'success' && (
              <div className="w-full mb-4 rounded-xl border border-[#1d3245] bg-[#0c1824] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#a87ffb] tracking-wider uppercase">
                    Trace candidates
                  </span>
                  <button
                    onClick={handleVerify}
                    disabled={verifying || tracedCandidates.length === 0}
                    className="text-xs font-medium text-[#00c3d9] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : `Verify ${tracedCandidates.length} candidate${tracedCandidates.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
                {tracedCandidates.length > 0 && (
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>{confirmedCount} confirmed</span>
                    <span className="text-gray-600">·</span>
                    <span>{tracedCandidates.length - confirmedCount} pending</span>
                  </div>
                )}
              </div>
            )}

            <div className="w-full">
              {status === 'loading' && <LoadingSpinner label="Searching..." />}
              {status === 'error' && (
                <ErrorState message={error || 'Search failed. Please try again.'} onRetry={handleSearch} />
              )}
              {status === 'empty' && <EmptyState message="No results found. Try a different search term." />}
              {status === 'success' && results.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                      {results.find((r) => r.type === 'candidate') ? 'Trace candidates' : 'Results'} ({results.length})
                    </span>
                    {results.some((r) => r.type === 'candidate') && (
                      <span className="text-[10px] text-gray-600">Click → to trace | Enter to open</span>
                    )}
                  </div>
                  {results.map((item) => (
                    <ResultCard
                      key={`${item.type}-${item.ticker}`}
                      item={item}
                      onSelect={handleSelect}
                      onTrace={handleTrace}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-8 h-fit shadow-2xl">
            <h3 className="text-[11px] font-bold text-[#00c3d9] tracking-wider mb-8">
              INVESTIGATION FLOW
            </h3>

            <div className="relative flex flex-col gap-8">
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#1d3245]" />

              {[
                { num: '01', title: 'Map', desc: 'See reported ownership' },
                { num: '02', title: 'Inspect', desc: 'Open raw entity details' },
                { num: '03', title: 'Trace', desc: 'Verify cross-company links' },
                { num: '04', title: 'Context', desc: 'Read float & composition' },
              ].map((step) => (
                <div key={step.num} className="relative flex items-start gap-6">
                  <div className="w-10 h-10 rounded-full bg-[#122a3d] text-[#00c3d9] flex items-center justify-center text-xs font-semibold z-10 ring-4 ring-[#0c1824]">
                    {step.num}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-white font-semibold text-lg mb-1">{step.title}</h4>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0c1824] border border-[#1d3245] rounded-xl p-6 mt-auto flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#122a3d] whitespace-nowrap">
            <span className="text-xs font-semibold tracking-wide text-[#b59f77]">DATA BOUNDARY</span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-white font-medium text-base mb-1">
              Ownership is reported by Sectors—not verified beneficial ownership.
            </h4>
            <p className="text-gray-400 text-sm">
              Missing values remain Not available. Affiliate and conglomerate links are context metadata.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
