/**
 * Regression test: Trace data loading must have stable hook dependencies.
 *
 * Run: npx tsx src/__tests__/trace-effect.test.ts
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const tracePath = fileURLToPath(new URL('../pages/Trace.tsx', import.meta.url));
const source = readFileSync(tracePath, 'utf8');

assert.match(
  source,
  /const fetchCompanyData = useCallback\(async \(\) => \{[\s\S]*?\}, \[ticker\]\);/,
  'fetchCompanyData must be memoized by ticker so state updates do not trigger an API request loop',
);

console.log('✓ Trace data loader has stable dependencies');
