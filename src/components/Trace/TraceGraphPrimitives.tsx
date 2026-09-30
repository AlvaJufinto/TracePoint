/** @format */

import { Building2 } from "lucide-react";
import { BaseEdge, type EdgeProps, Handle, Position } from "reactflow";

import type { EntityNodeData } from "../../interfaces/trace";

const MIN_BUBBLE_SIZE = 76;

export function CustomEntityNode({
	data,
	selected,
}: {
	data: EntityNodeData;
	selected?: boolean;
}) {
	const isCompany = data.nodeType === "company";
	const isShareholder = data.nodeType === "shareholder";
	const isConnectedCompany = isCompany && data.companyRole === "connected";

	if (isConnectedCompany) {
		return (
			<div
				className={`relative flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full border-2 px-4 text-center shadow-sm transition-all duration-200 select-none ${selected ? "border-(--color-primary) bg-(--color-accent)/25" : "border-(--color-primary) bg-white hover:bg-(--color-accent)/10"}`}
			>
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={id}
						id={id}
						type="target"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!h-2.5 !w-2.5 !border-2 !border-white !bg-(--color-primary)"
					/>
				))}
				<div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-(--color-muted)">
					<Building2 size={11} aria-hidden="true" />
					Connected company
				</div>
				<div className="mt-1 text-sm font-bold text-(--color-primary)">
					{data.label.replace(/\.JK$/, "")}
				</div>
				<div
					className="mt-1 line-clamp-2 text-[9px] leading-tight text-(--color-muted)"
					title={data.subLabel}
				>
					{data.subLabel}
				</div>
				<div className="mt-1 text-xs font-bold tabular-nums text-(--color-primary)">
					{data.sharePercentage == null
						? "N/A"
						: `${(data.sharePercentage * 100).toFixed(3)}%`}
				</div>
			</div>
		);
	}

	if (isShareholder) {
		const size = data.bubbleSize ?? MIN_BUBBLE_SIZE;
		const category = data.shareCategory ?? "other";
		const isLarge = size >= 132;
		const isMedium = size >= 102 && size < 132;
		const categoryLabel =
			category === "aggregate"
				? "Aggregate"
				: category === "corporate"
					? "Corporate"
					: category === "major"
						? "Major"
						: category === "minority"
							? "Minority"
							: "Shareholder";
		const categoryClasses = {
			major: "border-(--color-primary) bg-(--color-accent)/15",
			corporate: "border-(--color-border-strong) bg-(--color-surface)",
			minority: "border-(--color-border) bg-white",
			aggregate:
				"border-(--color-border-strong) border-dashed bg-(--color-surface)",
			other: "border-(--color-border) bg-white",
		}[category];
		const selectedClasses = selected
			? "border-2 border-(--color-primary) bg-(--color-accent)/20"
			: "border";
		const indicatorClasses = {
			major: "bg-(--color-accent)",
			corporate: "bg-(--color-border-strong)",
			minority: "bg-(--color-border)",
			aggregate: "border border-(--color-border-strong) bg-transparent",
			other: "bg-(--color-border)",
		}[category];
		return (
			<div
				className={`relative flex flex-col items-center justify-center rounded-full text-center transition-colors duration-150 select-none ${categoryClasses} ${selectedClasses}`}
				style={{
					width: size,
					height: size,
					padding: isLarge ? "14px" : isMedium ? "10px" : "7px",
				}}
			>
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={id}
						id={id}
						type="source"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!opacity-0 !pointer-events-none"
					/>
				))}
				<div className="pointer-events-none flex max-w-[88%] flex-col items-center justify-center overflow-hidden">
					<div className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-(--color-muted)">
						<span className={`h-1.5 w-1.5 shrink-0 ${indicatorClasses}`} />
						{(isLarge || isMedium) && <span>{categoryLabel}</span>}
					</div>
					<div
						title={data.label}
						className={`break-words font-semibold leading-tight text-(--color-primary) ${isLarge ? "line-clamp-3 text-xs" : isMedium ? "line-clamp-2 text-[11px]" : "line-clamp-2 text-[10px]"}`}
					>
						{data.label}
					</div>
					<div
						className={`mt-1 tabular-nums tracking-tight font-bold text-(--color-primary) ${isLarge ? "text-sm" : isMedium ? "text-xs" : "text-[10px]"}`}
					>
						{data.sharePercentage != null
							? `${(data.sharePercentage * 100).toFixed(2)}%`
							: "N/A"}
					</div>
				</div>
			</div>
		);
	}

	if (isCompany)
		return (
			<div
				className={`relative flex h-[92px] w-[240px] flex-col justify-center rounded-(--radius-sm) border px-4 py-3 transition-colors select-none ${selected ? "border-2 border-(--color-primary) bg-(--color-accent)/15" : "border-(--color-border-strong) bg-white hover:border-(--color-primary)"}`}
			>
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={id}
						id={id}
						type="target"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!h-2.5 !w-2.5 !border-2 !border-white !bg-(--color-primary)"
					/>
				))}
				{["top", "right", "bottom", "left"].map((id) => (
					<Handle
						key={`meta-${id}`}
						id={`meta-${id}`}
						type="source"
						position={
							id === "top"
								? Position.Top
								: id === "right"
									? Position.Right
									: id === "bottom"
										? Position.Bottom
										: Position.Left
						}
						className="!pointer-events-none !opacity-0"
					/>
				))}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--color-muted)">
						<Building2 size={13} aria-hidden="true" />
						<span>Target Company</span>
					</div>
					<span className="h-2 w-2 bg-(--color-accent)" title="Active Target" />
				</div>
				<div className="mt-1">
					<div
						title={data.label}
						className="truncate text-lg font-bold tracking-tight text-(--color-primary)"
					>
						{data.label}
					</div>
					<div
						title={data.subLabel}
						className="truncate text-xs text-(--color-muted)"
					>
						{data.subLabel}
					</div>
				</div>
			</div>
		);

	const isAffiliate = data.nodeType === "affiliate";
	return (
		<div
			className={`relative flex min-h-[62px] w-[196px] flex-col justify-center rounded-(--radius-sm) border border-dashed px-3 py-2 transition-colors select-none ${selected ? "border-2 border-(--color-primary) bg-(--color-accent)/10" : "border-(--color-border-strong) bg-(--color-surface) hover:border-(--color-primary)"}`}
		>
			{["top", "right", "bottom", "left"].map((id) => (
				<Handle
					key={id}
					id={id}
					type="target"
					position={
						id === "top"
							? Position.Top
							: id === "right"
								? Position.Right
								: id === "bottom"
									? Position.Bottom
									: Position.Left
					}
					className="!h-2 !w-2 !opacity-0"
				/>
			))}
			<div className="flex items-center gap-1.5">
				<span
					className="h-1.5 w-1.5 border border-(--color-border-strong)"
					aria-hidden="true"
				/>
				<span className="text-[9px] font-bold uppercase tracking-wider text-(--color-muted)">
					{isAffiliate ? "Affiliate Context" : "Conglomerate Group"}
				</span>
			</div>
			<div
				className="mt-1 truncate text-xs font-semibold text-(--color-primary)"
				title={data.label}
			>
				{data.label}
			</div>
			<div className="truncate text-[10px] leading-tight text-(--color-muted)">
				{data.subLabel}
			</div>
		</div>
	);
}

