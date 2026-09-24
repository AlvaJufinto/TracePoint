import { Link } from 'react-router-dom';
import { Search, Building2, GitBranch } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl py-6 sm:py-12">
      <div className="text-center">
        <h1 className="flex justify-center text-[var(--color-primary)]">
          <BrandLogo className="text-4xl sm:text-5xl" />
        </h1>

        <p className="mt-4 text-lg text-[var(--color-muted)] leading-relaxed max-w-xl mx-auto">
          Understand ownership relationships across Indonesian listed companies.
          Search a company, inspect its shareholders, and trace connections across the market.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-8 py-3 text-base font-bold text-[var(--color-primary)] transition-opacity hover:opacity-85"
          >
            <Search size={18} />
            Search Now
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white p-4">
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
            Find candidate companies, then check for exact shareholder names in ownership reports.
          </p>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-[var(--color-muted)]">
        Data is reported by Sectors. Ownership percentages are as reported and may not sum to 100%.
      </div>
    </div>
  );
}
