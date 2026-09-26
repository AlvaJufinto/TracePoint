import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sectorsFetch, isValidTicker } from './_lib/sectors-fetch.js';
import { checkTraceLimit, errorResponse, getClientIp, successResponse, isNonTraceableShareholder } from './_lib/server.js';
import type { TraceCandidate, TraceVerification } from '../src/types/tracepoint.js';

export const config = { runtime: 'nodejs' };
const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return errorResponse(res, 405, 'Method not allowed');
  const candidates = req.body?.candidates;
  if (!Array.isArray(candidates) || !candidates.length || candidates.length > 200 ||
    candidates.some(c => !c || typeof c.ticker !== 'string' || !isValidTicker(c.ticker) ||
      typeof c.screenerName !== 'string' || !c.screenerName.trim() || c.screenerName.length > 300 || isNonTraceableShareholder(c.screenerName))) {
    return errorResponse(res, 400, 'Valid candidate tickers and shareholder names are required');
  }
  // A server-owned cap is applied before any upstream request.
  const limit = checkTraceLimit(getClientIp(req), 5);
  if (!limit.allowed) return errorResponse(res, 429, 'Too many trace requests. Please try again later.');
  const unique: TraceCandidate[] = [...new Map(candidates.map(c => [c.ticker, c])).values()] as TraceCandidate[];
  const batch = unique.slice(0, limit.limit);
  const results = await Promise.all(batch.map(async (candidate): Promise<TraceVerification> => {
    try {
      const report = await sectorsFetch<{ ownership?: { major_shareholders?: Array<{name: string; share_percentage?: string | number | null; share_amount?: number | null}> } }>(
        `company/report/${candidate.ticker}`, { sections: 'ownership' });
      const match = report.ownership?.major_shareholders?.find(holder => normalizeName(holder.name) === normalizeName(candidate.screenerName));
      return match ? {
        status: 'confirmed', ticker: candidate.ticker, screenerName: candidate.screenerName, ownershipName: match.name,
        sharePercentage: match.share_percentage == null || match.share_percentage === '' || !Number.isFinite(Number(match.share_percentage)) ? null : Number(match.share_percentage),
        shareAmount: match.share_amount ?? null,
      } : { status: 'mismatch', ticker: candidate.ticker, screenerName: candidate.screenerName };
    } catch (error) {
      console.error('Sectors ownership verification failed', {
        ticker: candidate.ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      return { status: 'not_found', ticker: candidate.ticker, screenerName: candidate.screenerName };
    }
  }));
  return successResponse(res, { results, processed: results.length, limited: unique.length > batch.length, maxBatch: limit.limit });
}