export function OwnershipLine(props: EdgeProps) {
	const dx = props.sourceX - props.targetX;
	const dy = props.sourceY - props.targetY;
	const distance = Math.sqrt(dx * dx + dy * dy) || 1;
	const curve = typeof props.data?.curve === "number" ? props.data.curve : 78;
	const outwardX = (dx / distance) * curve;
	const outwardY = (dy / distance) * curve;
	const control1X = props.sourceX + outwardX;
	const control1Y = props.sourceY + outwardY;
	const control2X = props.targetX + outwardX * 0.62;
	const control2Y = props.targetY + outwardY * 0.62;
	const path = `M ${props.sourceX},${props.sourceY} C ${control1X},${control1Y} ${control2X},${control2Y} ${props.targetX},${props.targetY}`;
	const labelX =
		(props.sourceX + 3 * control1X + 3 * control2X + props.targetX) / 8;
	const labelY =
		(props.sourceY + 3 * control1Y + 3 * control2Y + props.targetY) / 8;
	return (
		<BaseEdge
			path={path}
			markerEnd={props.markerEnd}
			style={props.style}
			label={props.label}
			labelX={labelX}
			labelY={labelY}
			labelStyle={{ fill: "#18181B", fontSize: 9, fontWeight: 700 }}
			labelBgStyle={{ fill: "#FFFFFF", stroke: "#D4D4D8", strokeWidth: 1 }}
			labelBgPadding={[5, 2]}
			labelBgBorderRadius={2}
		/>
	);
}
