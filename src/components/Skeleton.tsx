/** @format */

export default function Skeleton({
	className = "",
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-border)] ${className}`}
			{...props}
		/>
	);
}
