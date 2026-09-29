/** @format */

import "reactflow/dist/style.css";

import { useMemo } from "react";

import ReactFlow, {
	Background,
	BackgroundVariant,
	type Edge,
	MarkerType,
} from "reactflow";

import type { EntityNode, EntityNodeData } from "../../interfaces/trace";
import type { GraphData } from "../../types/tracepoint";
import { CustomEntityNode, OwnershipLine } from "../Trace/TraceGraphPrimitives";

const nodeTypes = {
	customEntity: CustomEntityNode,
};

const edgeTypes = {
	ownership: OwnershipLine,
};

const graphData: GraphData = {
	nodes: [
		{
			id: "BBCA.JK",
			label: "BBCA.JK",
			subLabel: "PT Bank Central Asia Tbk.",
			type: "company",
			ticker: "BBCA.JK",
		},
		{
			id: "sh-PT%20Dwimuria%20Investama%20Andalan",
			label: "PT Dwimuria Investama Andalan",
			subLabel: "Major shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Public",
			label: "Public",
			subLabel: "Aggregate holding · Not traceable",
			type: "shareholder",
		},
		{
			id: "sh-Treasury%20Stock",
			label: "Treasury Stock",
			subLabel: "Aggregate holding · Not traceable",
			type: "shareholder",
		},
		{
			id: "sh-Jahja%20Setiaatmadja",
			label: "Jahja Setiaatmadja",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Tan%20Ho%20Hien%2FSubur%20Disebut%20Juga%20Subur%20Tan",
			label: "Tan Ho Hien/Subur Disebut Juga Subur Tan",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Tonny%20Kusnadi",
			label: "Tonny Kusnadi",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Vera%20Eve%20Lim",
			label: "Vera Eve Lim",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Lianawaty%20Suwono",
			label: "Lianawaty Suwono",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Santoso",
			label: "Santoso",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Armand%20Wahyudi%20Hartono",
			label: "Armand Wahyudi Hartono",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Frengky%20Chandra%20Kusuma",
			label: "Frengky Chandra Kusuma",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "sh-Gregory%20Hendra%20Lembong",
			label: "Gregory Hendra Lembong",
			subLabel: "Minority shareholder",
			type: "shareholder",
		},
		{
			id: "aff-Djarum",
			label: "Djarum",
			subLabel: "Affiliate metadata · Not ownership",
			type: "affiliate",
		},
		{
			id: "aff-Hartono",
			label: "Hartono",
			subLabel: "Affiliate metadata · Not ownership",
			type: "affiliate",
		},
		{
			id: "cg-Djarum%20Group",
			label: "Djarum Group",
			subLabel: "Conglomerate metadata · Not ownership",
			type: "conglomerate",
		},
	],

	ownershipEdges: [
		{
			id: "e-PT%20Dwimuria%20Investama%20Andalan-BBCA.JK",
			sourceId: "sh-PT%20Dwimuria%20Investama%20Andalan",
			targetId: "BBCA.JK",
			shareholderName: "PT Dwimuria Investama Andalan",
			percentage: 0.54942,
			shareAmount: 67729950000,
			sourceStatus: "reported",
		},
		{
			id: "e-Public-BBCA.JK",
			sourceId: "sh-Public",
			targetId: "BBCA.JK",
			shareholderName: "Public",
			percentage: 0.44642,
			shareAmount: 55031425658,
			sourceStatus: "reported",
		},
		{
			id: "e-Treasury%20Stock-BBCA.JK",
			sourceId: "sh-Treasury%20Stock",
			targetId: "BBCA.JK",
			shareholderName: "Treasury Stock",
			percentage: 0.00351,
			shareAmount: 433298700,
			sourceStatus: "reported",
		},
		{
			id: "e-Jahja%20Setiaatmadja-BBCA.JK",
			sourceId: "sh-Jahja%20Setiaatmadja",
			targetId: "BBCA.JK",
			shareholderName: "Jahja Setiaatmadja",
			percentage: 0.0003,
			shareAmount: 35802700,
			sourceStatus: "reported",
		},
		{
			id: "e-Tan%20Ho%20Hien%2FSubur%20Disebut%20Juga%20Subur%20Tan-BBCA.JK",
			sourceId: "sh-Tan%20Ho%20Hien%2FSubur%20Disebut%20Juga%20Subur%20Tan",
			targetId: "BBCA.JK",
			shareholderName: "Tan Ho Hien/Subur Disebut Juga Subur Tan",
			percentage: 0.0001,
			shareAmount: 11788002,
			sourceStatus: "reported",
		},
		{
			id: "e-Tonny%20Kusnadi-BBCA.JK",
			sourceId: "sh-Tonny%20Kusnadi",
			targetId: "BBCA.JK",
			shareholderName: "Tonny Kusnadi",
			percentage: 0.00006,
			shareAmount: 7819950,
			sourceStatus: "reported",
		},
		{
			id: "e-Vera%20Eve%20Lim-BBCA.JK",
			sourceId: "sh-Vera%20Eve%20Lim",
			targetId: "BBCA.JK",
			shareholderName: "Vera Eve Lim",
			percentage: 0.00003,
			shareAmount: 3281460,
			sourceStatus: "reported",
		},
		{
			id: "e-Lianawaty%20Suwono-BBCA.JK",
			sourceId: "sh-Lianawaty%20Suwono",
			targetId: "BBCA.JK",
			shareholderName: "Lianawaty Suwono",
			percentage: 0.00003,
			shareAmount: 3906242,
			sourceStatus: "reported",
		},
		{
			id: "e-Santoso-BBCA.JK",
			sourceId: "sh-Santoso",
			targetId: "BBCA.JK",
			shareholderName: "Santoso",
			percentage: 0.00003,
			shareAmount: 3764062,
			sourceStatus: "reported",
		},
		{
			id: "e-Armand%20Wahyudi%20Hartono-BBCA.JK",
			sourceId: "sh-Armand%20Wahyudi%20Hartono",
			targetId: "BBCA.JK",
			shareholderName: "Armand Wahyudi Hartono",
			percentage: 0.00003,
			shareAmount: 4256065,
			sourceStatus: "reported",
		},
		{
			id: "e-Frengky%20Chandra%20Kusuma-BBCA.JK",
			sourceId: "sh-Frengky%20Chandra%20Kusuma",
			targetId: "BBCA.JK",
			shareholderName: "Frengky Chandra Kusuma",
			percentage: 0.00002,
			shareAmount: 2835916,
			sourceStatus: "reported",
		},
		{
			id: "e-Gregory%20Hendra%20Lembong-BBCA.JK",
			sourceId: "sh-Gregory%20Hendra%20Lembong",
			targetId: "BBCA.JK",
			shareholderName: "Gregory Hendra Lembong",
			percentage: 0.00002,
			shareAmount: 2666921,
			sourceStatus: "reported",
		},
	],

	metadataEdges: [
		{
			id: "me-Djarum-BBCA.JK",
			sourceId: "BBCA.JK",
			targetId: "aff-Djarum",
			type: "affiliate",
			label: "Affiliate",
		},
		{
			id: "me-Hartono-BBCA.JK",
			sourceId: "BBCA.JK",
			targetId: "aff-Hartono",
			type: "affiliate",
			label: "Affiliate",
		},
		{
			id: "me-cg-Djarum%20Group-BBCA.JK",
			sourceId: "BBCA.JK",
			targetId: "cg-Djarum%20Group",
			type: "conglomerate",
			label: "Conglomerate group",
		},
	],
};

