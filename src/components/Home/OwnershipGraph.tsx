/** @format */

import "reactflow/dist/style.css";

import { useMemo } from "react";

import ReactFlow, {
	Background,
	BackgroundVariant,
	type Edge,
	MarkerType,
	type Node,
} from "reactflow";

import type { EntityNodeData } from "../../interfaces/trace";
import { CustomEntityNode, OwnershipLine } from "../Trace/TraceGraphPrimitives";

const nodeTypes = {
	customEntity: CustomEntityNode,
};

const edgeTypes = {
	ownership: OwnershipLine,
};

type StaticNode = Node<EntityNodeData>;

const staticNodes: StaticNode[] = [
	// Target company
	{
		id: "BBCA.JK",
		type: "customEntity",
		position: {
			x: 480,
			y: 235,
		},
		data: {
			label: "BBCA.JK",
			subLabel: "PT Bank Central Asia Tbk.",
			nodeType: "company",
		},
	},

	// Major shareholder
	{
		id: "dwimuria",
		type: "customEntity",
		position: {
			x: 480,
			y: -10,
		},
		data: {
			label: "PT Dwimuria Investama Andalan",
			subLabel: "Major shareholder",
			nodeType: "shareholder",
			shareCategory: "major",
			sharePercentage: 0.54942,
			bubbleSize: 132,
		},
	},

	// Aggregate shareholders
	{
		id: "public",
		type: "customEntity",
		position: {
			x: 145,
			y: 215,
		},
		data: {
			label: "Public",
			subLabel: "Aggregate holding · Not traceable",
			nodeType: "shareholder",
			shareCategory: "aggregate",
			sharePercentage: 0.44642,
			bubbleSize: 126,
		},
	},

	{
		id: "treasury",
		type: "customEntity",
		position: {
			x: 825,
			y: 215,
		},
		data: {
			label: "Treasury Stock",
			subLabel: "Aggregate holding · Not traceable",
			nodeType: "shareholder",
			shareCategory: "aggregate",
			sharePercentage: 0.00351,
			bubbleSize: 84,
		},
	},

	// Minority shareholders
	{
		id: "gregory",
		type: "customEntity",
		position: {
			x: 220,
			y: -20,
		},
		data: {
			label: "Gregory Hendra Lembong",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00002,
			bubbleSize: 76,
		},
	},

	{
		id: "tan-ho-hien",
		type: "customEntity",
		position: {
			x: 760,
			y: -20,
		},
		data: {
			label: "Tan Ho Hien/Subur Disebut Juga Subur Tan",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.0001,
			bubbleSize: 76,
		},
	},

	{
		id: "frengky",
		type: "customEntity",
		position: {
			x: 15,
			y: 115,
		},
		data: {
			label: "Frengky Chandra Kusuma",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00002,
			bubbleSize: 76,
		},
	},

	{
		id: "tonny",
		type: "customEntity",
		position: {
			x: 970,
			y: 115,
		},
		data: {
			label: "Tonny Kusnadi",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00006,
			bubbleSize: 76,
		},
	},

	{
		id: "armand",
		type: "customEntity",
		position: {
			x: 35,
			y: 405,
		},
		data: {
			label: "Armand Wahyudi Hartono",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00003,
			bubbleSize: 76,
		},
	},

	{
		id: "vera",
		type: "customEntity",
		position: {
			x: 950,
			y: 405,
		},
		data: {
			label: "Vera Eve Lim",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00003,
			bubbleSize: 76,
		},
	},

	{
		id: "jahja",
		type: "customEntity",
		position: {
			x: 480,
			y: 410,
		},
		data: {
			label: "Jahja Setiaatmadja",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.0003,
			bubbleSize: 76,
		},
	},

	{
		id: "lianawaty",
		type: "customEntity",
		position: {
			x: 230,
			y: 500,
		},
		data: {
			label: "Lianawaty Suwono",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00003,
			bubbleSize: 76,
		},
	},

	{
		id: "santoso",
		type: "customEntity",
		position: {
			x: 750,
			y: 500,
		},
		data: {
			label: "Santoso",
			subLabel: "Minority shareholder",
			nodeType: "shareholder",
			shareCategory: "minority",
			sharePercentage: 0.00003,
			bubbleSize: 76,
		},
	},

	// Metadata context
	{
		id: "djarum",
		type: "customEntity",
		position: {
			x: 315,
			y: 610,
		},
		data: {
			label: "Djarum",
			subLabel: "Affiliate metadata · Not ownership",
			nodeType: "affiliate",
		},
	},

	{
		id: "hartono",
		type: "customEntity",
		position: {
			x: 525,
			y: 610,
		},
		data: {
			label: "Hartono",
			subLabel: "Affiliate metadata · Not ownership",
			nodeType: "affiliate",
		},
	},

	{
		id: "djarum-group",
		type: "customEntity",
		position: {
			x: 735,
			y: 610,
		},
		data: {
			label: "Djarum Group",
			subLabel: "Conglomerate metadata · Not ownership",
			nodeType: "conglomerate",
		},
	},
];

