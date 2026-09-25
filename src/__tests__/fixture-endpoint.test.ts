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

console.log('✓ development fixture endpoint returns BBCA JSON data');
