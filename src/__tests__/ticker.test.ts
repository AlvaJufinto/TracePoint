/**
 * Tests for ticker normalization.
 *
 * Run: npx tsx src/__tests__/ticker.test.ts
 */

function normalizeTicker(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  if (cleaned.endsWith('.JK')) return cleaned;
  return `${cleaned}.JK`;
}

function isValidTicker(raw: string): boolean {
  const normalized = normalizeTicker(raw);
  // Only 2-5 letter tickers are valid Indonesian stock tickers
  const tickerOnly = normalized.replace(/\.JK$/, '');
  return /^[A-Z]{2,5}$/.test(tickerOnly);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    console.log(`  ✗ ${message}`);
    process.exit(1);
  }
}

function assertEq(actual: unknown, expected: unknown, message: string) {
  if (actual === expected) {
    console.log(`  ✓ ${message}`);
  } else {
    console.log(`  ✗ ${message} — expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`);
    process.exit(1);
  }
}

console.log('=== Ticker Normalization Tests ===\n');

console.log('Test 1: normalizeTicker');
assertEq(normalizeTicker('BBCA'), 'BBCA.JK', 'BBCA → BBCA.JK');
assertEq(normalizeTicker('BBCA.JK'), 'BBCA.JK', 'BBCA.JK → BBCA.JK');
assertEq(normalizeTicker('  bbcA  '), 'BBCA.JK', 'Whitespace trimmed and uppercased');
assertEq(normalizeTicker('TLKM.JK'), 'TLKM.JK', 'TLKM.JK already normalized');
assertEq(normalizeTicker('BREN'), 'BREN.JK', 'BREN → BREN.JK');
console.log('');

console.log('Test 2: isValidTicker');
assert(isValidTicker('BBCA'), 'BBCA is valid');
assert(isValidTicker('BBCA.JK'), 'BBCA.JK is valid');
assert(isValidTicker('TLKM.JK'), 'TLKM.JK is valid');
assert(!isValidTicker('B'), 'Single letter is invalid (too short)');
assert(!isValidTicker('TOOLONGMNEMONIC.JK'), '7+ letters invalid');
assert(!isValidTicker(''), 'Empty string is invalid');
assert(isValidTicker('KO'), 'KO normalizes to KO.JK (2 chars is valid)');
assert(isValidTicker('ABC.jk'), 'Lowercase .jk normalizes to ABC.JK (valid)');
console.log('');

console.log('Test 3: Edge cases');
assertEq(normalizeTicker('BBCA.JK'), 'BBCA.JK', 'Already .JK suffix');
assertEq(normalizeTicker('bbca'), 'BBCA.JK', 'Lowercase ticker normalized');
assertEq(normalizeTicker('  BBCA  '), 'BBCA.JK', 'Spaces around ticker');
console.log('');

console.log('Test 4: Verification — exact match');
function verifyScreenerMatch(
  screenerName: string | null | undefined,
  ownershipName: string | null | undefined,
): 'confirmed' | 'mismatch' | 'not_found' {
  if (!screenerName || !screenerName.trim()) return 'mismatch';
  if (!ownershipName || !ownershipName.trim()) return 'mismatch';
  if (screenerName === ownershipName) return 'confirmed';
  // Conservative normalization — preserve legal prefix, case-insensitive
  const normName = (n: string) => n.trim().replace(/\s+/g, ' ').toLowerCase();
  if (normName(screenerName) === normName(ownershipName)) return 'confirmed';
  return 'mismatch';
}

assertEq(
  verifyScreenerMatch('PT Dwimuria Investama Andalan', 'PT Dwimuria Investama Andalan'),
  'confirmed',
  'Exact match → confirmed',
);
console.log('');

console.log('Test 5: Verification — normalized match');
assertEq(
  verifyScreenerMatch('PT DWIMURIA INVESTAMA ANDALAN', 'PT Dwimuria Investama Andalan'),
  'confirmed',
  'Case-insensitive match → confirmed',
);
console.log('');

console.log('Test 6: Verification — mismatch');
assertEq(
  verifyScreenerMatch('PT Dwimuria', 'PT Other Company'),
  'mismatch',
  'Different names → mismatch',
);
console.log('');

console.log('Test 7: Verification — null guard');
assertEq(
  verifyScreenerMatch(null as unknown as string, 'PT Dwimuria Investama Andalan'),
  'mismatch',
  'Null screener name → mismatch',
);
assertEq(
  verifyScreenerMatch('PT Dwimuria', null as unknown as string),
  'mismatch',
  'Null ownership name → mismatch',
);
console.log('');

console.log('Test 8: Verification — empty string guard');
assertEq(
  verifyScreenerMatch('', 'PT Dwimuria'),
  'mismatch',
  'Empty screener name → mismatch',
);
assertEq(
  verifyScreenerMatch('  ', 'PT Dwimuria'),
  'mismatch',
  'Whitespace-only screener name → mismatch',
);
console.log('');

console.log('=== All ticker tests passed ===');