const staticEdges: Edge[] = [
	// Major
	{
		id: "ownership-dwimuria",
		source: "dwimuria",
		target: "BBCA.JK",
		sourceHandle: "bottom",
		targetHandle: "top",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 14,
			height: 14,
			color: "#A1A1AA",
		},
		label: "54.942%",
		data: {
			curve: 78,
		},
	},

	// Aggregates
	{
		id: "ownership-public",
		source: "public",
		target: "BBCA.JK",
		sourceHandle: "right",
		targetHandle: "left",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 12,
			height: 12,
			color: "#A1A1AA",
		},
		label: "44.642%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-treasury",
		source: "treasury",
		target: "BBCA.JK",
		sourceHandle: "left",
		targetHandle: "right",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 12,
			height: 12,
			color: "#A1A1AA",
		},
		label: "0.351%",
		data: {
			curve: 78,
		},
	},

	// Minority
	{
		id: "ownership-gregory",
		source: "gregory",
		target: "BBCA.JK",
		sourceHandle: "bottom",
		targetHandle: "top",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.002%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-tan",
		source: "tan-ho-hien",
		target: "BBCA.JK",
		sourceHandle: "bottom",
		targetHandle: "top",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.010%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-frengky",
		source: "frengky",
		target: "BBCA.JK",
		sourceHandle: "right",
		targetHandle: "left",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.002%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-tonny",
		source: "tonny",
		target: "BBCA.JK",
		sourceHandle: "left",
		targetHandle: "right",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.006%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-armand",
		source: "armand",
		target: "BBCA.JK",
		sourceHandle: "right",
		targetHandle: "left",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.003%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-vera",
		source: "vera",
		target: "BBCA.JK",
		sourceHandle: "left",
		targetHandle: "right",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.003%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-jahja",
		source: "jahja",
		target: "BBCA.JK",
		sourceHandle: "top",
		targetHandle: "bottom",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.030%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-lianawaty",
		source: "lianawaty",
		target: "BBCA.JK",
		sourceHandle: "right",
		targetHandle: "bottom",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.003%",
		data: {
			curve: 78,
		},
	},

	{
		id: "ownership-santoso",
		source: "santoso",
		target: "BBCA.JK",
		sourceHandle: "left",
		targetHandle: "bottom",
		type: "ownership",
		markerEnd: {
			type: MarkerType.ArrowClosed,
			width: 10,
			height: 10,
			color: "#A1A1AA",
		},
		label: "0.003%",
		data: {
			curve: 78,
		},
	},

	// Metadata context
	{
		id: "metadata-djarum",
		source: "BBCA.JK",
		target: "djarum",
		sourceHandle: "meta-bottom",
		targetHandle: "top",
		type: "ownership",
		style: {
			stroke: "#D4D4D8",
			strokeDasharray: "4 4",
		},
	},

	{
		id: "metadata-hartono",
		source: "BBCA.JK",
		target: "hartono",
		sourceHandle: "meta-bottom",
		targetHandle: "top",
		type: "ownership",
		style: {
			stroke: "#D4D4D8",
			strokeDasharray: "4 4",
		},
	},

	{
		id: "metadata-djarum-group",
		source: "BBCA.JK",
		target: "djarum-group",
		sourceHandle: "meta-bottom",
		targetHandle: "top",
		type: "ownership",
		style: {
			stroke: "#D4D4D8",
			strokeDasharray: "4 4",
		},
	},
];

export default function OwnershipSlicing() {
	const nodes = useMemo(
		() =>
			staticNodes.map((node) => ({
				...node,
				draggable: false,
				selectable: false,
				connectable: false,
			})),
		[],
	);

	const edges = useMemo(() => staticEdges, []);

	return (
		<div className="relative h-[520px] w-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
			<ReactFlow
				nodes={nodes}
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