function getShareholderPercentage(id: string) {
	const edge = graphData.ownershipEdges.find((edge) => edge.sourceId === id);

	return edge?.percentage ?? 0;
}

function getShareholderBubbleSize(id: string) {
	const percentage = getShareholderPercentage(id);

	if (percentage >= 0.5) return 132;
	if (percentage >= 0.4) return 126;
	if (percentage >= 0.003) return 84;

	return 76;
}

function getShareholderCategory(id: string) {
	const percentage = getShareholderPercentage(id);

	if (percentage >= 0.5) return "major";
	if (id === "sh-Public" || id === "sh-Treasury%20Stock") {
		return "aggregate";
	}

	return "minority";
}

function buildEntityData(node: GraphData["nodes"][number]): EntityNodeData {
	if (node.type === "company") {
		return {
			label: node.label,
			subLabel: node.subLabel,
			nodeType: "company",
			dotColor: "cyan",
		};
	}

	if (node.type === "affiliate") {
		return {
			label: node.label,
			subLabel: node.subLabel,
			nodeType: "affiliate",
			dotColor: "orange",
		};
	}

	if (node.type === "conglomerate") {
		return {
			label: node.label,
			subLabel: node.subLabel,
			nodeType: "conglomerate",
			dotColor: "purple",
		};
	}

	return {
		label: node.label,
		subLabel: node.subLabel,
		nodeType: "shareholder",
		shareCategory: getShareholderCategory(node.id),
		sharePercentage: getShareholderPercentage(node.id),
		bubbleSize: getShareholderBubbleSize(node.id),
		dotColor: "green",
	};
}

