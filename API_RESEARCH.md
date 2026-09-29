<!-- @format -->

# TracePoint — Sectors API v2 Research Findings

**Date:** 2026-09-22  
**API Key status:** Available in `.env` (`VITE_SECTORS_API_KEY`) — must be moved server-side  
**Base URL:** `https://api.sectors.app/v2/`  
**Auth:** `Authorization` header with API key.

---

## Environment Variable Problem

The current `.env` uses `VITE_SECTORS_API_KEY`. Vite embeds `VITE_*` variables into the client bundle. This means the Sectors API key would be exposed to every browser user. **This is a security violation.**

**Solution:** Move the key to a server-side `.env` (`SECTORS_API_KEY` without `VITE_` prefix) and proxy all Sectors calls through serverless functions or a Node.js server.

---

## API Response Research Matrix

### 1. Company Report — `GET /v2/company/report/{symbol}/?sections=...`

**Request example:**

```
GET /v2/company/report/BBCA/?sections=overview,ownership,management
Authorization: <api_key>
```

**Response shape (BBCA ownership section):**

```json
{
  "symbol": "BBCA.JK",
  "company_name": "PT Bank Central Asia Tbk.",
  "ownership": {
    "major_shareholders": [
      {
        "name": "PT Dwimuria Investama Andalan",
        "share_value": 421618938750000,
        "share_amount": 67729950000,
        "share_percentage": "0.54942",
        "symbol": null
      },
      {
        "name": "Public",
        "share_value": 342570624721050,
        "share_amount": 55031425658,
        "share_percentage": "0.44642",
        "symbol": null
      },
      ...
    ],
    "top_transactions": { "date": "2026-08-31", ... },
    "institutional_transaction_flow": [...],
    "whale_investors": ["Anthoni Salim"],
    "conglomerates_group": ["Djarum Group"]
  }
}
```

**Important fields:**
| Field | Type | Nullability | Notes |
|-------|------|-------------|-------|
| `symbol` | string | never null | Always `.JK` suffix |
| `company_name` | string | never null | Legal company name |
| `ownership.major_shareholders` | array | never null | Array of shareholder objects |
| `shareholder.name` | string | never null | Shareholder name |
| `shareholder.share_value` | number | never null | IDR value of shares |
| `shareholder.share_amount` | number | never null | Number of shares |
| `shareholder.share_percentage` | **string** | never null | **String decimal, e.g. "0.54942"** |
| `shareholder.symbol` | string\|null | nullable | Ticker of corporate shareholder if applicable |
| `whale_investors` | string[]\|null | nullable | List of whale investor names |
| `conglomerates_group` | string[]\|null | nullable | Conglomerate group names |

**Critical finding 1:** `share_percentage` is a **string**, not a number. Must be parsed.

**Critical finding 2:** `symbol` on shareholders is nullable — only present for corporate shareholders (e.g. `BRPT.JK`).

**Critical finding 3:** No `as_of` date on ownership snapshot. The API does not expose an ownership date.

**Critical finding 4:** `whale_investors` and `conglomerates_group` are **context metadata**, not ownership. Must NOT be rendered as ownership edges.

**Pagination:** Not paginated for individual company report.

**Sections tested:** `overview`, `ownership`, `management` — all confirmed working.

---

### 2. Company Report — Overview section

**Response shape:**

```json
{
  "symbol": "BBCA.JK",
  "company_name": "PT Bank Central Asia Tbk.",
  "overview": {
    "sector": "Financials",
    "sub_sector": "Banks",
    "listing_board": "Main",
    "market_cap": 759713314387500,
    "market_cap_rank": 1,
    "employee_num": 27937,
    "listing_date": "2000-05-31",
    "address": "Menara BCA, Grand Indonesia...",
    "website": "www.bca.co.id",
    "last_close_price": 6225,
    "latest_close_date": "2026-09-21",
    "tags": ["dividend-yield-ttm-above-5-percent", ...],
    "indices": ["LQ45", "IDX30", "KOMPAS100", ...],
    "affiliates": ["Djarum", "Hartono"]
  }
}
```

**Important fields:**
| Field | Type | Notes |
|-------|------|-------|
| `sector` | string | IDX sector classification |
| `sub_sector` | string | IDX sub-sector |
| `market_cap` | number | IDR |
| `tags` | string[] | Analyst tags |
| `indices` | string[] | Index memberships |
| `affiliates` | string[] | **Context metadata only — NOT ownership** |

**Critical finding:** `affiliates` lists conglomerate family names (e.g. "Djarum", "Hartono"), not company tickers. These must not be treated as ownership.

---

### 3. Company Report — Management section

**Response shape:**

