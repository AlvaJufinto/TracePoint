/**
 * TracePoint internal data contracts.
 *
 * These types are the boundary between raw Sectors API responses
 * and the frontend UI. Components must NOT depend directly on
 * raw Sectors response shapes.
 *
 * [Verified] against live API responses on 2026-09-22.
 */

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export interface TracePointCompany {
  ticker: string;        // Always ".JK" suffix
  name: string;          // Legal company name
  // Overview fields (optional — only when loaded)
  sector?: string;
  subSector?: string;
  industry?: string;
  subIndustry?: string;
  listingBoard?: string;
  marketCap?: number;
  marketCapRank?: number;
  employeeNum?: number;
  listingDate?: string;  // YYYY-MM-DD
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  lastClosePrice?: number;
  latestCloseDate?: string;
  dailyCloseChange?: number;
  allTimePrice?: {
    ytdLow?: Record<string, number>;
    ytdHigh?: Record<string, number>;
    allTimeLow?: Record<string, number>;
    allTimeHigh?: Record<string, number>;
  };
  esgScore?: number;
  tags?: string[];
  indices?: string[];
  // Context metadata — NOT ownership
  affiliates?: string[];
}

// ---------------------------------------------------------------------------
// Ownership
// ---------------------------------------------------------------------------

export interface TracePointOwnershipSnapshot {
  ticker: string;
  companyName: string;
  holders: TracePointShareholder[];
  // Context metadata — NOT ownership edges
  whaleInvestors: string[] | null;
  conglomeratesGroup: string[] | null;
  // Date unavailable from API — never fabricate
  asOf: null;
}

export interface TracePointShareholder {
  name: string;
  shareValue: number;      // IDR — may be 0 or undefined in edge cases
  shareAmount: number;     // Number of shares
  sharePercentage: number; // Parsed from string "0.54942"
  symbol?: string;         // Corporate ticker if present (optional)
}

// ---------------------------------------------------------------------------
// Management
// ---------------------------------------------------------------------------

export interface TracePointManagement {
  ticker: string;
  keyExecutives: Array<{ name: string; position: string }>;
  executivesShareholdings: Array<{
    name: string;
    position: string;
    shareAmount: number;
    sharePercentage: number; // Number type (different from major shareholders)
  }>;
}

// ---------------------------------------------------------------------------
// Free Float
// ---------------------------------------------------------------------------

export interface TracePointFreeFloat {
  ticker: string;
  companyName: string;
  freeFloat: number;       // Decimal, e.g. 0.45058
}

// ---------------------------------------------------------------------------
// Shareholder Composition
// ---------------------------------------------------------------------------

export interface TracePointComposition {
  ticker: string;
  year: number;
  snapshots: TracePointCompositionSnapshot[];
  latestSnapshot: TracePointCompositionSnapshot | null;
}

export interface TracePointCompositionSnapshot {
  date: string;            // YYYY-MM-DD
  sharesNumber: number;
  local: {
    insurance: number;
    corporate: number;
    pensionFund: number;
    financialInstitutions: number;
    individual: number;
    mutualFund: number;
    securitiesCompanies: number;
    foundation: number;
    other: number;
    total: number;
  };
  foreign: {
    insurance: number;
    corporate: number;
    pensionFund: number;
    financialInstitutions: number;
    individual: number;
    mutualFund: number;
    securitiesCompanies: number;
    foundation: number;
    other: number;
    total: number;
  };
  numberOfShareholders: number;
  changeInShareholders: number;
}

// ---------------------------------------------------------------------------
// Corporate Actions
// ---------------------------------------------------------------------------

export interface TracePointCorporateActions {
  ticker: string;
  agm: TracePointAGM[] | null;
  dividends: TracePointDividend[] | null;
  stockSplits: TracePointStockSplit[] | null;
  // These are nullable in the API — always present as null when empty
  bonus: null;
  warrant: null;
  rightIssue: null;
  upcomingDividend: null;
}

export interface TracePointAGM {
  date: string;
  time?: string;
  place?: string;
  result?: string | null;
}

export interface TracePointDividend {
  exDate: string;
  paymentDate: string;
  dividendYield: number | null;
  dividendAmount: number;
}

export interface TracePointStockSplit {
  date: string;
  splitRatio: number;
}

// ---------------------------------------------------------------------------
// Screener / Search
// ---------------------------------------------------------------------------

export interface TracePointScreenerResult {
  ticker: string;
  companyName: string;
}

export interface TracePointScreenerResponse {
  results: TracePointScreenerResult[];
  totalCount: number;
  hasMore: boolean;
  nextOffset: number | null;
}

// ---------------------------------------------------------------------------
// Trace Verification
// ---------------------------------------------------------------------------

export interface TraceCandidate {
  ticker: string;
  companyName: string;
  screenerName: string;
  // Populated after verification
  verification?: TraceVerification;
}

export type TraceVerification =
  | {
      status: 'confirmed';
      screenerName: string;
      ownershipName: string;
      ticker: string;
    }
  | {
      status: 'mismatch';
      screenerName: string;
      ownershipName?: string;
      ticker: string;
    }
  | {
      status: 'not_found';
      screenerName: string;
      ticker: string;
    };

// ---------------------------------------------------------------------------
// Data Status per panel
// ---------------------------------------------------------------------------

export type DataStatus = 'loading' | 'success' | 'empty' | 'error';

export interface PanelState<T> {
  status: DataStatus;
  data: T | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Graph data types for ReactFlow
// ---------------------------------------------------------------------------

export interface OwnershipEdge {
  id: string;
  sourceId: string;
  targetId: string;
  shareholderName: string;
  percentage: number | null;
  shareAmount: number | null;
  sourceStatus: 'reported'; // Only "reported" for solid edges
}

export interface MetadataEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'affiliate' | 'conglomerate';
  label: string;
}

export interface GraphNode {
  id: string;
  label: string;
  subLabel: string;
  type: 'company' | 'shareholder' | 'management' | 'affiliate' | 'conglomerate';
  ticker?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  ownershipEdges: OwnershipEdge[];
  metadataEdges: MetadataEdge[];
}
