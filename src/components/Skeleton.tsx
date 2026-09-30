/** @format */

export default function Skeleton({
	className = "",
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			className={`animate-pulse rounded-(--radius-sm) bg-(--color-border) ${className}`}
			{...props}
		/>
	);
}
