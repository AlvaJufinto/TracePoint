/**
 * Trace page — Ownership graph with ReactFlow.
 *
 * Displays real ownership data fetched from Sectors API via the server proxy.
 * Graph edges are rendered from API ownership data.
 *
 * [Verified] against live Sectors API responses on 2026-09-22.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, { Background, type Edge, type Node, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  AlertCircle,
  Building2,
  User,
  LineChart,
  GitBranch,
  Search,
} from 'lucide-react';
import {
  getCompanyOverview,
  getCompanyOwnership,
  getCompanyManagement,
  getFreeFloat,
  getShareholderComposition,
  getCorporateActions,
} from '../lib/tracepoint-api';
import type {
  TracePointCompany,
  TracePointOwnershipSnapshot,
  TracePointManagement,
  TracePointFreeFloat,
  TracePointComposition,
  TracePointCorporateActions,
  OwnershipEdge as OwnershipEdgeType,
  MetadataEdge,
  GraphNode,
  PanelState,
} from '../types/tracepoint';

// ---------------------------------------------------------------------------
// Panel state helper
// ---------------------------------------------------------------------------

function createPanelState<T>(): PanelState<T> {
  return { status: 'loading', data: null, error: null };
}

// ---------------------------------------------------------------------------
// Node/Edge types for ReactFlow
// ---------------------------------------------------------------------------

type EntityNodeData = {
  label: string;
  subLabel: string;
  dotColor: 'purple' | 'orange' | 'cyan' | 'green' | 'gray';
  nodeType: 'company' | 'shareholder' | 'management' | 'affiliate' | 'conglomerate';
  ticker?: string;
};

type EntityNode = Node<EntityNodeData>;

const dotColors: Record<EntityNodeData['dotColor'], string> = {
  purple: 'bg-[#a87ffb]',
  orange: 'bg-[#f5a623]',
  cyan: 'bg-[#00c3d9]',
  green: 'bg-[#4ade80]',
  gray: 'bg-[#6b7280]',
};

const CustomEntityNode = ({
  data,
  selected,
}: {
  data: EntityNodeData;
  selected?: boolean;
}) => {
  return (
    <div
      className={`min-w-[200px] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-colors ${
        selected
          ? 'border-[#00c3d9] bg-[#0d2232] ring-2 ring-[#00c3d9]/30'
          : 'border-[#1d3245] bg-[#0c1824]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-1 !w-1 !border-0 !bg-transparent"
      />

      <div className={`h-3 w-3 shrink-0 rounded-full ${dotColors[data.dotColor]}`} />

      <div className="min-w-0">
        <div className="text-sm font-bold text-white truncate">{data.label}</div>
        <div className="text-xs text-gray-400 truncate">{data.subLabel}</div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-1 !w-1 !border-0 !bg-transparent"
      />
    </div>
  );
};

const nodeTypes = {
  customEntity: CustomEntityNode,
};

// ---------------------------------------------------------------------------
// Graph data builder
// ---------------------------------------------------------------------------

function buildGraphData(
  company: TracePointCompany | null,
  ownership: TracePointOwnershipSnapshot | null,
  management: TracePointManagement | null,
): {
  nodes: GraphNode[];
  ownershipEdges: OwnershipEdgeType[];
  metadataEdges: MetadataEdge[];
} {
  const nodes: GraphNode[] = [];
  const ownershipEdges: OwnershipEdgeType[] = [];
  const metadataEdges: MetadataEdge[] = [];

  if (!company) return { nodes, ownershipEdges, metadataEdges };

  const companyId = company.ticker;
  nodes.push({
    id: companyId,
    label: company.ticker,
    subLabel: company.name,
    type: 'company',
    ticker: company.ticker,
  });

  if (ownership) {
    const seenNames = new Set<string>();

    for (const sh of ownership.holders) {
      const nodeId = `sh-${encodeURIComponent(sh.name)}`;
      const label = truncateName(sh.name, 30);
      const subLabel = buildShareholderSubLabel(sh);

      if (!seenNames.has(sh.name)) {
        seenNames.add(sh.name);
        nodes.push({
          id: nodeId,
          label,
          subLabel,
          type: 'shareholder',
          ticker: sh.symbol,
        });
      }

      // Only add ownership edge for non-Public, non-Treasury holders
      if (!isNonTraceableShareholder(sh.name)) {
        ownershipEdges.push({
          id: `e-${encodeURIComponent(sh.name)}-${companyId}`,
          sourceId: nodeId,
          targetId: companyId,
          shareholderName: sh.name,
          percentage: sh.sharePercentage,
          shareAmount: sh.shareAmount,
          sourceStatus: 'reported',
        });
      }
    }

    // Affiliates → metadata edges (dashed, context only)
    if (company.affiliates) {
      for (const aff of company.affiliates) {
        const affId = `aff-${encodeURIComponent(aff)}`;
        nodes.push({
          id: affId,
          label: aff,
          subLabel: 'Affiliate metadata · Not ownership',
          type: 'affiliate',
        });
        metadataEdges.push({
          id: `me-${encodeURIComponent(aff)}-${companyId}`,
          sourceId: affId,
          targetId: companyId,
          type: 'affiliate',
          label: 'Affiliate',
        });
      }
    }

    // Conglomerates → metadata edges
    if (ownership.conglomeratesGroup) {
      for (const cg of ownership.conglomeratesGroup) {
        const cgId = `cg-${encodeURIComponent(cg)}`;
        nodes.push({
          id: cgId,
          label: cg,
          subLabel: 'Conglomerate metadata · Not ownership',
          type: 'conglomerate',
        });
        metadataEdges.push({
          id: `me-cg-${encodeURIComponent(cg)}-${companyId}`,
          sourceId: cgId,
          targetId: companyId,
          type: 'conglomerate',
          label: 'Conglomerate group',
        });
      }
    }
  }

  // Management → separate nodes (no ownership edges from management)
  if (management) {
    for (const exec of management.keyExecutives) {
      const nodeId = `mgmt-${encodeURIComponent(exec.name)}`;
      nodes.push({
        id: nodeId,
        label: truncateName(exec.name, 25),
        subLabel: exec.position,
        type: 'management',
      });
    }
  }

  return { nodes, ownershipEdges, metadataEdges };
}

function buildShareholderSubLabel(sh: { name: string; symbol?: string; sharePercentage: number }): string {
  if (sh.symbol) return `Corporate shareholder · ${sh.symbol}`;
  if (sh.sharePercentage > 0.01) return 'Major shareholder';
  if (sh.sharePercentage > 0) return 'Minority shareholder';
  return 'Shareholder';
}

function truncateName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '…';
}

function isNonTraceableShareholder(name: string): boolean {
  return name === 'Public' || name === 'Treasury Stock';
}

function formatShares(amount: number): string {
  if (amount >= 1_000_000_000_000) return `${(amount / 1_000_000_000_000).toFixed(2)}T`;
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString();
}

// ---------------------------------------------------------------------------
// Convert to ReactFlow format
// ---------------------------------------------------------------------------

function toReactFlowNodes(graphNodes: GraphNode[]): EntityNode[] {
  const colorMap: Record<string, EntityNodeData['dotColor']> = {
    company: 'cyan',
    shareholder: 'purple',
    management: 'orange',
    affiliate: 'green',
    conglomerate: 'green',
  };

  return graphNodes.map((n) => ({
    id: n.id,
    type: 'customEntity',
    position: { x: 0, y: 0 },
    data: {
      label: n.label,
      subLabel: n.subLabel,
      dotColor: colorMap[n.type] ?? 'gray',
      nodeType: n.type,
      ticker: n.ticker,
    },
  }));
}

function toReactFlowEdges(
  ownershipEdges: OwnershipEdgeType[],
  metadataEdges: MetadataEdge[],
  selectedShareholderId: string | null,
): Edge[] {
  const edges: Edge[] = [];

  for (const e of ownershipEdges) {
    const lineColor = selectedShareholderId ? '#a87ffb' : '#00c3d9';

    edges.push({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      label: buildEdgeLabel(e),
      labelStyle: { fill: '#fff', fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: '#0c1824', color: '#fff' },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: lineColor,
        strokeWidth: 2,
      },
    });
  }

  for (const e of metadataEdges) {
    edges.push({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      animated: true,
      style: {
        stroke: '#4ade80',
        strokeWidth: 2,
        strokeDasharray: '4 4',
      },
    });
  }

  return edges;
}

function buildEdgeLabel(edge: OwnershipEdgeType): string {
  if (edge.percentage === null || edge.percentage === undefined) {
    return 'Not available';
  }
  const pct = `${(edge.percentage * 100).toFixed(3)}%`;
  if (edge.shareAmount !== null && edge.shareAmount !== undefined) {
    const shares = formatShares(edge.shareAmount);
    return `${pct}\n${shares}`;
  }
  return pct;
}

// ---------------------------------------------------------------------------
// Main Trace page
// ---------------------------------------------------------------------------

export default function Trace() {
  const [searchParams] = useSearchParams();
  const tickerParam = searchParams.get('ticker');
  const ticker = tickerParam
    ? tickerParam.toUpperCase().replace(/\.JK$/, '') + '.JK'
    : 'BBCA.JK';

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const [company, setCompany] = useState<PanelState<TracePointCompany>>(
    createPanelState(),
  );
  const [ownership, setOwnership] = useState<PanelState<TracePointOwnershipSnapshot>>(
    createPanelState(),
  );
  const [management, setManagement] = useState<PanelState<TracePointManagement>>(
    createPanelState(),
  );
  const [freeFloat, setFreeFloat] = useState<PanelState<TracePointFreeFloat>>(
    createPanelState(),
  );
  const [composition, setComposition] = useState<PanelState<TracePointComposition>>(
    createPanelState(),
  );
  const [corporateActions, setCorporateActions] = useState<PanelState<TracePointCorporateActions>>(
    createPanelState(),
  );

  // Data loading — fetch once per ticker change
  const fetchCompanyData = useCallback(async () => {
    const [companyResult, ownershipResult, managementResult] = await Promise.allSettled([
      getCompanyOverview(ticker),
      getCompanyOwnership(ticker),
      getCompanyManagement(ticker),
    ]);

    if (companyResult.status === 'fulfilled') {
      setCompany({ status: 'success', data: companyResult.value, error: null });
    } else {
      setCompany({ status: 'error', data: null, error: (companyResult.reason as Error).message });
    }

    if (ownershipResult.status === 'fulfilled') {
      setOwnership({ status: 'success', data: ownershipResult.value, error: null });
    } else {
      setOwnership({ status: 'error', data: null, error: (ownershipResult.reason as Error).message });
    }

    if (managementResult.status === 'fulfilled') {
      setManagement({ status: 'success', data: managementResult.value, error: null });
    } else {
      setManagement({ status: 'error', data: null, error: (managementResult.reason as Error).message });
    }

    const secondary = await Promise.allSettled([
      getFreeFloat(ticker),
      getShareholderComposition(ticker),
      getCorporateActions(ticker),
    ]);

    for (const result of secondary) {
      if (result.status === 'fulfilled') {
        const data = result.value as unknown;
        if (data && typeof data === 'object') {
          const d = data as Record<string, unknown>;
          if ('ticker' in d) {
            const tickerVal = d.ticker as string;
            if (tickerVal === ticker && 'freeFloat' in d) {
              setFreeFloat({ status: 'success', data: d as unknown as TracePointFreeFloat, error: null });
            } else if ('latestSnapshot' in d) {
              setComposition({ status: 'success', data: d as unknown as TracePointComposition, error: null });
            } else if ('dividends' in d || 'stockSplits' in d) {
              setCorporateActions({ status: 'success', data: d as unknown as TracePointCorporateActions, error: null });
            }
          }
        }
      }
    }
  }, [ticker]);

  useEffect(() => {
    (async () => {
      await fetchCompanyData();
    })();
  }, [fetchCompanyData]);

  // All useMemo calls unconditionally — no conditionals
  const graphData = useMemo(() => {
    const companyData = company.status === 'success' ? company.data : null;
    const ownershipData = ownership.status === 'success' ? ownership.data : null;
    const managementData = management.status === 'success' ? management.data : null;
    return buildGraphData(companyData, ownershipData, managementData);
  }, [company.status, company.data, ownership.status, ownership.data, management.status, management.data]);

  const reactFlowNodes = useMemo(() => toReactFlowNodes(graphData.nodes), [graphData.nodes]);
  const reactFlowEdges = useMemo(
    () => toReactFlowEdges(graphData.ownershipEdges, graphData.metadataEdges, selectedNode),
    [graphData.ownershipEdges, graphData.metadataEdges, selectedNode],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const totalOwnershipPct = useMemo(() => {
    if (!ownership.data) return null;
    let total = 0;
    for (const sh of ownership.data.holders) {
      total += sh.sharePercentage;
    }
    return total;
  }, [ownership.data]);

  const freeFloatPct = freeFloat.status === 'success' && freeFloat.data
    ? `${(freeFloat.data.freeFloat * 100).toFixed(3)}%`
    : null;

  const latestComp = composition.status === 'success' && composition.data
    ? composition.data.latestSnapshot
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#080d14] font-sans text-white">
      <aside className="z-20 flex w-14 flex-col items-center border-r border-[#1d3245] bg-[#0c1824] py-4">
        <div className="mb-8 flex h-8 w-8 items-center justify-center rounded-full bg-[#00c3d9]">
          <div className="h-3 w-3 rounded-full bg-[#080d14]" />
        </div>

        <nav className="flex flex-1 flex-col gap-6">
          <button type="button" className="text-gray-500 transition hover:text-white">
            <Search size={20} />
          </button>
          <button
            type="button"
            className={`rounded-lg p-2 transition-colors ${
              selectedNode
                ? 'rounded-lg bg-[#122a3d] p-2 text-[#a87ffb]'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <User size={20} />
          </button>
          <button type="button" className="text-gray-500 transition hover:text-white">
            <LineChart size={20} />
          </button>
          <button type="button" className="text-gray-500 transition hover:text-white">
            <GitBranch size={20} />
          </button>
        </nav>

        <button type="button" className="mt-auto text-gray-500 transition hover:text-white">
          <AlertCircle size={20} />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#1d3245] bg-[#0c1824] px-6">
          <div>
            <div className="mb-0.5 text-[10px] uppercase tracking-wider text-gray-400">
              Investigation
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-bold">{ticker}</h1>
              <span className="text-sm text-gray-400">
                {company.status === 'success' && company.data
                  ? company.data.name
                  : company.status === 'loading'
                  ? 'Loading...'
                  : 'Error loading company'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search ticker or company"
                className="w-72 rounded-full border border-[#1d3245] bg-[#080d14] py-1.5 pl-10 pr-12 text-sm text-white placeholder-gray-500 focus:border-[#00c3d9] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#1d3245] bg-[#0c1824] px-3 py-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-[#00c3d9]" />
              Sectors API v2
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 gap-6 overflow-hidden p-6">
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#1d3245] bg-[#0c1824]">
            <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
              <div className="pointer-events-auto flex rounded-full border border-[#1d3245] bg-[#080d14] p-1">
                <button
                  type="button"
                  className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                    selectedNode
                      ? 'bg-[#122a3d] text-white'
                      : 'bg-[#122a3d] px-4 py-1 text-sm font-medium text-white'
                  }`}
                >
                  Graph
                </button>
                <button
                  type="button"
                  className="rounded-full px-4 py-1 text-sm text-gray-400 hover:text-white"
                >
                  Context
                </button>
              </div>

              <div className="pointer-events-auto flex gap-2">
                <button type="button" className="rounded-full border border-[#1d3245] bg-[#080d14] px-4 py-1.5 text-sm text-gray-300">
                  - 100%
                </button>
                <button type="button" className="rounded-full border border-[#1d3245] bg-[#080d14] px-4 py-1.5 text-sm text-gray-300">
                  Fit graph
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute left-6 top-20 z-10 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              OWNERSHIP MAP
            </div>

            <div className="pointer-events-none absolute right-6 top-20 z-10">
              <div className="flex items-center gap-2 rounded-full border border-[#1d3245] bg-[#0c1824] px-3 py-1.5 text-xs text-gray-300">
                <div className="h-2 w-2 rounded-full bg-[#4ade80]" />
                Live response
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <ReactFlow
                nodes={reactFlowNodes}
                edges={reactFlowEdges}
                onNodesChange={() => {}}
                onEdgesChange={() => {}}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-[#080d14]"
                snapToGrid
                snapGrid={[15, 15]}
              >
                <Background color="#1d3245" gap={24} />
              </ReactFlow>
            </div>

            <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-4">
              <div className="flex items-center gap-2 rounded-full border border-[#1d3245] bg-[#0c1824] px-4 py-2 text-xs text-gray-300">
                <div className="h-0.5 w-4 bg-[#00c3d9]" />
                Reported ownership
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#1d3245] bg-[#0c1824] px-4 py-2 text-xs text-gray-300">
                <div className="h-0 w-4 border-t-2 border-dashed border-[#4ade80]" />
                Context metadata
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#1d3245] bg-[#0c1824] px-4 py-2 text-xs text-[#a87ffb]">
                <div className="h-2 w-2 rounded-full bg-[#a87ffb]" />
                Selected node
              </div>
            </div>
          </div>

          <div className="flex w-[420px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#1d3245] bg-[#0c1824]">
            {selectedNode ? (
              <SelectedNodeDetail
                nodeId={selectedNode}
                graphNodes={graphData.nodes}
                ownershipData={ownership.status === 'success' ? ownership.data : null}
                companyData={company.status === 'success' ? company.data : null}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="mb-1 text-xl font-bold text-white">
                  {ticker} ownership context
                </h2>
                <p className="mb-6 text-sm text-gray-400">
                  Latest available snapshot · Live from Sectors API
                </p>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      FREE FLOAT
                    </div>
                    <div className="mb-1 text-2xl font-bold text-white">
                      {freeFloatPct || (
                        <span className="text-gray-500">
                          {freeFloat.status === 'loading' ? '...' : 'Not available'}
                        </span>
                      )}
                    </div>
                    {freeFloat.status === 'success' && freeFloat.data && (
                      <div className="text-xs text-[#00c3d9]">From Sectors endpoint</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      SHAREHOLDERS
                    </div>
                    <div className="mb-1 text-2xl font-bold text-white">
                      {ownership.status === 'success' && ownership.data
                        ? `${ownership.data.holders.length}`
                        : ownership.status === 'loading'
                        ? '...'
                        : 'Not available'}
                    </div>
                    {latestComp && (
                      <div className="text-xs text-[#4ade80]">
                        +{latestComp.changeInShareholders.toLocaleString()} vs prior month
                      </div>
                    )}
                  </div>
                </div>

                {ownership.status === 'success' && ownership.data && (
                  <div className="mb-6 rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      TOTAL REPORTED OWNERSHIP
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {totalOwnershipPct !== null
                        ? `${(totalOwnershipPct * 100).toFixed(2)}%`
                        : 'Not available'}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Sum of reported major shareholders. Remaining is public/free float.
                    </p>
                  </div>
                )}

                {latestComp && (
                  <div className="mb-6 rounded-xl border border-[#1d3245] bg-[#080d14] p-5">
                    <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      LOCAL / FOREIGN COMPOSITION
                    </div>
                    <div className="mb-4">
                      <div className="mb-2 flex justify-between text-sm text-gray-300">
                        <span>Local</span>
                        <span>
                          {((latestComp.local.total / latestComp.sharesNumber) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#122a3d]">
                        <div
                          className="h-full bg-[#00c3d9]"
                          style={{
                            width: `${(latestComp.local.total / latestComp.sharesNumber) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-sm text-gray-300">
                        <span>Foreign</span>
                        <span>
                          {((latestComp.foreign.total / latestComp.sharesNumber) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#122a3d]">
                        <div
                          className="h-full bg-[#a87ffb]"
                          style={{
                            width: `${(latestComp.foreign.total / latestComp.sharesNumber) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {corporateActions.status === 'success' && corporateActions.data && (
                  <div className="mb-6">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      CORPORATE ACTIONS
                    </div>
                    <div className="space-y-3">
                      {corporateActions.data.dividends?.slice(0, 3).map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-[#1d3245] bg-[#080d14] p-4"
                        >
                          <div className="flex items-center gap-4">
                            <span className="rounded bg-[#0d2232] px-2 py-1 text-xs font-medium text-[#00c3d9]">
                              Dividend
                            </span>
                            <span className="font-bold text-white">
                              Ex-date {formatDate(d.exDate)}
                            </span>
                          </div>
                          <span className="font-bold text-white">IDR {d.dividendAmount}</span>
                        </div>
                      ))}
                      {corporateActions.data.stockSplits?.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-[#1d3245] bg-[#080d14] p-4"
                        >
                          <div className="flex items-center gap-4">
                            <span className="rounded bg-[#1c221a] px-2 py-1 text-xs font-medium text-[#f5a623]">
                              Split
                            </span>
                            <span className="font-bold text-white">{formatDate(s.date)}</span>
                          </div>
                          <span className="font-bold text-white">
                            1 : {s.splitRatio}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[#1d3245] bg-[#080d14] p-5">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#00c3d9]">
                    DATA STATUS
                  </div>
                  <div className="mb-1 text-lg font-bold text-white">
                    Reported by Sectors
                  </div>
                  {ownership.status === 'success' && ownership.data && (
                    <div className="mt-3 text-xs text-gray-400">
                      {ownership.data.whaleInvestors && ownership.data.whaleInvestors.length > 0
                        ? `Whale investors: ${ownership.data.whaleInvestors.join(', ')}`
                        : 'Whale investors: Not available'}
                      {ownership.data.conglomeratesGroup &&
                        ownership.data.conglomeratesGroup.length > 0 && (
                          <span className="block mt-1">
                            Conglomerate groups: {ownership.data.conglomeratesGroup.join(', ')}
                          </span>
                        )}
                      <span className="block mt-2 text-[#f5a623]">
                        Ownership date: Not available
                      </span>
                    </div>
                  )}
                  {ownership.status === 'error' && (
                    <div className="mt-2 text-xs text-[#f5a623]">
                      {ownership.error || 'Failed to load ownership data'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selected node detail
// ---------------------------------------------------------------------------

function SelectedNodeDetail({
  nodeId,
  graphNodes,
  ownershipData,
  companyData,
}: {
  nodeId: string;
  graphNodes: GraphNode[];
  ownershipData: TracePointOwnershipSnapshot | null;
  companyData: TracePointCompany | null;
}) {
  const node = graphNodes.find((n) => n.id === nodeId);

  if (!node) {
    return (
      <div className="flex-1 overflow-y-auto p-6 text-center text-gray-400">
        Node not found
      </div>
    );
  }

  const shareholder = ownershipData && node.type === 'shareholder'
    ? ownershipData.holders.find((h) => h.name === decodeURIComponent(nodeId.replace('sh-', ''))) ?? null
    : null;

  const isSelectedShareholder = node.type === 'shareholder';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-1 text-xs font-semibold text-[#00c3d9]">
        {node.type === 'company' ? 'Company' :
         node.type === 'shareholder' ? 'Shareholder' :
         node.type === 'management' ? 'Management' :
         node.type === 'affiliate' ? 'Affiliate' : 'Conglomerate'}
      </div>

      <h2 className="mb-4 text-2xl font-bold text-white">{node.label}</h2>

      <div className="mb-6 flex gap-2">
        <span className="rounded-full bg-[#122a3d] px-3 py-1 text-xs font-medium text-[#00c3d9]">
          {node.type}
        </span>
        {node.ticker && (
          <span className="rounded-full bg-[#122a3d] px-3 py-1 text-xs font-medium text-gray-300">
            {node.ticker}
          </span>
        )}
        <span className="rounded-full bg-[#122a3d] px-3 py-1 text-xs font-medium text-gray-300">
          Reported by Sectors
        </span>
      </div>

      {isSelectedShareholder && shareholder && (
        <div className="mb-8 space-y-4 border-t border-[#1d3245] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Ownership in {companyData?.ticker || 'company'}
            </span>
            <span className="font-bold text-white">
              {(shareholder.sharePercentage * 100).toFixed(3)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Shares held</span>
            <span className="font-bold text-white">{formatShares(shareholder.shareAmount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Share value</span>
            <span className="font-bold text-white">IDR {formatShares(shareholder.shareValue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Ownership date</span>
            <span className="font-bold text-[#f5a623]">Not available</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#1d3245] bg-[#0d2232] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-white text-sm">Trace this entity</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {node.type === 'shareholder'
                ? 'Verify across other companies via Company Report'
                : 'Open as focal company to explore further'}
            </div>
          </div>
          <div className="text-[#00c3d9]">
            <Building2 size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Not available';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[parseInt(m, 10) - 1];
  return `${month} ${parseInt(d, 10)} ${y}`;
}
