/**
 * Regression test: company API calls use the server handlers' `ticker` query.
 *
 * Run: npx tsx src/__tests__/tracepoint-api-urls.test.ts
 */

import assert from 'node:assert/strict';
import {
  getCompanyOwnership,
  getCompanyManagement,
  getFreeFloat,
  getShareholderComposition,
  getCorporateActions,
} from '../lib/tracepoint-api';

const requestedUrls: string[] = [];

globalThis.fetch = (async (input: string | URL | Request) => {
  requestedUrls.push(String(input));
  return new Response('{}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

const calls = [
  getCompanyOwnership('BBCA.JK'),
  getCompanyManagement('BBCA.JK'),
  getFreeFloat('BBCA.JK'),
  getShareholderComposition('BBCA.JK'),
  getCorporateActions('BBCA.JK'),
];

await Promise.allSettled(calls);

assert.deepEqual(requestedUrls, [
  '/api/company-ownership?ticker=BBCA.JK',
  '/api/company-management?ticker=BBCA.JK',
  '/api/company-free-float?ticker=BBCA.JK',
  '/api/company-composition?ticker=BBCA.JK',
  '/api/company-corporate-actions?ticker=BBCA.JK',
]);

console.log('✓ Company API calls use the ticker query parameter');
