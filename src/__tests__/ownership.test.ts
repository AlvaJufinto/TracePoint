/**
 * Tests for ownership mapping and null handling.
 *
 * Run: npx tsx src/__tests__/ownership.test.ts
 */

let pass = 0;
let fail = 0;

function assert(condition: boolean, message: string, expected?: unknown, actual?: unknown) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    pass++;
  } else {
    console.log(`  ✗ ${message}${actual !== undefined ? ` — got: ${JSON.stringify(actual)}` : ''}`);
    if (expected !== undefined && actual !== undefined) {
      console.log(`       expected: ${JSON.stringify(expected)}`);
    }
    fail++;
  }
}

function assertEq(actual: unknown, expected: unknown, message: string) {
  assert(actual === expected, message, expected, actual);
}

// ---------------------------------------------------------------------------
// share_percentage is a STRING in the API
// ---------------------------------------------------------------------------

console.log('Test 1: share_percentage type check');
const rawBbcaShareholders = [
  { name: 'PT Dwimuria Investama Andalan', share_value: 421618938750000, share_amount: 67729950000, share_percentage: '0.54942' },
  { name: 'Public', share_value: 342570624721050, share_amount: 55031425658, share_percentage: '0.44642' },
];
const sh = rawBbcaShareholders[0];
assert(typeof sh.share_percentage === 'string', 'share_percentage is a string (not number)');
const pct = parseFloat(sh.share_percentage);
assert(Math.abs(pct * 100 - 54.942) < 0.001, `Parsed percentage ~${pct * 100}%`, 54.942, pct * 100);
console.log('');

// ---------------------------------------------------------------------------
// Null field handling — field may be missing entirely
// ---------------------------------------------------------------------------

console.log('Test 2: Null field handling per PRD');

interface ApiSH {
  name: string;
  share_percentage?: string;
}

const snapshots: Record<string, ApiSH[]> = {
  BBCA: [{ name: 'PT Dwimuria', share_percentage: '0.54942' }],
  AMMN: [{ name: 'PT Sumber Gemilang' }],
  TLKM: [{ name: 'PT Danantara' }],
};

assertEq(snapshots.AMMN[0].share_percentage, undefined, 'AMMN shareholder share_percentage is undefined (field absent)');
console.log('');

// ---------------------------------------------------------------------------
// Ownership sum — full BBCA top-of-major list
// ---------------------------------------------------------------------------

console.log('Test 3: Data flow — update "full" BBCA top-of-major list');

const observedBBCA = [
  { name: 'PT Dwimuria Investama Andalan', sharePercentage: 0.54942 },
  { name: 'Public', sharePercentage: 0.44642 },
  { name: 'Treasury Stock', sharePercentage: 0.00351 },
  { name: 'Jahja', sharePercentage: 0.0003 },
];

const parsedBbca = observedBBCA.map((s) => ({
  name: s.name,
  sharePercentage: typeof s.sharePercentage === 'string' ? parseFloat(s.sharePercentage) : s.sharePercentage,
}));

let totalPct = 0;
for (const s of parsedBbca) {
  totalPct += s.sharePercentage;
}
assert(totalPct > 0.9 && totalPct < 1.0, `Aggregated ownership for BBCA: ${(totalPct*100).toFixed(3)}%`, '0.9-1.0', totalPct);
console.log('');

// ---------------------------------------------------------------------------
// Non-traceable shareholders
// ---------------------------------------------------------------------------

console.log('Test 4: Non-traceable identification');

function isNonTraceable(name: string): boolean {
  return name === 'Public' || name === 'Treasury Stock';
}

assert(!isNonTraceable('PT Dwimuria Investama Andalan'), 'PT Dwimuria is traceable');
assert(isNonTraceable('Public'), 'Public is non-traceable');
assert(isNonTraceable('Treasury Stock'), 'Treasury Stock is non-traceable');
console.log('');

// ---------------------------------------------------------------------------
// Optional symbol field
// ---------------------------------------------------------------------------

console.log('Test 5: Optional symbol field');

interface ApiSHWithSymbol {
  name: string;
  share_percentage: string;
  symbol: string | null;
}

const brenShareholder: ApiSHWithSymbol = {
  name: 'PT Barito Pacific Ltd',
  share_percentage: '0.645',
  symbol: 'BRPT.JK',
};

const bbcaShareholder: ApiSHWithSymbol = {
  name: 'PT Dwimuria Investama Andalan',
  share_percentage: '0.54942',
  symbol: null,
};

assertEq(brenShareholder.symbol, 'BRPT.JK', 'Corporate shareholder has ticker symbol');
assertEq(bbcaShareholder.symbol, null, 'Individual shareholder has null symbol');
console.log('');

// ---------------------------------------------------------------------------
// Percentage formatting
// ---------------------------------------------------------------------------

console.log('Test 6: Percentage formatting');

function formatPct(raw: string | null | undefined): string {
  if (!raw) return 'Not available';
  const pct = parseFloat(raw);
  if (isNaN(pct)) return 'Not available';
  return `${(pct * 100).toFixed(3)}%`;
}

assertEq(formatPct('0.54942'), '54.942%', '54.942% for BBCA major');
assertEq(formatPct('0.0003'), '0.030%', 'Minority holder percentage');
assertEq(formatPct(null), 'Not available', 'Null raw returns "Not available"');
console.log('');

// ---------------------------------------------------------------------------
// Trace methodology — mapping "PT Dwimuria" across companies
// ---------------------------------------------------------------------------

console.log('Test 7: Trace methodology — mapping "PT Dwimuria" across companies');

const traceCandidates = [
  { ticker: 'BBCA.JK', companyName: 'PT Bank Central Asia Tbk.', sharePercentage: 0.54942 },
  { ticker: 'SSIA.JK', companyName: 'PT Surya Semesta Internusa Tbk', sharePercentage: 0.1024 },
  { ticker: 'TOWR.JK', companyName: 'Sarana Menara Nusantara Tbk', sharePercentage: 0.19954 },
];

traceCandidates.forEach((c) => {
  assert(c.ticker.endsWith('.JK'), `${c.ticker} has valid .JK suffix`);
  assert(c.sharePercentage > 0 && c.sharePercentage <= 1, `${c.ticker} has valid percentage`);
});

console.log('');
console.log('=== Results ===');
console.log(`  Passed: ${pass}`);
console.log(`  Failed: ${fail}`);
console.log(fail === 0 ? '\n✓ All tests passed' : `\n✗ ${fail} test(s) failed`);
process.exit(fail === 0 ? 0 : 1);
