import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

// Transpile the server modules in memory; all HTTP calls below are mocked.
function moduleUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const keyUrl = moduleUrl(readFileSync('api/_lib/sectors-key.ts', 'utf8'));
const cacheUrl = moduleUrl(readFileSync('api/_lib/cache.ts', 'utf8'));
const fetchUrl = moduleUrl(readFileSync('api/_lib/sectors-fetch.ts', 'utf8')
  .replace('"./sectors-key"', JSON.stringify(keyUrl))
  .replace('"./cache"', JSON.stringify(cacheUrl)));
const { getSectorsApiKey } = await import(keyUrl);
const { sectorsFetch, isApiKeyConfigured } = await import(fetchUrl);
const originalCwd = process.cwd();
const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const directory = mkdtempSync(join(tmpdir(), 'sectors-key-test-'));
try {
  process.chdir(directory);
  process.env.VERCEL = '1';
  process.env.VERCEL_ENV = 'development';
  process.env.SECTORS_API_KEY = 'stale-process-key';
  writeFileSync('.env', 'SECTORS_API_KEY=base-key\n');
  writeFileSync('.env.local', 'SECTORS_API_KEY="local$key"\n');
  assert.equal(getSectorsApiKey(), 'local$key');
  let requests = 0;
  globalThis.fetch = async (url, options) => {
    requests++;
    assert.equal(options.headers.Authorization, 'local$key');
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'manual');
    assert.equal(url.origin, 'https://api.sectors.app');
    assert.equal(url.pathname, '/v2/companies/');
    assert.equal(url.searchParams.get('q'), 'BBCA');
    return new Response(JSON.stringify({ ok: true }));
  };
  assert.deepEqual(await sectorsFetch('/companies/', { q: 'BBCA' }), { ok: true });
  assert.equal(requests, 1);
  const logs = [];
  console.error = (...args) => logs.push(args);
  globalThis.fetch = async () => {
    requests++;
    return new Response('Invalid credential local$key', { status: 401 });
  };
  await assert.rejects(sectorsFetch('/unauthorized/'), (error) =>
    error.status === 401 && error.code === 'UPSTREAM_HTTP_ERROR');
  assert.equal(requests, 2, '401 must not be retried');
  assert.ok(JSON.stringify(logs).includes('Invalid credential [REDACTED]'));
  assert.ok(!JSON.stringify(logs).includes('local$key'));
  globalThis.fetch = async () => new Response(null, {
    status: 307, headers: { Location: 'https://other.example/' },
  });
  await assert.rejects(sectorsFetch('/redirect/'), (error) =>
    error.code === 'UPSTREAM_REDIRECT');
  for (const environment of ['preview', 'production']) {
    process.env.VERCEL_ENV = environment;
    assert.equal(getSectorsApiKey(), 'stale-process-key');
  }
  process.env.VERCEL_ENV = 'development';
  writeFileSync('.env.local', 'SECTORS_API_KEY="  "\n');
  assert.equal(isApiKeyConfigured(), false);
  await assert.rejects(sectorsFetch('/missing-key/'), /not configured/);
  assert.equal(requests, 2);
  rmSync('.env.local');
  assert.equal(getSectorsApiKey(), 'base-key');
  rmSync('.env');
  assert.equal(getSectorsApiKey(), 'stale-process-key');
  console.log('Passed: local precedence, literal key, outgoing header, deployment isolation, missing key, fallbacks');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  process.chdir(originalCwd);
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  for (const file of ['.env', '.env.local']) rmSync(join(directory, file), { force: true });
  rmdirSync(directory);
}
