/** @format */

import "reactflow/dist/style.css";

import React, { useCallback, useState } from "react";

import {
	Check,
	Command,
	Diamond,
	HelpCircle,
	History,
	Search,
} from "lucide-react";
import ReactFlow, {
	Background,
	type Edge,
	Handle,
	type Node,
	Position,
	useEdgesState,
	useNodesState,
} from "reactflow";

type EntityNodeData = {
	label: string;
	subLabel: string;
	dotColor: "purple" | "orange" | "cyan" | "green";
};

type EntityNode = Node<EntityNodeData>;

const CustomEntityNode = ({
	data,
	selected,
}: {
	data: EntityNodeData;
	selected?: boolean;
}) => {
	const dotColors: Record<EntityNodeData["dotColor"], string> = {
		purple: "bg-[#a87ffb]",
		orange: "bg-[#f5a623]",
		cyan: "bg-[#00c3d9]",
		green: "bg-[#4ade80]",
	};

	return (
		<div
			className={`min-w-[200px] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-colors ${
				selected
					? "border-[#00c3d9] bg-[#0d2232]"
					: "border-[#1d3245] bg-[#0c1824]"
			}`}
		>
			<Handle
				type="target"
				position={Position.Left}
				className="!h-1 !w-1 !border-0 !bg-transparent"
			/>

			<div
				className={`h-3 w-3 shrink-0 rounded-full ${dotColors[data.dotColor]}`}
			/>

			<div>
				<div className="text-sm font-bold text-white">{data.label}</div>
				<div className="text-xs text-gray-400">{data.subLabel}</div>
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

const initialNodes: EntityNode[] = [
	{
		id: "pt-dwimuria",
		type: "customEntity",
		position: { x: 50, y: 150 },
		data: {
			label: "PT Dwimuria",
			subLabel: "Major shareholder",
			dotColor: "purple",
		},
	},
	{
		id: "jahja",
		type: "customEntity",
		position: { x: 50, y: 350 },
		data: {
			label: "Jahja Setiaatmadja",
			subLabel: "President Director",
			dotColor: "orange",
		},
	},
	{
		id: "bbca",
		type: "customEntity",
		position: { x: 350, y: 250 },
		data: {
			label: "BBCA.JK",
			subLabel: "Bank Central Asia",
			dotColor: "cyan",
		},
	},
	{
		id: "djarum",
		type: "customEntity",
		position: { x: 650, y: 100 },
		data: {
			label: "Djarum Group",
			subLabel: "Conglomerate",
			dotColor: "green",
		},
	},
	{
		id: "hartono",
		type: "customEntity",
		position: { x: 650, y: 400 },
		data: {
			label: "Hartono",
			subLabel: "Affiliate",
			dotColor: "green",
		},
	},
];

const initialEdges: Edge[] = [
	{
		id: "e-dwimuria-bbca",
		source: "pt-dwimuria",
		target: "bbca",
		label: "54.942%\n67,729,950,000",
		labelStyle: {
			fill: "#fff",
			fontWeight: 600,
			fontSize: 11,
		},
		labelBgStyle: {
			fill: "#0c1824",
			color: "#fff",
		},
		labelBgPadding: [8, 4],
		labelBgBorderRadius: 4,
		style: {
			stroke: "#00c3d9",
			strokeWidth: 2,
		},
	},
	{
		id: "e-jahja-bbca",
		source: "jahja",
		target: "bbca",
		label: "0.0182%\n22,456,785",
		labelStyle: {
			fill: "#f5a623",
			fontWeight: 600,
			fontSize: 11,
		},
		labelBgStyle: {
			fill: "#0c1824",
		},
		labelBgPadding: [8, 4],
		labelBgBorderRadius: 4,
		style: {
			stroke: "#f5a623",
			strokeWidth: 2,
		},
	},
	{
		id: "e-bbca-djarum",
		source: "bbca",
		target: "djarum",
		animated: true,
		style: {
			stroke: "#4ade80",
			strokeWidth: 2,
			strokeDasharray: "4 4",
		},
	},
	{
		id: "e-bbca-hartono",
		source: "bbca",
		target: "hartono",
		animated: true,
		style: {
			stroke: "#4ade80",
			strokeWidth: 2,
			strokeDasharray: "4 4",
		},
	},
];

const relationships = [
	{
		ticker: "BBCA.JK",
		name: "Bank Central Asia",
		pct: "54.942%",
	},
	{
		ticker: "SSIA.JK",
		name: "Surya Semesta Internusa",
		pct: "Not available",
	},
	{
		ticker: "TOWR.JK",
		name: "Sarana Menara Nusantara",
		pct: "Not available",
	},
];

const Trace = () => {
	const [nodes, , onNodesChange] = useNodesState<EntityNodeData>(initialNodes);
	const [edges, , onEdgesChange] = useEdgesState(initialEdges);
	const [selectedNode, setSelectedNode] = useState<string | null>(null);

	const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
		if (node.id === "pt-dwimuria") {
			setSelectedNode("pt-dwimuria");
			return;
		}

		setSelectedNode(null);
	}, []);

	const onPaneClick = useCallback(() => {
		setSelectedNode(null);
	}, []);

	return (
		<div className="flex h-screen overflow-hidden bg-[#080d14] font-sans text-white">
			<aside className="z-20 flex w-14 flex-col items-center border-r border-[#1d3245] bg-[#0c1824] py-4">
				<div className="mb-8 flex h-8 w-8 items-center justify-center rounded-full bg-[#00c3d9]">
					<div className="h-3 w-3 rounded-full bg-[#080d14]" />
				</div>

				<nav className="flex flex-1 flex-col gap-6">
					<button
						type="button"
						className="text-gray-500 transition hover:text-white"
					>
						<Search size={20} />
					</button>

					<button
						type="button"
						className="rounded-lg bg-[#122a3d] p-2 text-[#00c3d9]"
					>
						<Diamond size={20} />
					</button>

					<button
						type="button"
						className="text-gray-500 transition hover:text-white"
					>
						<History size={20} />
					</button>
				</nav>

				<button
					type="button"
					className="mt-auto text-gray-500 transition hover:text-white"
				>
					<HelpCircle size={20} />
				</button>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="flex h-16 shrink-0 items-center justify-between border-b border-[#1d3245] bg-[#0c1824] px-6">
					<div>
						<div className="mb-0.5 text-[10px] uppercase tracking-wider text-gray-400">
							Investigation
						</div>

						<div className="flex items-baseline gap-2">
							<h1 className="text-lg font-bold">BBCA.JK</h1>

							<span className="text-sm text-gray-400">
								PT Bank Central Asia Tbk.
							</span>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

							<input
								type="text"
								placeholder="Search ticker or company"
								className="w-72 rounded-full border border-[#1d3245] bg-[#080d14] py-1.5 pl-10 pr-12 text-sm text-white focus:border-[#00c3d9] focus:outline-none"
							/>

							<div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded bg-[#122a3d] px-1.5 py-0.5 text-[10px] text-gray-500">
								<Command size={10} />K
							</div>
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
									className="rounded-full bg-[#122a3d] px-4 py-1 text-sm font-medium text-white"
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
								<button
									type="button"
									className="rounded-full border border-[#1d3245] bg-[#080d14] px-4 py-1.5 text-sm text-gray-300"
								>
									- 100%
								</button>

								<button
									type="button"
									className="rounded-full border border-[#1d3245] bg-[#080d14] px-4 py-1.5 text-sm text-gray-300"
								>
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
								nodes={nodes}
								edges={edges}
								onNodesChange={onNodesChange}
								onEdgesChange={onEdgesChange}
								onNodeClick={onNodeClick}
								onPaneClick={onPaneClick}
								nodeTypes={nodeTypes}
								fitView
								className="bg-[#080d14]"
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
								Selected shareholder
							</div>
						</div>
					</div>

					<div className="flex w-[420px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#1d3245] bg-[#0c1824]">
						{selectedNode === "pt-dwimuria" ? (
							<div className="flex-1 overflow-y-auto p-6">
								<div className="mb-1 text-xs font-semibold text-[#00c3d9]">
									Selected shareholder
								</div>

								<h2 className="mb-4 text-2xl font-bold text-white">
									PT Dwimuria Investama Andalan
								</h2>

								<div className="mb-8 flex gap-2">
									<span className="rounded-full bg-[#122a3d] px-3 py-1 text-xs font-medium text-[#a87ffb]">
										Corporate shareholder
									</span>

									<span className="rounded-full bg-[#122a3d] px-3 py-1 text-xs font-medium text-gray-300">
										Reported by Sectors
									</span>
								</div>

								<div className="mb-10 space-y-4">
									<div className="flex items-center justify-between border-b border-[#1d3245] pb-2">
										<span className="text-sm text-gray-400">
											Ownership in BBCA
										</span>

										<span className="font-bold text-white">54.942%</span>
									</div>

									<div className="flex items-center justify-between border-b border-[#1d3245] pb-2">
										<span className="text-sm text-gray-400">Shares held</span>

										<span className="font-bold text-white">67,729,950,000</span>
									</div>

									<div className="flex items-center justify-between border-b border-[#1d3245] pb-2">
										<span className="text-sm text-gray-400">
											Ownership date
										</span>

										<span className="font-bold text-[#f5a623]">
											Not available
										</span>
									</div>
								</div>

								<div className="mb-4">
									<div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
										CROSS-COMPANY TRACE
									</div>

									<div className="mb-4 flex items-center justify-between">
										<h3 className="text-lg font-bold text-white">
											Confirmed relationships
										</h3>

										<span className="rounded-full border border-[#1d3245] bg-[#0d2232] px-3 py-1 text-xs font-medium text-[#00c3d9]">
											3 of 3 verified
										</span>
									</div>

									<div className="space-y-3">
										{relationships.map((rel) => (
											<div
												key={rel.ticker}
												className="flex items-center justify-between rounded-lg border border-[#1d3245] bg-[#080d14] p-3"
											>
												<div className="flex items-center gap-3">
													<span className="font-mono text-xs text-[#00c3d9]">
														{rel.ticker}
													</span>

													<div>
														<div className="text-sm font-bold text-white">
															{rel.name}
														</div>

														<div className="text-[10px] text-[#4ade80]">
															Confirmed via Company Report
														</div>
													</div>
												</div>

												<span className="text-sm text-gray-400">{rel.pct}</span>
											</div>
										))}
									</div>
								</div>

								<div className="mb-6 flex items-center justify-between rounded-lg border border-[#1d3245] bg-[#0d2232] p-4">
									<div>
										<div className="mb-1 font-bold text-white">
											Verification complete
										</div>

										<div className="text-xs text-gray-400">
											Only confirmed edges are added to the graph.
										</div>
									</div>

									<div className="text-[#4ade80]">
										<Check size={20} />
									</div>
								</div>

								<div className="flex gap-3">
									<button
										type="button"
										className="flex-1 rounded-lg bg-[#00c3d9] py-3 font-bold text-[#080d14] transition-colors hover:bg-[#00a8bb]"
									>
										Add 2 relationships to graph
									</button>

									<button
										type="button"
										onClick={() => setSelectedNode(null)}
										className="flex-1 rounded-lg border border-[#1d3245] bg-[#122a3d] py-3 font-bold text-white transition-colors hover:bg-[#1a3852]"
									>
										Close
									</button>
								</div>
							</div>
						) : (
							<div className="flex-1 overflow-y-auto p-6">
								<h2 className="mb-1 text-xl font-bold text-white">
									BBCA ownership context
								</h2>

								<p className="mb-6 text-sm text-gray-400">
									Latest available snapshot · 30 Jun 2026
								</p>

								<div className="mb-6 grid grid-cols-2 gap-4">
									<div className="rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
										<div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
											FREE FLOAT
										</div>

										<div className="mb-1 text-2xl font-bold text-white">
											45.058%
										</div>

										<div className="text-xs text-[#00c3d9]">
											From Sectors endpoint
										</div>
									</div>

									<div className="rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
										<div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
											SHAREHOLDERS
										</div>

										<div className="mb-1 text-2xl font-bold text-white">
											797,115
										</div>

										<div className="text-xs text-[#4ade80]">
											+29,745 vs prior month
										</div>
									</div>
								</div>

								<div className="mb-6 rounded-xl border border-[#1d3245] bg-[#080d14] p-5">
									<div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
										LOCAL / FOREIGN COMPOSITION
									</div>

									<div className="mb-4">
										<div className="mb-2 flex justify-between text-sm text-gray-300">
											<span>Local</span>
											<span>31.08%</span>
										</div>

										<div className="h-2 w-full overflow-hidden rounded-full bg-[#122a3d]">
											<div
												className="h-full bg-[#00c3d9]"
												style={{ width: "31.08%" }}
											/>
										</div>
									</div>

									<div>
										<div className="mb-2 flex justify-between text-sm text-gray-300">
											<span>Foreign</span>
											<span>68.92%</span>
										</div>

										<div className="h-2 w-full overflow-hidden rounded-full bg-[#122a3d]">
											<div
												className="h-full bg-[#a87ffb]"
												style={{ width: "68.92%" }}
											/>
										</div>
									</div>
								</div>

								<div className="mb-6">
									<div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
										CORPORATE ACTIONS
									</div>

									<div className="space-y-3">
										<div className="flex items-center justify-between rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
											<div className="flex items-center gap-4">
												<span className="rounded bg-[#0d2232] px-2 py-1 text-xs font-medium text-[#00c3d9]">
													Dividend
												</span>

												<span className="font-bold text-white">
													Ex-date 03 Dec 2025
												</span>
											</div>

											<span className="font-bold text-white">IDR 55</span>
										</div>

										<div className="flex items-center justify-between rounded-xl border border-[#1d3245] bg-[#080d14] p-4">
											<div className="flex items-center gap-4">
												<span className="rounded bg-[#1c221a] px-2 py-1 text-xs font-medium text-[#f5a623]">
													Split
												</span>

												<span className="font-bold text-white">
													13 Oct 2021
												</span>
											</div>

											<span className="font-bold text-white">1 : 5</span>
										</div>
									</div>
								</div>

								<div className="rounded-xl border border-[#1d3245] bg-[#080d14] p-5">
									<div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#00c3d9]">
										DATA STATUS
									</div>

									<div className="mb-1 text-lg font-bold text-white">
										Reported by Sectors
									</div>

									<div className="text-sm text-[#f5a623]">
										Ownership date unavailable
									</div>
								</div>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
};

export default Trace;
