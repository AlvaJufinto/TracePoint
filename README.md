<!-- @format -->

![TracePoint](https://tracepoint-gamma.vercel.app/white-logo.png)

# TracePoint

TracePoint is an ownership relationship explorer for Indonesian listed companies. It helps users search for companies, inspect reported major shareholders, visualize ownership structures, and trace shareholder names across multiple companies through ownership report verification.

The application uses Sectors Financial API v2 as its financial data source. All Sectors API calls are proxied through server-side functions so the API key is never exposed to the browser.

## Overview

TracePoint provides three core experiences:

- **Search** — Find Indonesian listed companies by ticker or name, or find candidate companies by shareholder name.
- **Company workspace** — View a company's reported ownership, management, free float, shareholder composition, and corporate actions.
- **Ownership graph** — Visualize major shareholders as an interactive graph with orbital layout, distinguishing reported ownership edges from context metadata.
- **Cross-company trace** — From a shareholder in the graph, launch a trace that searches for companies where that shareholder name appears, then verifies each candidate by checking for an exact name match in the company's ownership report.

## Features

### Search

- Company search by ticker (with or without `.JK` suffix) or company name.
- Shareholder name search that queries the Sectors Screener's `major_shareholders_name` filter.
- Shareholder search results are labeled as candidates, not confirmed ownership relationships.
- Search maintains the query in the URL so results survive navigation and refresh.

### Company Workspace

- Company overview panel: ticker, legal name, sector, sub-sector, industry, listing board, market cap, market cap rank, employee count, listing date, address, website, phone, email, last close price, latest close date, daily close change, all-time price ranges, ESG score, tags, indices, and affiliates.
- Ownership panel: list of reported major shareholders with name, share value (IDR), share amount, and share percentage. Whale investors and conglomerate group entries appear as context metadata, not ownership edges.
- Management panel: key executives and their positions, plus executive shareholdings.
- Free float panel: reported free float percentage.
- Shareholder composition panel: local and foreign share comparison, plus an investor category breakdown pie chart (insurance, corporate, pension fund, financial institutions, individual, mutual fund, securities companies, foundation, other).
- Corporate actions panel: AGMs, dividends, and stock splits.

### Ownership Graph

- Company node at the center.
- Shareholder nodes arranged in orbital rings around the company, sized by share percentage using a power transform for perceptual readability.
- Ownership edges are solid lines with arrow markers, labeled with the reported percentage.
- Context metadata nodes (affiliates, conglomerate groups) are dashed, labeled as context, and visually separated below the ownership area.
- Shareholders are categorized as major, corporate, minority, aggregate, or other, with distinct visual styling.
- "Public" and "Treasury Stock" entries are marked as non-traceable aggregate holdings.
- Clicking a shareholder node opens an inspector panel with ownership details and a "Trace shareholder" action.
- Corporate shareholders with a ticker symbol link to that company's trace page.
- Graph uses React Flow with a custom node renderer and custom edge renderer.

### Cross-Company Trace

- From a shareholder inspector, the user can start a trace by shareholder name.
- The trace searches for companies whose reported major shareholders include that name.
- Each candidate is verified by fetching the candidate's ownership report and checking for an exact name match (case-insensitive, whitespace-normalized).
- Verified results distinguish three statuses:
  - `confirmed` — exact name match found in the ownership report.
  - `mismatch` — ownership report exists but does not contain that exact name.
  - `not_found` — ownership report could not be fetched.
- Confirmed matches show the ownership name, share percentage, and share amount from the ownership report.
- The trace results panel shows confirmed matches separately from unconfirmed candidates.
- Batch verification is capped at five candidates per action. Unconfirmed candidates are never treated as ownership relationships.
- Metadata entries such as "Public" and "Treasury Stock" are excluded from trace input.

## How It Works

The current user workflow is:

`Search → Company Workspace → Ownership Graph → Trace → Trace Results`

1. The user searches for a company or shareholder on `/search`.
2. Selecting a company opens `/trace?ticker=...`.
3. The Trace page loads company overview, ownership, management, free float, composition, and corporate actions panels in parallel.
4. The ownership graph renders the company and its reported major shareholders.
5. Clicking a traceable shareholder opens an inspector and offers "Trace shareholder".
6. The trace opens a drawer showing candidate companies and verification results for the shareholder name.

## Architecture

TracePoint is a client-side React application backed by server-side proxy functions.

```
Browser
  │
  │  fetch("/api/...")
  │
  ▼
Vercel Serverless Functions (Node.js runtime)
  │
  ├── Rate limiting
  ├── Ticker validation / normalization
  ├── Sectors API v2 proxy
  │     └── Authorization: SECTORS_API_KEY (server-side only)
  ├── In-memory cache (5-minute TTL, warm-container scope)
  └── Response transformation to TracePoint internal types
  │
  ▼
React Frontend
  ├── React Router (createBrowserRouter)
  ├── React Flow (ownership graph)
  ├── Recharts (composition pie chart)
  └── Plain React state (useState / useEffect)
```

### Frontend

The frontend is a single-page React application. It talks to the backend exclusively through relative `/api/*` endpoints. It never calls the Sectors API directly and never holds the API key.

State is managed with React hooks. There is no global state library. Each panel on the Trace page has its own loading, success, empty, and error states.

### Backend

The backend lives in `api/` and is deployed as Vercel serverless functions. Each handler:

- Restricts the HTTP method.
- Extracts and validates the client IP for rate limiting.
- Normalizes and validates the ticker parameter where applicable.
- Proxies the corresponding Sectors API v2 endpoint.
- Transforms the Sectors response into TracePoint internal types.
- Returns a structured JSON response.

The backend also includes:

- An in-memory cache with 5-minute TTL for Sectors responses.
- Retry logic for retryable upstream status codes.
- Request timeout of 15 seconds.
- Upstream error classification and redaction of the API key from logs.
- A trace verification endpoint that accepts candidate tickers and shareholder names, fetches ownership reports server-side, and returns exact-match verification results.

### Data Source

Sectors Financial API v2 provides:

- Company report sections: overview, ownership, management, corporate actions.
- Company search / screener.
- Free float list.
- Shareholder composition data.

TracePoint does not independently verify the underlying data. Ownership percentages are as reported by Sectors and may not sum to 100%. The ownership snapshot date is not exposed by the Sectors API and is therefore shown as unavailable.

The application distinguishes between:

- **Reported ownership** — major shareholders with name, share value, share amount, and share percentage.
- **Context metadata** — whale investors and conglomerate groups, which are displayed but not rendered as ownership edges.
- **Affiliates** — company-level context metadata shown separately from ownership.

## Tech Stack

### Frontend

- React 19
- React DOM 19
- TypeScript
- Vite 8
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- React Router DOM 7
- React Flow 11
- Recharts 3
- Lucide React

### Backend

- Vercel Node.js serverless functions (`@vercel/node`)
- TypeScript

### Data Source

- Sectors Financial API v2

### Verified Usage Notes

- `axios` appears in `package.json` but is not used by the production data layer. The frontend uses a custom `fetch`-based `apiFetch` helper; the test suite uses axios only to mock server handlers.
- `elkjs` appears in `package.json` but the ownership graph layout is implemented with a custom physics-based orbital layout, not ELK.

## Project Structure

```
my-app/
├── public/
│   ├── black-logo.png
│   ├── white-logo.png
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BrandLogo.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Trace/
│   │   │   ├── CorporateActions.tsx
│   │   │   ├── Detail.tsx
│   │   │   ├── FitWhenReady.tsx
│   │   │   ├── PanelFeedback.tsx
│   │   │   ├── TraceCompanyContext.tsx
│   │   │   ├── TraceGraph.tsx
│   │   │   ├── TraceGraphPrimitives.tsx
│   │   │   └── TraceHeader.tsx
│   │   └── TraceResultsDrawer.tsx
│   ├── features/trace/hooks/
│   │   ├── useTraceData.ts
│   │   └── useTraceGraph.ts
│   ├── interfaces/
│   │   └── trace.ts
│   ├── layouts/
│   │   └── AppLayout.tsx
│   ├── lib/
│   │   ├── guards.ts
│   │   ├── trace-data-api.ts
│   │   ├── trace-fixture-api.ts
│   │   └── tracepoint-api.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── Trace.tsx
│   │   └── NotFound.tsx
│   ├── types/
│   │   └── tracepoint.ts
│   ├── utils/trace/
│   │   ├── format.ts
│   │   └── graph.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── api/
│   ├── _lib/
│   │   ├── cache.ts
│   │   ├── sectors-fetch.ts
│   │   ├── sectors-key.ts
│   │   └── server.ts
│   ├── company-overview.ts
│   ├── company-ownership.ts
│   ├── company-management.ts
│   ├── company-composition.ts
│   ├── company-corporate-actions.ts
│   ├── search.ts
│   ├── trace-verify.ts
│   ├── fixture-data.ts
│   └── fixtures/
│       ├── README.md
│       ├── tracepoint-fixtures.json
│       └── raw/
├── .env.example
├── vercel.json
├── vite.config.ts
├── tsconfig.app.json
├── package.json
└── README.md
```

## Application Routes

| Route     | Purpose                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/`       | Landing page with brief product description and entry point to search.                                                           |
| `/search` | Search page for companies or shareholders. Accepts `q` and `mode` query parameters.                                              |
| `/trace`  | Company workspace and ownership graph. Accepts `ticker`, optional `shareholder`, `from`, `via`, and `returnTo` query parameters. |
| `*`       | Not-found page.                                                                                                                  |

Search results link to `/trace` with the selected ticker and the current search URL as `returnTo`.

Shareholder inspector links to `/trace` with the target company ticker, the shareholder name as `shareholder`, the origin ticker as `from`, the shareholder name as `via`, and the current search URL as `returnTo`.

## API Architecture

The frontend calls these relative endpoints:

### Company endpoints

- `GET /api/company-overview?ticker=...`
- `GET /api/company-ownership?ticker=...`
- `GET /api/company-management?ticker=...`
- `GET /api/company-composition?ticker=...`
- `GET /api/company-corporate-actions?ticker=...`

### Search endpoint

- `GET /api/search?q=...` or `GET /api/search?where=...&limit=...&offset=...`

### Trace verification endpoint

- `POST /api/trace-verify` with body `{ candidates: [...], maxBatch?: number }`

### Development fixture endpoint

- `GET /api/fixture-data?ticker=...` — returns BBCA fixture data when accessed from localhost. Not available in deployment.

All company and search endpoints are GET. Trace verification is POST.

Each endpoint validates the HTTP method, checks rate limits, validates parameters where applicable, and returns structured JSON with an `error` field on failure.

## Data Source

Sectors Financial API v2 is the sole external data source. The application proxies Sectors requests through server-side functions. The Sectors API key is stored server-side only and is never bundled into the frontend.

The application transforms Sectors responses into internal TracePoint types before they reach the UI. These types are validated at runtime with guards in `src/lib/guards.ts`.

Important data-source characteristics visible in the implementation:

- `share_percentage` arrives as a string and is parsed to a number.
- `symbol` on shareholders is nullable and only populated for corporate shareholders.
- The ownership snapshot date is not provided by Sectors and is represented as `null` in the application.
- Whale investors and conglomerate groups are context metadata, not ownership relationships.
- Free float is reported by Sectors and is not derived from shareholder holdings.
- Shareholder composition snapshots have their own dates, separate from ownership dates.

## Ownership Graph

The ownership graph is built in `src/utils/trace/graph.ts` and rendered with React Flow.

### Node types

- **Company** — central node showing ticker and legal name.
- **Shareholder** — bubble nodes sized by share percentage. Styled by category: major, corporate, minority, aggregate, other.
- **Affiliate** — context metadata node, dashed style, labeled as not ownership.
- **Conglomerate** — context metadata node, dashed style, labeled as not ownership.

### Edge types

- **Ownership edges** — solid lines from shareholder to company, with arrow markers and percentage labels. Only reported ownership relationships are rendered this way.
- **Metadata edges** — dashed lines from company to affiliate or conglomerate nodes, labeled "Affiliate" or "Conglomerate group".

### Layout

The layout is custom and physics-based. The company is placed at the center. Shareholders are sorted by percentage and placed in inner and outer orbital rings. Bubble sizes are normalized with a power transform so small holdings remain readable while large holdings remain visually dominant. A relaxation loop resolves bubble overlaps and clears space around the company rectangle and metadata zone. Metadata nodes are placed in a dedicated context band below the ownership area.

### Interaction

- Clicking a shareholder node opens an inspector panel.
- Clicking an ownership edge or metadata edge navigates to the connected node.
- Clicking the canvas clears the selection.
- Major shareholders offer a "Trace shareholder" action.
- Corporate shareholders with a ticker offer a link to that company.

## Cross-Company Trace

The trace workflow is:

1. User selects a traceable shareholder in the graph.
2. The application searches for companies whose reported major shareholders include that name.
3. The application verifies up to five candidates per action by fetching each candidate's ownership report and checking for an exact name match.
4. Results are shown in a drawer with confirmed matches separated from unconfirmed candidates.

A candidate becomes a confirmed name match only when the ownership report lists that exact shareholder name. This does not establish beneficial ownership. Partial name matches are not treated as confirmation.

Trace input excludes non-traceable entries such as "Public" and "Treasury Stock".

## Data Transparency

The application uses the following terminology consistently with the implementation:

- **Reported ownership** — major shareholder records returned by Sectors.
- **Candidate** — a company returned by the shareholder name screener before verification.
- **Confirmed name match** — a candidate whose ownership report contains the exact searched shareholder name.
- **Context metadata** — whale investors, conglomerate groups, and affiliates. These are shown for context but are not ownership edges.
- **Not available** — used for missing numeric values such as share percentage, share amount, share value, free float, or ownership date.
- **Ownership date unavailable** — the Sectors API does not expose an ownership snapshot date.

## Caching and Performance

The server-side proxy uses an in-memory cache with a 5-minute TTL. Cache keys are built from the Sectors endpoint and sorted query parameters.

The cache is scoped to a single warm serverless container. On cold start, the cache is empty. This is acceptable for the current scope and avoids introducing a persistent cache store.

The frontend does not cache API responses beyond React state and React Router URL state.

## Security

- The Sectors API key is stored server-side only, in `SECTORS_API_KEY` (without the `VITE_` prefix).
- Local development may use `.env` or `.env.local`. `.env.local` takes precedence in local development.
- The frontend never contains the API key and never calls the Sectors API directly.
- The server strips the API key from upstream error logs before printing them.
- Ticker parameters are normalized and validated before use.
- Shareholder names used in trace verification are validated for length and non-traceable content.
- Trace verification caps candidates at 200 and batches at 5 per action.
- Rate limiting is applied per client IP for general API endpoints and separately for trace verification.

## Error Handling

Each panel on the Trace page reports one of four states: loading, success, empty, or error.

- **Loading** — Skeleton placeholders are shown per panel variant.
- **Success** — Panel content is rendered.
- **Empty** — A message explains that no data was available from Sectors.
- **Error** — A message explains that the panel could not be loaded, with a retry action.

The ownership graph shows:

- A loading placeholder while the layout is being computed.
- A layout error state if the layout fails, with a retry action.
- An empty state if no ownership records are returned.

The search page shows:

- A loading state with skeleton rows.
- An error state with a retry action that preserves the search query.
- An empty state when no matches are returned.
- A partial results notice when `hasMore` is true.

The trace results drawer shows:

- A loading indicator while verification is in progress.
- An error state with a retry or "check next candidates" action.
- An empty state when no candidates are returned.
- Separate sections for confirmed matches and unconfirmed candidates.

## Local Development

### Requirements

- Node.js
- A Sectors API key for live data
- For local full-stack testing, a local server that serves the Vercel functions

### Install

```bash
npm install
```

### Run the frontend

```bash
npm run dev
```

This starts the Vite development server. The frontend expects a backend proxy at `/api/*`. Without a deployed or local proxy, API calls will fail.

### Variable naming

The application selects its data source based on `VITE_TRACE_DATA_SOURCE`:

- If set to `fixtures`, the app uses the local fixture API layer.
- Otherwise, it uses the live API layer that calls `/api/*`.

For local development with live data, set `SECTORS_API_KEY` server-side. Do not place the key in `VITE_*` variables.

See `.env.example` for the expected server-side variable name.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview

```bash
npm run preview
```

## Deployment

The project is configured for Vercel deployment.

`vercel.json` declares:

- Version 2 of the Vercel configuration format.
- A dev command for local function serving.
- A rewrite that sends all non-API routes to `index.html` so React Router can handle them.

Serverless functions live in `api/` and use the Node.js runtime.

The Sectors API key must be configured as a Vercel environment variable named `SECTORS_API_KEY` for preview and production deployments.

## Limitations

- The application depends on Sectors API v2. If Sectors is unavailable or returns unexpected shapes, panels may show empty or error states.
- Ownership percentages are as reported by Sectors and may not sum to 100%.
- The ownership snapshot date is not available from Sectors.
- Free float is a reported value, not a calculation from shareholder holdings.
- Shareholder search results are screening candidates, not confirmed ownership relationships.
- Trace verification confirms only that an exact shareholder name appears in a company's ownership report. It does not establish beneficial ownership.
- Trace verification is batched and capped. Only five candidates are verified per action.
- The in-memory cache only persists across warm container requests. Cold starts have no cache.
- Fixture data is limited to BBCA.JK for local development.
- The graph layout is custom and may not scale identically for every company's shareholder list.
- elkjs is present in `package.json` but not used for layout in the current implementation.
- Some company overview fields are optional and may be missing if Sectors does not return them.

## Development Notes

- The frontend API client is in `src/lib/tracepoint-api.ts`. It talks only to `/api/*` and returns TracePoint internal types.
- Runtime type guards are in `src/lib/guards.ts`. They validate API responses before they enter React state.
- The trace data hook is in `src/features/trace/hooks/useTraceData.ts`. It loads company, ownership, management, free float, composition, and corporate actions panels independently, each with its own loading and error state.
- The graph hook is in `src/features/trace/hooks/useTraceGraph.ts`. It builds graph data and runs the layout.
- Graph data construction and layout are in `src/utils/trace/graph.ts`.
- Format helpers are in `src/utils/trace/format.ts`.
- Internal data contracts are in `src/types/tracepoint.ts`.
- Node and edge data shapes for the graph are in `src/interfaces/trace.ts`.
- The server-side cache is in `api/_lib/cache.ts`.
- The Sectors fetch helper with caching, retries, and timeout is in `api/_lib/sectors-fetch.ts`.
- The server-side key loader is in `api/_lib/sectors-key.ts`.
- Shared server helpers for rate limiting, IP extraction, and responses are in `api/_lib/server.ts`.

## Tests

The project includes focused tests under `src/__tests__/`. They cover:

- Fixture endpoint contract.
- Fixture data contracts against runtime guards.
- Ticker normalization.
- Sectors key loading behavior in local and deployment environments.
- Company API endpoint URL shapes.
- Ownership parsing and null handling.
- Trace verification exact-match behavior, metadata exclusion, batch caps, and null preservation.
- Dependency-shape guard for the trace data hook.

## License

Not specified in the repository.