```json
{
  "management": {
    "key_executives": [
      { "name": "Gregory Hendra Lembong", "position": "President Director" },
      ...
    ],
    "executives_shareholdings": [
      { "name": "Armand Wahyudi Hartono", "position": "Vice President Director", "share_amount": 4256065, "share_percentage": 3e-05 },
      ...
    ]
  }
}
```

**Important fields:**
| Field | Type | Notes |
|-------|------|-------|
| `key_executives` | array | Management team |
| `executives_shareholdings` | array | Directors' shareholdings |
| `share_percentage` (in executives) | number | **Number, not string** — inconsistent with major_shareholders |

**Critical finding:** `share_percentage` in executives is a number, in major_shareholders it's a string. Must handle both types.

---

### 4. Screener — `GET /v2/companies/?q=...` or `?where=...`

**Request examples:**

```
GET /v2/companies/?q=PT Dwimuria Investama Andalan&limit=5
GET /v2/companies/?where=major_shareholders_name like '%Dwimuria%'&limit=5
```

**Response shape:**

```json
{
	"results": [
		{ "symbol": "BBCA.JK", "company_name": "PT Bank Central Asia Tbk." },
		{ "symbol": "SSIA.JK", "company_name": "PT Surya Semesta Internusa Tbk" },
		{ "symbol": "TOWR.JK", "company_name": "Sarana Menara Nusantara Tbk" }
	],
	"pagination": {
		"total_count": 3,
		"showing": 3,
		"limit": 5,
		"offset": 0,
		"has_next": false
	}
}
```

**Query modes:**

- `q`: Natural language — translates to `where` internally (shown in `llm_translation`)
- `where`: SQL-like filtering with operators `=`, `!=`, `>`, `<`, `like`, `in`

**Critical finding:** `major_shareholders_name` works as a filter field for trace searches. Searching `major_shareholders_name like '%Dwimuria%'` returns BBCA, SSIA, TOWR — exactly matching the PRD trace case.

**Pagination:** Standard `limit`/`offset` with `has_next`.

**Field tested:** `major_shareholders_name like` — confirmed working for shareholder name search.

---

### 5. Free Float — `GET /v2/free-float/`

**Request example:**

```
GET /v2/free-float/
Authorization: <api_key>
```

**Response shape:**

```json
[
  { "symbol": "BBCA.JK", "company_name": "PT Bank Central Asia Tbk.", "free_float": 0.45058 },
  { "symbol": "BBRI.JK", "company_name": "...", "free_float": 0.4676 },
  ...
]
```

**Important fields:**
| Field | Type | Notes |
|-------|------|-------|
| `symbol` | string | `.JK` ticker |
| `free_float` | number | Decimal, e.g. 0.45058 = 45.058% |

**Critical finding:** This endpoint returns a **flat array of ALL companies**, not filterable by symbol in the query. Must filter client-side by ticker. The response is large (all ~900+ IDX companies).

**No query parameters accepted** for filtering by symbol. Only accept `?limit`, `?offset`, `?sector`, `?industry`, etc.

**BBCA free float observed:** 0.45058 (45.058%) — matches PRD mock.

---

### 6. Shareholder Composition — `GET /v2/company/shareholders-composition/{symbol}/`

**Request example:**

```
GET /v2/company/shareholders-composition/BBCA.JK/
Authorization: <api_key>
```

**Response shape:**

```json
{
  "symbol": "BBCA.JK",
  "year": 2026,
  "data": [
    {
      "date": "2026-08-31",
      "shares_number": 123275050000,
      "local": {
        "insurance_l": 2351378590,
        "corporate_l": 650217360,
        ...
        "total_l": 16135449399
      },
      "foreign": {
        "insurance_f": 635769338,
        "corporate_f": 621878921,
        ...
        "total_f": 36318241721
      },
      "numbers_of_shareholders": 767281,
      "change_in_shareholders": -15416
    },
    ...
  ]
}
```

**Important fields:**
| Field | Type | Notes |
|-------|------|-------|
| `date` | string | YYYY-MM-DD, monthly |
| `shares_number` | number | Total shares outstanding |
| `local.*` | number | Local investor category breakdown (shares) |
| `foreign.*` | number | Foreign investor category breakdown (shares) |
| `numbers_of_shareholders` | number | Total shareholder count |
| `change_in_shareholders` | number | Change from prior month |

**Critical finding:** Data is ordered newest-first. Must select latest by date, not array position.

**Investor categories:** insurance, corporate, pension_fund, financial_institutions, individual, mutual_fund, securities_companies, foundation, other — each with `_l` (local) and `_f` (foreign) suffix.

---

### 7. Corporate Actions — `GET /v2/company/corporate-actions/{symbol}/`

**Request example:**

```
GET /v2/company/corporate-actions/BBCA.JK/
Authorization: <api_key>
```

**Response shape:**

