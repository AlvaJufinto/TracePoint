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
  _limit = 50,
  _signal?: AbortSignal,
): Promise<TracePointScreenerResponse> {
  void _limit;
  void _signal;
  const company = await companyFor('BBCA.JK');
  const normalizedName = shareholderName.trim().toLowerCase();
  const hasMatch = company.ownership.holders.some((holder) =>
    holder.name.toLowerCase().includes(normalizedName),
  );
  const results = hasMatch
    ? [{ ticker: company.overview.ticker, companyName: company.overview.name }]
    : [];

  return {
    results,
    totalCount: results.length,
    hasMore: false,
    nextOffset: null,
  };
}

export async function verifyTraceCandidates(
  request: TraceVerifyRequest,
  _signal?: AbortSignal,
): Promise<TraceVerifyResponse> {
  void _signal;
  const maxBatch = request.maxBatch ?? 5;
  const batch = request.candidates.slice(0, maxBatch);
  const results = await Promise.all(batch.map(async (candidate): Promise<TraceVerification> => {
    let company: FixtureCompany;
    try {
      company = await companyFor(candidate.ticker);
    } catch {
      return {
        status: 'not_found',
        ticker: candidate.ticker,
        screenerName: candidate.screenerName,
      };
    }

    const expectedName = candidate.screenerName.trim().toLowerCase();
    const holder = company.ownership.holders.find(
      (item) => item.name.trim().toLowerCase() === expectedName,
    );
    if (!holder) {
      return {
        status: 'not_found',
        ticker: candidate.ticker,
        screenerName: candidate.screenerName,
      };
    }

    return {
      status: 'confirmed',
      ticker: candidate.ticker,
      screenerName: candidate.screenerName,
      ownershipName: holder.name,
      sharePercentage: holder.sharePercentage,
      shareAmount: holder.shareAmount,
    };
  }));

  return {
    results,
    processed: batch.length,
    limited: request.candidates.length > batch.length,
    maxBatch,
  };
}
