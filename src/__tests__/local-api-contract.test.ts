/**
 * Local integration contract for Trace page APIs.
 * Requires the local full-stack server on http://127.0.0.1:3000.
 *
 * Run: npx tsx src/__tests__/local-api-contract.test.ts
 */

import assert from 'node:assert/strict';
import {
  isTracePointComposition,
  isTracePointCorporateActions,
  isTracePointFreeFloat,
  isTracePointOwnershipSnapshot,
} from '../lib/guards';

const base = 'http://127.0.0.1:3000';

async function get(path: string): Promise<unknown> {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path} should return HTTP 200`);
  return response.json();
}

const ownership = await get('/api/company-ownership?ticker=BBCA.JK');
assert.ok(
  isTracePointOwnershipSnapshot(ownership),
  'ownership response must match TracePointOwnershipSnapshot',
);

const freeFloat = await get('/api/company-free-float?ticker=BBCA.JK');
assert.ok(isTracePointFreeFloat(freeFloat), 'free-float response must match TracePointFreeFloat');

const composition = await get('/api/company-composition?ticker=BBCA.JK');
assert.ok(
  isTracePointComposition(composition),
  'composition response must match TracePointComposition',
);
const latestComposition = (composition as {
  latestSnapshot: {
    local: { total: number };
    foreign: { total: number };
  } | null;
}).latestSnapshot;
assert.ok(latestComposition, 'composition must include the latest BBCA snapshot');
assert.ok(latestComposition.local.total > 0, 'local ownership total must be mapped');
assert.ok(latestComposition.foreign.total > 0, 'foreign ownership total must be mapped');

const corporateActions = await get('/api/company-corporate-actions?ticker=BBCA.JK');
assert.ok(
  isTracePointCorporateActions(corporateActions),
  'corporate-actions response must match TracePointCorporateActions',
);
const actions = corporateActions as {
  dividends: Array<{ exDate: string; dividendAmount: number }>;
  stockSplits: Array<{ date: string; splitRatio: number }>;
};
assert.equal(typeof actions.dividends[0]?.exDate, 'string');
assert.equal(typeof actions.dividends[0]?.dividendAmount, 'number');
assert.equal(typeof actions.stockSplits[0]?.splitRatio, 'number');

console.log('✓ Trace page API responses match frontend contracts');
