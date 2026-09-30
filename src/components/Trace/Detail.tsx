/** @format */

import type { ReactNode } from "react";

export default function Detail({
	label,
	value,
}: {
	label: string;
	value: ReactNode;
}) {
	return (
		<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
			<dt className="text-(--color-muted)">{label}</dt>
			<dd className="font-semibold tabular-nums">{value}</dd>
		</div>
	);
}
