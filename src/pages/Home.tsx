import { Link } from 'react-router-dom';
import { Search, Building2, GitBranch, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          Ownership relationship explorer
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--color-primary)]">
          TracePoint
        </h1>

        <p className="mt-4 text-lg text-[var(--color-muted)] leading-relaxed max-w-xl mx-auto">
          Understand ownership relationships across Indonesian listed companies.
          Search a company, inspect its shareholders, and trace connections across the market.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-8 py-3 text-base font-bold text-[var(--color-primary)] transition-opacity hover:opacity-85"
          >
            <Search size={18} />
            Search a company
          </Link>

          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span>Try:</span>
            {['BBCA', 'BREN', 'ADRO', 'AMMN', 'TLKM'].map((ticker) => (
              <Link
                key={ticker}
                to={`/search?q=${ticker}`}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-primary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-primary)]"
              >
                {ticker}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10">
            <Search size={20} className="text-[var(--color-primary)]" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[var(--color-primary)]">Search</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Find Indonesian listed companies by ticker or name.
          </p>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10">
            <Building2 size={20} className="text-[var(--color-primary)]" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[var(--color-primary)]">Map</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            See major shareholders, ownership percentages, and relationships.
          </p>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10">
            <GitBranch size={20} className="text-[var(--color-primary)]" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[var(--color-primary)]">Trace</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Follow a shareholder across companies and verify connections.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-6">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="font-semibold text-[var(--color-primary)]">How it works</span>
          <span className="text-[var(--color-muted)]">Search → Inspect ownership → Select shareholder → Trace → Continue investigation</span>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
          >
            Start now
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[var(--color-muted)]">
        Data is reported by Sectors. Ownership percentages are as reported and may not sum to 100%.
      </div>
    </div>
  );
}
