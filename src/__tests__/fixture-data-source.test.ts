import assert from 'node:assert/strict';
import {
  getCompanyOverview,
  getCompanyOwnership,
  getCompanyManagement,
  getFreeFloat,
  getShareholderComposition,
  getCorporateActions,
  searchCompanies,
} from '../lib/tracepoint-api';

(globalThis as typeof globalThis & { __TRACEPOINT_DATA_SOURCE__?: string })
  .__TRACEPOINT_DATA_SOURCE__ = 'fixtures';

let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error('Fixture mode must not call the network');
}) as typeof fetch;

const search = await searchCompanies('BBCA', { limit: 20 });
assert.equal(search.results.length, 1);
assert.equal(search.results[0].ticker, 'BBCA.JK');

const [overview, ownership, management, freeFloat, composition, actions] = await Promise.all([
  getCompanyOverview('BBCA.JK'),
  getCompanyOwnership('BBCA.JK'),
  getCompanyManagement('BBCA.JK'),
  getFreeFloat('BBCA.JK'),
  getShareholderComposition('BBCA.JK'),
  getCorporateActions('BBCA.JK'),
]);

assert.equal(overview.ticker, 'BBCA.JK');
assert.equal(ownership.ticker, 'BBCA.JK');
assert.equal(management.ticker, 'BBCA.JK');
assert.equal(freeFloat.freeFloat, 0.45058);
assert.equal(composition.ticker, 'BBCA.JK');
assert.equal(actions.ticker, 'BBCA.JK');
assert.equal(fetchCalls, 0);

console.log('✓ BBCA search and detail use JSON fixtures without network calls');
