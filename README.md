<!-- @format -->

![TracePoint](https://tracepoint-gamma.vercel.app/white-logo.png)

# TracePoint

TracePoint is an ownership relationship explorer for Indonesian listed companies, built for **Sectors Hackathon 2026 — Track 3: Market Intelligence**.

It helps users search for companies, inspect reported shareholders, visualize ownership structures, and trace shareholder names across multiple companies without manually reconstructing the same relationships from different sources.

## Problem

Tracing ownership relationships across Indonesian listed companies is time-consuming. Shareholder information, ownership percentages, and company relationships can be scattered across different sources, making it difficult to trace a shareholder beyond a single company.

The usual process requires repeatedly searching for a company, checking its shareholders, finding the same shareholder in another company, and verifying the relationship.

## Solution

TracePoint puts this process into one workflow:

`Search → Company → Ownership Graph → Trace → Verification`

Users can:

- Search for Indonesian listed companies or shareholder names.
- View reported major shareholders and ownership percentages.
- Explore ownership structures through an interactive graph.
- Trace a shareholder across other listed companies.
- Verify candidate relationships against reported ownership data.
- Distinguish confirmed name matches from unverified candidates and contextual information.

The core idea is an interconnected ownership map backed by Sectors data.

## Impact

We tested the workflow against the usual research process.

- **~35 minutes → ~2 minutes** average tracing time
- **94.3% reduction** in research time
- **100% task completion** among test users
- **9.5/10 average rating** compared with users' usual research method

The goal is to reduce repetitive ownership research while keeping the underlying ownership information visible and traceable.

## Technical Implementation

### Frontend

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router DOM 7
- React Flow 11 for the ownership graph
- Recharts 3 for shareholder composition
- Lucide React for UI icons
- React hooks for local component and panel state

### Backend

- Vercel Node.js Serverless Functions
- TypeScript
- Server-side proxy for Sectors Financial API v2
- Runtime response validation with custom type guards
- 5-minute in-memory response cache
- Retry handling for retryable upstream responses
- 15-second upstream request timeout
- Per-IP rate limiting
- Ticker normalization and validation
- Structured error responses

### Data

TracePoint uses **Sectors Financial API v2** as its external financial data source.

The backend transforms Sectors responses into TracePoint's internal data types before passing them to the frontend.

The API key is kept server-side and is never exposed to the browser.

### Ownership Graph

The ownership graph is implemented with React Flow and a custom physics-based orbital layout.

- Company is positioned at the center.
- Shareholders are arranged in orbital rings.
- Bubble size represents reported ownership percentage.
- Ownership relationships use solid edges with percentage labels.
- Affiliates and conglomerate groups are displayed separately as contextual metadata.
- `Public` and `Treasury Stock` are treated as non-traceable aggregate holdings.
- Corporate shareholders with available tickers can link directly to their company.
- Clicking a shareholder opens an inspector with ownership details and a trace action.

### Cross-Company Trace

The trace system combines shareholder screening with ownership-report verification.

1. A user selects a traceable shareholder.
2. TracePoint searches for companies where that shareholder name appears in the major shareholder screener.
3. Candidate companies are checked against their ownership reports.
4. An exact shareholder-name match is required for confirmation.
5. Confirmed and unconfirmed candidates are presented separately.

Verification uses case-insensitive, whitespace-normalized exact name matching.

A confirmed match means that the shareholder name appears in the reported ownership data. It **does not establish beneficial ownership**.

## Architecture

```text
Browser
   │
   │ /api/*
   ▼
Vercel Serverless Functions
   │
   ├── Rate limiting
   ├── Parameter validation
   ├── Sectors API v2 proxy
   ├── Response transformation
   └── 5-minute in-memory cache
   │
   ▼
Sectors Financial API v2


React Frontend
   │
   ├── Search
   ├── Company Workspace
   ├── Ownership Graph
   └── Cross-Company Trace
```

The frontend communicates only with TracePoint's `/api/*` endpoints and never calls the Sectors API directly.

## Data Transparency

TracePoint distinguishes between different types of information:

- **Reported ownership** — major shareholder records returned by Sectors.
- **Candidate** — a company returned by the shareholder search before verification.
- **Confirmed name match** — an ownership report containing the exact searched shareholder name.
- **Context metadata** — affiliates, whale investors, and conglomerate groups displayed for context but not treated as ownership edges.

TracePoint does not independently verify the underlying financial data.

Ownership percentages are presented as reported by Sectors and may not sum to 100%. The ownership snapshot date is also unavailable from the Sectors API.

## Limitations

- Shareholder search results are candidates until verified against an ownership report.
- Exact name matching does not establish beneficial ownership.
- Ownership percentages depend on the data provided by Sectors.
- Ownership snapshot dates are not available from the current API.
- Trace verification is limited to five candidates per verification action.
- The server-side cache is scoped to warm serverless containers.
- Graph layout may vary depending on the number of shareholders.
- TracePoint currently focuses on Indonesian listed companies.

## Project Structure

```text
src/
├── components/
│   └── Trace/
├── features/
│   └── trace/
│       └── hooks/
├── interfaces/
├── layouts/
├── lib/
├── pages/
├── types/
└── utils/
    └── trace/

api/
├── _lib/
├── company-overview.ts
├── company-ownership.ts
├── company-management.ts
├── company-composition.ts
├── company-corporate-actions.ts
├── search.ts
└── trace-verify.ts
```

## Local Development

### Requirements

- Node.js
- Sectors API key for live data

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

For live data, configure the server-side environment variable:

```bash
SECTORS_API_KEY=your_api_key
```

The API key must not be exposed through `VITE_*` environment variables.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Links

- **Live Demo:** https://tracepoint-gamma.vercel.app
- **Judging Video:** https://lnkd.in/gh7kGuRK
- **Teaser:** https://lnkd.in/gP8-bus8
- **GitHub:** https://lnkd.in/gVXZaCha

## Team

Built by **Solomon** for **Sectors Hackathon 2026 — Track 3: Market Intelligence**.

- Zaidan Adli Anandra
- Fajar Mulyo Setyawan
- Stanislaus Alva Jufinto
