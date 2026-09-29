import assert from 'node:assert/strict';

process.env.VITE_TRACE_DATA_SOURCE = 'fixtures';

const { default: handler } = await import('../../api/fixture-data');

let statusCode = 200;
let payload: unknown;
const request = {
  method: 'GET',
  headers: { host: 'localhost:3000' },
  query: { ticker: 'BBCA.JK' },
};
const response = {
  setHeader() {
    return this;
  },
  status(code: number) {
    statusCode = code;
    return this;
  },
  json(body: unknown) {
    payload = body;
    return this;
  },
};

await handler(request as never, response as never);

assert.equal(statusCode, 200);
const body = payload as {
  overview: { ticker: string };
  ownership: { ticker: string };
};
assert.equal(body.overview.ticker, 'BBCA.JK');
assert.equal(body.ownership.ticker, 'BBCA.JK');

statusCode = 200;
payload = undefined;
await handler({
  method: 'GET',
  headers: { host: 'localhost:3000' },
  query: { shareholder: 'PT Dwimuria Investama Andalan' },
} as never, response as never);

assert.equal(statusCode, 200);
const traceBody = payload as {
  search: { results: Array<{ ticker: string }> };
  verification: { results: Array<{ ticker: string; status: string }> };
};
assert.deepEqual(traceBody.search.results.map((item) => item.ticker), [
  'BBCA.JK',
  'SSIA.JK',
  'TOWR.JK',
]);
assert.ok(traceBody.verification.results.every((item) => item.status === 'confirmed'));

console.log('✓ development fixture endpoint returns company and shareholder trace data');
