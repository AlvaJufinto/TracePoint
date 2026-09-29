import type { VercelRequest, VercelResponse } from '@vercel/node';

import fixtureData from './fixtures/tracepoint-fixtures.json';

export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse) {
  const host = String(req.headers.host ?? '');
  const isLocal = host.startsWith('localhost:') || host.startsWith('127.0.0.1:');
  if (!isLocal) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shareholder = String(req.query.shareholder ?? '').trim();
  if (shareholder) {
    const key = `shareholder-${shareholder
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`;
    const searches = fixtureData.searches as Record<string, unknown>;
    const verifications = fixtureData.traceVerifications as Record<string, unknown>;
    const search = searches[key];
    const verification = verifications[key];
    if (!search || !verification) {
      return res.status(404).json({ error: `No trace fixture available for ${shareholder}` });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ search, verification });
  }

  const ticker = String(req.query.ticker ?? 'BBCA.JK').trim().toUpperCase();
  const normalized = ticker.endsWith('.JK') ? ticker : `${ticker}.JK`;
  const company = fixtureData.companies[
    normalized as keyof typeof fixtureData.companies
  ];

  if (!company) {
    return res.status(404).json({ error: `No fixture available for ${normalized}` });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(company);
}
