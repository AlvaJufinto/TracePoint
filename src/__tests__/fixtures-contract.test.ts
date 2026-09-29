import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  isTracePointCompany,
  isTracePointComposition,
  isTracePointCorporateActions,
  isTracePointFreeFloat,
  isTracePointOwnershipSnapshot,
  isTracePointScreenerResponse,
  isTraceVerification,
} from '../lib/guards';

const fixturePath = fileURLToPath(
  new URL('../../api/fixtures/tracepoint-fixtures.json', import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  meta: { source: string; capturedAt: string; liveApiCallsUsed: number };
  companies: Record<string, {
    overview: unknown;
    ownership: unknown;
    management: unknown;
    freeFloat: unknown;
    composition: unknown;
    corporateActions: unknown;
  }>;
  searches: Record<string, unknown>;
  traceVerifications: Record<string, { results: unknown[] }>;
};

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(fixture.meta.source === 'live-sectors-api', 'Fixture provenance must be explicit');
assert(fixture.meta.liveApiCallsUsed === 9, 'Fixture capture request count changed unexpectedly');
assert(/^\d{4}-\d{2}-\d{2}$/.test(fixture.meta.capturedAt), 'capturedAt must be YYYY-MM-DD');

for (const [ticker, company] of Object.entries(fixture.companies)) {
  assert(isTracePointCompany(company.overview), `${ticker}: invalid overview`);
  assert(isTracePointOwnershipSnapshot(company.ownership), `${ticker}: invalid ownership`);
  assert(isTracePointFreeFloat(company.freeFloat), `${ticker}: invalid free float`);
  assert(isTracePointComposition(company.composition), `${ticker}: invalid composition`);
  assert(isTracePointCorporateActions(company.corporateActions), `${ticker}: invalid corporate actions`);

  const management = company.management as Record<string, unknown>;
  assert(management.ticker === ticker, `${ticker}: invalid management ticker`);
  assert(Array.isArray(management.keyExecutives), `${ticker}: invalid key executives`);
  assert(Array.isArray(management.executivesShareholdings), `${ticker}: invalid executive shareholdings`);
}

for (const [name, search] of Object.entries(fixture.searches)) {
  assert(isTracePointScreenerResponse(search), `${name}: invalid screener response`);
}

for (const [name, response] of Object.entries(fixture.traceVerifications)) {
  assert(Array.isArray(response.results), `${name}: verification results must be an array`);
  for (const result of response.results) {
    assert(isTraceVerification(result), `${name}: invalid verification result`);
  }
}

console.log('✓ TracePoint JSON fixtures satisfy runtime contracts');