```json
{
	"symbol": "BBCA.JK",
	"corporate_actions": {
		"agm": [
			{
				"agm_date": "2026-03-12",
				"agm_time": "14:00:00",
				"agm_place": "...",
				"agm_result": "..."
			}
		],
		"dividend": [
			{
				"ex_date": "2026-08-31",
				"payment_date": "2026-09-16",
				"dividend_yield": null,
				"dividend_amount": 25
			},
			{
				"ex_date": "2026-03-30",
				"payment_date": "2026-04-08",
				"dividend_yield": null,
				"dividend_amount": 281
			}
		],
		"stock_split": [{ "date": "2021-10-13", "split_ratio": 5 }],
		"bonus": null,
		"warrant": null,
		"right_issue": null,
		"upcoming_dividend": null
	}
}
```

**Important fields:**
| Field | Type | Notes |
|-------|------|-------|
| `dividend[].ex_date` | string | YYYY-MM-DD |
| `dividend[].dividend_amount` | number | IDR per share |
| `dividend[].dividend_yield` | number\|null | Nullable |
| `stock_split[].date` | string | YYYY-MM-DD |
| `stock_split[].split_ratio` | number | e.g. 5 = 1:5 split |
| `agm[].agm_date` | string | YYYY-MM-DD |

**Null handling:** `bonus`, `warrant`, `right_issue` are `null` when no data. Must handle null.

---

### 8. Filings — `GET /v2/filings/{symbol}/`

**Status: ENDPOINT NOT FOUND**

```
GET /v2/filings/BBCA.JK/
→ {"details":"The requested endpoint does not exist","urls":{...}}
```

**Critical finding:** This endpoint does NOT exist in the current Sectors API v2. The PRD research hypothesis was wrong. Filings are a next-enhancement feature, not MVP.

---

## Empirical Dataset — 8 Tickers Tested

### Validation tickers (5 required)

| Ticker  | Sector           | Major Shareholders                           | Whale Investors                     | Conglomerate               | Free Float   | Notes                                          |
| ------- | ---------------- | -------------------------------------------- | ----------------------------------- | -------------------------- | ------------ | ---------------------------------------------- |
| BBCA.JK | Financials/Banks | PT Dwimuria 54.942%, Public 44.642%          | Anthoni Salim                       | Djarum Group               | 0.45058      | 12 major SH, PT Dwimuria is #1                 |
| BREN.JK | Energy           | PT Barito Pacific 64.637%, Green Era 22.665% | Prajogo Pangestu                    | Barito Group               | (not tested) | 4 major SH, corporate SH has `symbol: BRPT.JK` |
| ADRO.JK | Mining           | PT Adaro Strategic 48.768%, Public 40.382%   | Edwin Soeryadjaya, Garibaldi Thohir | Saratoga, Thohir, Triputra | (not tested) | 6 major SH                                     |
| AMMN.JK | Mining           | PT Sumber Gemilang 32.174%, Public 25.257%   | null                                | Medco Group, Salim Group   | (not tested) | 12 major SH, whale_investors is null           |
| TLKM.JK | Communication    | PT Danantara 51.57%, Public 41.65%           | null                                | null                       | (not tested) | 5 major SH, both whale and conglomerate null   |

### Trace case — PT Dwimuria Investama Andalan

| Company | SH Name Match | Share % | Share Amount   |
| ------- | ------------- | ------- | -------------- |
| BBCA.JK | ✓ Exact match | 54.942% | 67,729,950,000 |
| SSIA.JK | ✓ Exact match | 10.24%  | 482,000,000    |
| TOWR.JK | ✓ Exact match | 19.954% | 11,792,689,937 |

**Verified:** The PRD trace expectation (BBCA, SSIA, TOWR for PT Dwimuria) matches live API exactly. All three tickers confirmed.

### Additional tickers tested

| Ticker  | Notes                                                     |
| ------- | --------------------------------------------------------- |
| SSIA.JK | PT Dwimuria holds 10.24% — confirmed cross-company trace  |
| TOWR.JK | PT Dwimuria holds 19.954% — confirmed cross-company trace |

---

## Data Questions Answered

### Company identity

- **Ticker always `.JK`?** Yes. All API responses use `.JK` suffix.
- **Both ticker and symbol?** Yes — `symbol` field includes `.JK`. `company_name` is the legal name.
- **Stable company ID?** No separate ID — `symbol` is the primary key.
- **Legal company name?** Yes — `company_name` field, e.g. "PT Bank Central Asia Tbk."
- **Multiple identifiers?** No — one symbol per company.

### Ownership

- **Structure:** `major_shareholders` array with name, share_value, share_amount, share_percentage (string), symbol (nullable).
- **Date/as_of:** **NO DATE FIELD EXISTS.** Cannot manufacture one.
- **Source/status fields:** No explicit source field. Data is "as reported by Sectors."
- **Public/free-float entries:** "Public" and "Treasury Stock" appear as major shareholders. Must be handled — they are NOT traceable entities.
- **Controller indicators:** Not present.
- **Affiliate indicators:** `affiliates` in overview is context metadata, NOT ownership.
- **Conglomerate fields:** `conglomerates_group` in ownership is context metadata, NOT ownership.

