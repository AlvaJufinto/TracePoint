/**
 * Runtime type guards for TracePoint contracts.
 *
 * These validate that data received from the API matches expected shapes
 * before it enters React state. Protects against server response changes
 * and malformed data.
 *
 * [Verified] contract shapes against live API responses on 2026-09-22.
 */

import type {
  TracePointCompany,
  TracePointOwnershipSnapshot,
  TracePointShareholder,
  TracePointScreenerResponse,
  TracePointFreeFloat,
  TracePointComposition,
  TracePointCorporateActions,
  TraceVerification,
} from '../types/tracepoint';

// ---------------------------------------------------------------------------
// Company guard
// ---------------------------------------------------------------------------

export function isTracePointCompany(data: unknown): data is TracePointCompany {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.ticker !== 'string') return false;
  if (typeof d.name !== 'string') return false;
  // All other fields are optional
  return true;
}

// ---------------------------------------------------------------------------
// Ownership snapshot guard
// ---------------------------------------------------------------------------

function isTracePointShareholder(data: unknown): data is TracePointShareholder {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.name !== 'string') return false;
  if (typeof d.shareValue !== 'number') return false;
  if (typeof d.shareAmount !== 'number') return false;
  if (typeof d.sharePercentage !== 'number') return false;
  // symbol is optional
  return true;
}

export function isTracePointOwnershipSnapshot(data: unknown): data is TracePointOwnershipSnapshot {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.ticker !== 'string') return false;
  if (typeof d.companyName !== 'string') return false;
  if (!Array.isArray(d.holders)) return false;
  for (const h of d.holders) {
    if (!isTracePointShareholder(h)) return false;
  }
  // whaleInvestors and conglomeratesGroup can be null or array
  if (d.whaleInvestors !== null && d.whaleInvestors !== undefined && !Array.isArray(d.whaleInvestors)) return false;
  if (d.conglomeratesGroup !== null && d.conglomeratesGroup !== undefined && !Array.isArray(d.conglomeratesGroup)) return false;
  if (d.asOf !== null) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Screener response guard
// ---------------------------------------------------------------------------

export function isTracePointScreenerResponse(data: unknown): data is TracePointScreenerResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.results)) return false;
  for (const r of d.results) {
    if (typeof r.ticker !== 'string') return false;
    if (typeof r.companyName !== 'string') return false;
  }
  if (typeof d.totalCount !== 'number') return false;
  if (typeof d.hasMore !== 'boolean') return false;
  if (typeof d.nextOffset !== 'number' && d.nextOffset !== null) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Free float guard
// ---------------------------------------------------------------------------

export function isTracePointFreeFloat(data: unknown): data is TracePointFreeFloat {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.ticker !== 'string') return false;
  if (typeof d.companyName !== 'string') return false;
  if (typeof d.freeFloat !== 'number') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Composition guard
// ---------------------------------------------------------------------------

export function isTracePointComposition(data: unknown): data is TracePointComposition {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.ticker !== 'string') return false;
  if (typeof d.year !== 'number') return false;
  if (!Array.isArray(d.snapshots)) return false;
  // latestSnapshot can be null
  if (d.latestSnapshot !== null && typeof d.latestSnapshot !== 'object') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Corporate actions guard — permissive, API shapes vary
// ---------------------------------------------------------------------------

export function isTracePointCorporateActions(data: unknown): data is TracePointCorporateActions {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.ticker !== 'string') return false;
  // All action fields are optional/null — just check ticker is present
  return true;
}

// ---------------------------------------------------------------------------
// Trace verification guard
// ---------------------------------------------------------------------------

export function isTraceVerification(data: unknown): data is TraceVerification {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.status !== 'string') return false;
  if (typeof d.screenerName !== 'string') return false;
  if (typeof d.ticker !== 'string') return false;

  if (d.status === 'confirmed') {
    if (typeof d.ownershipName !== 'string') return false;
  }

  return true;
}
