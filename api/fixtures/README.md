# TracePoint BBCA fixtures

Fixture data khusus `BBCA.JK` untuk local development dan UI testing tanpa request rutin ke Sectors API.

## Files

- `tracepoint-fixtures.json` — data BBCA dalam kontrak internal TracePoint.
- `raw/company-report-BBCA.json` — raw overview, ownership, dan management.
- `raw/shareholders-composition-BBCA.json` — raw komposisi pemegang saham.
- `raw/corporate-actions-BBCA.json` — raw corporate actions.

## Coverage

- Company overview
- Ownership dan seluruh major shareholders yang dikembalikan API
- Management dan executive shareholdings
- Shareholder composition
- Corporate actions
- Pencarian ticker BBCA dan empty state
- Verifikasi PT Dwimuria Investama Andalan di BBCA

Free float `0.45058` berasal dari capture terdokumentasi 2026-09-22. Endpoint tersebut tidak dipanggil ulang karena biayanya 10 kredit.

## Validation

```bash
npx tsx src/__tests__/fixtures-contract.test.ts
```

API key tidak disimpan dalam fixture atau raw response.