### Shareholder names

- **Casing:** Mixed — "PT Dwimuria Investama Andalan", "Public", "Jahja Setiaatmadja"
- **PT prefixes:** Present on corporate entities
- **Abbreviations:** None observed in tested data
- **Suffixes:** None observed
- **Legal-name differences:** "Tan Ho Hien/Subur Disebut Juga Subur Tan" vs "Tan Ho Hien/Subur Atau Dipanggil Subur Tan" — slight difference between ownership and management lists
- **Whitespace:** Normal
- **Duplicate names:** Possible across companies (e.g. "Public" appears in every company)
- **Spelling differences:** Minor variations possible (Subur/Disebut vs Subur/Atau)

**Normalization strategy:** Trim, collapse whitespace, lowercase for comparison ONLY. Do NOT strip PT prefixes or perform fuzzy matching.

### Screener

- **`q` mode:** Works for natural language, but less precise
- **`where` mode:** `major_shareholders_name like '%name%'` is the correct approach for trace searches
- **Returns:** `symbol` and `company_name` only — no shareholder details
- **Pagination:** Yes, standard limit/offset

### Verification

The verification flow works as designed:

1. Screener returns candidate tickers via `major_shareholders_name like`
2. Company Report ownership returns full shareholder list
3. Name comparison: exact match after normalization → confirmed
4. Mismatch → flagged, not added to graph

---

## PRD Discrepancies Found

| #   | PRD Assumption                                        | Reality                                        | Impact                                |
| --- | ----------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| 1   | `/v2/filings/{symbol}/` exists                        | Endpoint returns "does not exist"              | Filings are next-enhancement, not MVP |
| 2   | Free float endpoint accepts symbol filter             | Returns ALL companies, must filter client-side | Need client-side filter               |
| 3   | `share_percentage` is numeric                         | It's a **string**                              | Must parse                            |
| 4   | Ownership has `as_of` date                            | No date field exists                           | Render "Not available"                |
| 5   | `executives_shareholdings.share_percentage` is string | It's a **number**                              | Inconsistent with major_shareholders  |
| 6   | `VITE_SECTORS_API_KEY` is acceptable                  | Security violation — key in client bundle      | Must move to server                   |

---

## Internal Contracts (Preliminary)

```typescript
// Ticker is always ".JK" suffix
type Ticker = string; // validated: /^[A-Z]{2,5}\.JK$/

interface Company {
	symbol: Ticker;
	name: string; // company_name from API
	sector?: string;
	subSector?: string;
	marketCap?: number;
	// affiliate metadata — NOT ownership
	affiliates?: string[]; // context only
}

interface OwnershipHolder {
	name: string;
	shareValue: number; // share_value from API (IDR)
	shareAmount: number; // share_amount from API
	sharePercentage: number; // parsed from string
	symbol?: string; // corporate ticker if present (nullable in API)
}

interface OwnershipSnapshot {
	symbol: Ticker;
	companyName: string;
	holders: OwnershipHolder[];
	// Context metadata — NOT ownership edges
	whaleInvestors: string[] | null;
	conglomeratesGroup: string[] | null;
	// Date unavailable from API
	asOf: null;
}

interface TraceCandidate {
	ticker: Ticker;
	companyName: string;
	screenerName: string; // raw name from screener
	verification?: TraceVerification;
}

type TraceVerification =
	| {
			status: "confirmed";
			screenerName: string;
			ownershipName: string;
			ticker: string;
	  }
	| { status: "mismatch"; screenerName: string; ticker: string };
```

---

## Known Gaps

1. **No ownership date** — API does not expose `as_of` for ownership snapshots
2. **Filings endpoint doesn't exist** — next enhancement, not MVP blocker
3. **Free float not filterable** — must fetch all and filter client-side
4. **Inconsistent `share_percentage` types** — string in major_shareholders, number in executives
5. **No separate company ID** — symbol is the key
6. **Shareholder `symbol` is nullable** — can't rely on it for all cases

---

## Verification Status

- [x] BBCA — ownership, overview, management, free float, composition, corporate actions
- [x] BREN — ownership
- [x] ADRO — ownership
- [x] AMMN — ownership
- [x] TLKM — ownership
- [x] SSIA — ownership (trace verification)
- [x] TOWR — ownership (trace verification)
- [x] Screener `major_shareholders_name like` query
- [x] Company report with multiple sections
- [ ] Filings (endpoint doesn't exist)

---

_Research conducted 2026-09-22. All findings based on live API calls with valid credentials._
