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

interface FixtureCompany {
  overview: TracePointCompany;
  ownership: TracePointOwnershipSnapshot;
  management: TracePointManagement;
  freeFloat: TracePointFreeFloat;
  composition: TracePointComposition;
  corporateActions: TracePointCorporateActions;
}

interface FixtureShareholderTrace {
  search: TracePointScreenerResponse;
  verification: TraceVerifyResponse;
}

export interface TraceVerifyRequest {
  candidates: TraceCandidate[];
  maxBatch?: number;
}

export interface TraceVerifyResponse {
  results: TraceVerification[];
  processed: number;
  limited: boolean;
  maxBatch: number;
}

const fixtureRequests = new Map<string, Promise<FixtureCompany>>();
const traceFixtureRequests = new Map<string, Promise<FixtureShareholderTrace | null>>();

function normalizeTicker(ticker: string): string {
  const normalized = ticker.trim().toUpperCase();
  return normalized.endsWith('.JK') ? normalized : `${normalized}.JK`;
}

function companyFor(ticker: string): Promise<FixtureCompany> {
  const normalized = normalizeTicker(ticker);
  const cached = fixtureRequests.get(normalized);
  if (cached) return cached;

  const request = fetch(`/api/fixture-data?ticker=${encodeURIComponent(normalized)}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`No JSON fixture available for ${normalized}`);
      }
      return response.json() as Promise<FixtureCompany>;
    })
    .catch((error) => {
      fixtureRequests.delete(normalized);
      throw error;
    });

  fixtureRequests.set(normalized, request);
  return request;
}

function traceFor(shareholderName: string): Promise<FixtureShareholderTrace | null> {
  const normalized = shareholderName.trim().toLowerCase();
  const cached = traceFixtureRequests.get(normalized);
  if (cached) return cached;

  const request = fetch(
    `/api/fixture-data?shareholder=${encodeURIComponent(shareholderName.trim())}`,
  )
    .then(async (response) => {
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Unable to load trace fixture for ${shareholderName.trim()}`);
      }
      return response.json() as Promise<FixtureShareholderTrace>;
    })
    .catch((error) => {
      traceFixtureRequests.delete(normalized);
      throw error;
    });

  traceFixtureRequests.set(normalized, request);
  return request;
}

export async function getCompanyOverview(ticker: string): Promise<TracePointCompany> {
  return (await companyFor(ticker)).overview;
}

export async function getCompanyOwnership(ticker: string): Promise<TracePointOwnershipSnapshot> {
  return (await companyFor(ticker)).ownership;
}

export async function getCompanyManagement(ticker: string): Promise<TracePointManagement> {
  return (await companyFor(ticker)).management;
}

export async function getFreeFloat(ticker: string): Promise<TracePointFreeFloat> {
  return (await companyFor(ticker)).freeFloat;
}

export async function getShareholderComposition(ticker: string): Promise<TracePointComposition> {
  return (await companyFor(ticker)).composition;
}

export async function getCorporateActions(ticker: string): Promise<TracePointCorporateActions> {
  return (await companyFor(ticker)).corporateActions;
}

export async function searchByShareholderName(
  shareholderName: string,
  limit = 50,
  _signal?: AbortSignal,
): Promise<TracePointScreenerResponse> {
  void _signal;
  const trace = await traceFor(shareholderName);
  if (!trace) {
    return { results: [], totalCount: 0, hasMore: false, nextOffset: null };
  }

  const results = trace.search.results.slice(0, limit);
  return {
    results,
    totalCount: trace.search.totalCount,
    hasMore: trace.search.totalCount > results.length,
    nextOffset:
      trace.search.totalCount > results.length
        ? results.length
        : trace.search.nextOffset,
  };
}

export async function verifyTraceCandidates(
  request: TraceVerifyRequest,
  _signal?: AbortSignal,
): Promise<TraceVerifyResponse> {
  void _signal;
  const maxBatch = request.maxBatch ?? 5;
  const batch = request.candidates.slice(0, maxBatch);
  const shareholderName = batch[0]?.screenerName ?? '';
  const trace = shareholderName ? await traceFor(shareholderName) : null;
  const results = batch.map((candidate): TraceVerification => {
    const captured = trace?.verification.results.find(
      (item) => item.ticker === normalizeTicker(candidate.ticker),
    );
    return captured ?? {
      status: 'not_found',
      ticker: candidate.ticker,
      screenerName: candidate.screenerName,
    };
  });

  return {
    results,
    processed: batch.length,
    limited: request.candidates.length > batch.length,
    maxBatch,
  };
}
