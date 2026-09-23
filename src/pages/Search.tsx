import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, AlertCircle, Building2, User } from 'lucide-react';
import { searchCompanies, searchByShareholderName, getCompanyOverview } from '../lib/tracepoint-api';

type SearchMode = 'company' | 'shareholder';

interface SearchResultItem {
  ticker: string;
  companyName: string;
  type: 'company' | 'candidate';
  verification?: {
    status: 'confirmed' | 'mismatch' | 'not_found';
    screenerName: string;
    ownershipName?: string;
    ticker: string;
  };
}

function normalizeTickerInput(value: string): string {
  return value.trim().toUpperCase().replace(/\.JK$/, '');
}

function classifyQuery(value: string): 'ticker' | 'name' {
  const cleaned = value.trim().toUpperCase().replace(/\.JK$/, '');
  if (/^[A-Z]{2,5}$/.test(cleaned)) return 'ticker';
  return 'name';
}

function ResultCard({
  item,
  onSelect,
  onTrace,
}: {
  item: SearchResultItem;
  onSelect: (ticker: string) => void;
  onTrace: (ticker: string) => void;
}) {
  const isCandidate = item.type === 'candidate';

  return (
    <div
      className={`rounded-[var(--radius-sm)] border p-4 transition-colors cursor-pointer ${
        isCandidate
          ? 'border-l-4 border-l-[var(--color-accent)] border-[var(--color-border)] bg-white hover:bg-gray-50'
          : 'border-[var(--color-border)] bg-white hover:bg-gray-50'
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
      aria-label={`Open ${item.ticker} — ${item.companyName}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isCandidate ? 'bg-[var(--color-accent)]/10 text-[var(--color-primary)]' : 'bg-gray-100 text-[var(--color-primary)]'
            }`}
          >
            {isCandidate ? <User size={16} /> : <Building2 size={16} />}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm font-medium text-[var(--color-primary)]">
              {item.ticker}
            </div>
            <div className="text-sm text-[var(--color-muted)] truncate">
              {item.companyName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCandidate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTrace(item.ticker);
              }}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-opacity hover:opacity-80"
              title="Trace this shareholder"
              aria-label={`Trace shareholder in ${item.ticker}`}
            >
              Trace
              <ArrowRight size={12} />
            </button>
          )}
          {!isCandidate && (
            <ArrowRight size={16} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-[var(--color-muted)]">
      <Loader2 size={20} className="animate-spin text-[var(--color-accent)]" />
      <span className="text-sm">{label || 'Loading...'}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle size={32} className="text-gray-400" />
      <span className="text-sm text-[var(--color-muted)] max-w-md">{message}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle size={32} className="text-[var(--color-error)]" />
      <span className="text-sm text-[var(--color-muted)] max-w-md">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium text-[var(--color-accent)] hover:underline mt-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

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

  useEffect(() => {
    if (initialQuery && status === 'idle') {
      const fakeEvent = { preventDefault: () => {} } as FormEvent;
      handleSearch(fakeEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function handleTrace(ticker: string) {
    const normalizedName = query.trim().replace(/\s+/g, ' ').toLowerCase();
    navigate(`/trace?shareholder=${encodeURIComponent(normalizedName)}&ticker=${encodeURIComponent(ticker)}`);
  }

  function handleSelect(ticker: string) {
    navigate(`/trace?ticker=${encodeURIComponent(ticker)}`);
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
          Search companies
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Find Indonesian listed companies by ticker, name, or search by shareholder.
        </p>
      </div>

      <form onSubmit={(e) => handleSearch(e)} className="mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-1 self-start">
            <button
              type="button"
              onClick={() => setMode('company')}
              className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'company'
                  ? 'bg-[var(--color-primary)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
              }`}
            >
              Company
            </button>
            <button
              type="button"
              onClick={() => setMode('shareholder')}
              className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'shareholder'
                  ? 'bg-[var(--color-primary)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
              }`}
            >
              Shareholder
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'company'
                  ? 'Search by ticker (BBCA) or company name...'
                  : 'Search by shareholder name (PT Dwimuria)...'
              }
              className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-primary)] placeholder-gray-400 focus:border-[var(--color-accent)] focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-6 py-3 text-sm font-bold text-[var(--color-primary)] hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
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
              className="px-3 py-1 rounded-full border border-[var(--color-border)] bg-white text-xs text-[var(--color-muted)] hover:bg-gray-50 hover:text-[var(--color-primary)] transition-colors"
            >
              {ticker}
            </button>
          ))}
        </div>
      </form>

      <div className="mb-6 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-4">
        <div className="text-xs text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-primary)]">How it works:</span>{' '}
          Search → Inspect ownership → Select shareholder → Trace → Continue investigation
        </div>
      </div>

      <div>
        {status === 'loading' && <LoadingSpinner label="Searching..." />}
        {status === 'error' && (
          <ErrorState message={error || 'Search failed. Please try again.'} onRetry={handleSearch} />
        )}
        {status === 'empty' && <EmptyState message="No results found. Try a different search term." />}
        {status === 'success' && results.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                {results.find((r) => r.type === 'candidate') ? 'Companies with this shareholder' : 'Results'} ({results.length})
              </span>
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
        {status === 'idle' && (
          <div className="text-center py-12 text-sm text-[var(--color-muted)]">
            Enter a ticker or company name to search.
          </div>
        )}
      </div>
    </div>
  );
}
