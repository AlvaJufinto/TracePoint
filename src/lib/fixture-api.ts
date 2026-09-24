import fixtureData from '../../api/fixtures/tracepoint-fixtures.json';
import type {
  TraceCandidate,
  TracePointCompany,
  TracePointComposition,
  TracePointCorporateActions,
  TracePointFreeFloat,
  TracePointManagement,
  TracePointOwnershipSnapshot,
  TracePointScreenerResponse,
  TraceVerification,
} from '../types/tracepoint';

interface FixtureCompanyData {
  overview: TracePointCompany;
  ownership: TracePointOwnershipSnapshot;
  management: TracePointManagement;
  freeFloat: TracePointFreeFloat;
  composition: TracePointComposition;
  corporateActions: TracePointCorporateActions;
}

const companies = fixtureData.companies as unknown as Record<string, FixtureCompanyData>;

function normalizeTicker(ticker: string): string {
  const normalized = ticker.trim().toUpperCase();
  return normalized.endsWith('.JK') ? normalized : `${normalized}.JK`;
}

function getCompanyFixture(ticker: string): FixtureCompanyData {
  const normalized = normalizeTicker(ticker);
  const company = companies[normalized];
  if (!company) throw new Error(`No JSON fixture available for ${normalized}`);
  return company;
}

export function fixturesEnabled(): boolean {
  const override = (globalThis as typeof globalThis & {
    __TRACEPOINT_DATA_SOURCE__?: string;
  }).__TRACEPOINT_DATA_SOURCE__;

  if (override) return override !== 'live';
  return import.meta.env?.VITE_DATA_SOURCE !== 'live';
}

export function getFixtureCompanyOverview(ticker: string): TracePointCompany {
  return getCompanyFixture(ticker).overview;
}

export function getFixtureCompanyOwnership(ticker: string): TracePointOwnershipSnapshot {
  return getCompanyFixture(ticker).ownership;
}

export function getFixtureCompanyManagement(ticker: string): TracePointManagement {
  return getCompanyFixture(ticker).management;
}

export function getFixtureFreeFloat(ticker: string): TracePointFreeFloat {
  return getCompanyFixture(ticker).freeFloat;
}

export function getFixtureComposition(ticker: string): TracePointComposition {
  return getCompanyFixture(ticker).composition;
}

export function getFixtureCorporateActions(ticker: string): TracePointCorporateActions {
  return getCompanyFixture(ticker).corporateActions;
}

export function searchFixtureCompanies(query: string): TracePointScreenerResponse {
  const normalizedQuery = query.trim().toLowerCase().replace(/\.jk$/, '');
  const results = Object.values(companies)
    .filter(({ overview }) => {
      const ticker = overview.ticker.toLowerCase().replace(/\.jk$/, '');
      return ticker.includes(normalizedQuery) || overview.name.toLowerCase().includes(normalizedQuery);
    })
    .map(({ overview }) => ({ ticker: overview.ticker, companyName: overview.name }));

  return {
    results,
    totalCount: results.length,
    hasMore: false,
    nextOffset: null,
  };
}

export function searchFixtureByShareholderName(name: string): TracePointScreenerResponse {
  const normalizedName = name.trim().toLowerCase();
  const results = Object.values(companies)
    .filter(({ ownership }) => ownership.holders.some((holder) =>
      holder.name.toLowerCase().includes(normalizedName),
    ))
    .map(({ overview }) => ({ ticker: overview.ticker, companyName: overview.name }));

  return {
    results,
    totalCount: results.length,
    hasMore: false,
    nextOffset: null,
  };
}

export function verifyFixtureCandidates(candidates: TraceCandidate[], maxBatch = 5): {
  results: TraceVerification[];
  processed: number;
  limited: boolean;
  maxBatch: number;
} {
  const batch = candidates.slice(0, maxBatch);
  const results = batch.map((candidate): TraceVerification => {
    const company = companies[normalizeTicker(candidate.ticker)];
    if (!company) {
      return { status: 'not_found', ticker: candidate.ticker, screenerName: candidate.screenerName };
    }

    const normalizedName = candidate.screenerName.trim().toLowerCase();
    const holder = company.ownership.holders.find(
      (item) => item.name.trim().toLowerCase() === normalizedName,
    );

    if (!holder) {
      return { status: 'not_found', ticker: candidate.ticker, screenerName: candidate.screenerName };
    }

    return {
      status: 'confirmed',
      ticker: candidate.ticker,
      screenerName: candidate.screenerName,
      ownershipName: holder.name,
      sharePercentage: holder.sharePercentage,
      shareAmount: holder.shareAmount,
    };
  });

  return {
    results,
    processed: batch.length,
    limited: candidates.length > batch.length,
    maxBatch,
  };
}
