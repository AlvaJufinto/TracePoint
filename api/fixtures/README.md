# TracePoint fixtures

Fixture data untuk local development dan UI testing tanpa request rutin ke Sectors API. Detail company workspace tetap berfokus pada `BBCA.JK`; trace shareholder Dwimuria mencakup relasi terverifikasi ke `SSIA.JK` dan `TOWR.JK`.

## Files

- `tracepoint-fixtures.json` — data BBCA dalam kontrak internal TracePoint.
- `raw/company-report-BBCA.json` — raw overview, ownership, dan management.
- `raw/shareholders-composition-BBCA.json` — raw komposisi pemegang saham.
- `raw/corporate-actions-BBCA.json` — raw corporate actions.
- `raw/shareholder-trace-pt-dwimuria-investama-andalan.json` — capture pencarian dan ownership-only verification untuk trace lintas perusahaan.

## Coverage

- Company overview
- Ownership dan seluruh major shareholders yang dikembalikan API
- Management dan executive shareholdings
- Shareholder composition
- Corporate actions
- Pencarian ticker BBCA dan empty state
- Verifikasi PT Dwimuria Investama Andalan di BBCA, SSIA, dan TOWR

Free float `0.45058` berasal dari capture terdokumentasi 2026-09-22. Endpoint tersebut tidak dipanggil ulang karena biayanya 10 kredit.

Capture trace Dwimuria pada 2026-09-29 menggunakan tiga request live: satu structured screener query dan dua company-report ownership sections. BBCA menggunakan fixture yang sudah ada. Estimasi biaya tambahan: 3 kredit berdasarkan tarif Sectors (1 kredit per structured query/section).

## Validation

```bash
npx tsx src/__tests__/fixtures-contract.test.ts
```

API key tidak disimpan dalam fixture atau raw response.