function buildNodes(): EntityNode[] {
	const company = graphData.nodes.find((node) => node.id === "BBCA.JK");

	const shareholders = graphData.nodes.filter(
		(node) =>
			node.type === "shareholder" &&
			graphData.ownershipEdges.some((edge) => edge.sourceId === node.id),
	);

	const metadata = graphData.nodes.filter(
		(node) => node.type === "affiliate" || node.type === "conglomerate",
	);

	if (!company) return [];

	const companyNode: EntityNode = {
		id: company.id,
		type: "customEntity",
		position: {
			x: 480,
			y: 235,
		},
		data: buildEntityData(company),
	};

	const shareholderNodes: EntityNode[] = shareholders.map((node, index) => {
		const positions = [
			{ x: 480, y: -10 },
			{ x: 145, y: 215 },
			{ x: 825, y: 215 },
			{ x: 220, y: -20 },
			{ x: 760, y: -20 },
			{ x: 15, y: 115 },
			{ x: 970, y: 115 },
			{ x: 35, y: 405 },
			{ x: 950, y: 405 },
			{ x: 480, y: 410 },
			{ x: 230, y: 500 },
			{ x: 750, y: 500 },
		];

		return {
			id: node.id,
			type: "customEntity",
			position: positions[index] ?? { x: 480, y: 235 },
			data: buildEntityData(node),
		};
	});

	const metadataNodes: EntityNode[] = metadata.map((node, index) => ({
		id: node.id,
		type: "customEntity",
		position: {
			x: 315 + index * 210,
			y: 610,
		},
		data: buildEntityData(node),
	}));

	return [...shareholderNodes, companyNode, ...metadataNodes];
}

function buildEdges(nodes: EntityNode[]): Edge[] {
	const getPosition = (id: string) =>
		nodes.find((node) => node.id === id)?.position;

	const companyPosition = getPosition("BBCA.JK");

	if (!companyPosition) return [];

	const ownershipEdges: Edge[] = graphData.ownershipEdges
		.map((edge) => {
			const source = getPosition(edge.sourceId);
			const target = getPosition(edge.targetId);

			if (!source || !target) {
				return null;
			}

			const sourceIsAbove = source.y < companyPosition.y;
			const sourceIsLeft = source.x < companyPosition.x;
			const sourceIsRight = source.x > companyPosition.x;

			const sourceHandle = sourceIsAbove
				? "bottom"
				: sourceIsLeft
					? "right"
					: sourceIsRight
						? "left"
						: "top";

			const targetHandle = sourceIsAbove
				? "top"
				: sourceIsLeft
					? "left"
					: sourceIsRight
						? "right"
						: "bottom";

			return {
				id: edge.id,
				source: edge.sourceId,
				target: edge.targetId,
				sourceHandle,
				targetHandle,
				type: "ownership",
				markerEnd: {
					type: MarkerType.ArrowClosed,
					width:
						(edge.percentage ?? 0) >= 0.5 ? 14 : (edge.percentage ?? 0) >= 0.003 ? 12 : 10,
					height:
						(edge.percentage ?? 0) >= 0.5 ? 14 : (edge.percentage ?? 0) >= 0.003 ? 12 : 10,
					color: "#A1A1AA",
				},
				label: `${((edge.percentage ?? 0) * 100).toFixed(3)}%`,
				data: {
					curve: 78,
				},
			};
		})
		.filter(Boolean) as Edge[];

	const metadataEdges: Edge[] = graphData.metadataEdges.map((edge) => ({
		id: edge.id,
		source: edge.sourceId,
		target: edge.targetId,
		sourceHandle: "meta-bottom",
		targetHandle: "top",
		type: "ownership",
		style: {
			stroke: "#D4D4D8",
			strokeDasharray: "4 4",
		},
	}));

	return [...ownershipEdges, ...metadataEdges];
}

export default function OwnershipSlicing() {
	const nodes = useMemo(() => buildNodes(), []);

	const edges = useMemo(() => buildEdges(nodes), [nodes]);

	return (
		<div className="relative h-[520px] w-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
			<ReactFlow
				nodes={nodes.map((node) => ({
					...node,
					draggable: false,
					selectable: false,
					connectable: false,
				}))}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				nodesDraggable={false}
				nodesConnectable={false}
				nodesFocusable={false}
				edgesFocusable={false}
				elementsSelectable={false}
				panOnDrag
				panOnScroll={false}
				zoomOnScroll={false}
				zoomOnPinch={false}
				zoomOnDoubleClick={false}
				minZoom={0.65}
				maxZoom={0.65}
				defaultViewport={{
					x: -95,
					y: -40,
					zoom: 0.65,
				}}
			>
				<Background
					variant={BackgroundVariant.Lines}
					gap={80}
					size={2}
					color="#9C9C9C17"
				/>
			</ReactFlow>

			<div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden items-center gap-3 border border-[var(--color-border)] bg-white/95 px-3 py-2 shadow-sm sm:flex">
				<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
					Legend
				</span>

				<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
					<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-primary)] bg-[var(--color-accent)]" />
					Major
				</div>

				<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
					<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)]" />
					Corporate
				</div>

				<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
					<span className="h-2.5 w-2.5 rounded-full border border-[var(--color-border)] bg-white" />
					Minority
				</div>

				<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
					<span className="h-2.5 w-2.5 rounded-full border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]" />
					Aggregate
				</div>

				<div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
					<span className="w-5 border-t border-dashed border-[var(--color-border-strong)]" />
					Context
				</div>
			</div>
		</div>
	);
}
