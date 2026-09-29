/** @format */

import type { Node } from "reactflow";

export type ShareholderCategory =
	| "major"
	| "minority"
	| "corporate"
	| "aggregate"
	| "other";

export type EntityNodeData = {
	label: string;
	subLabel: string;
	dotColor: "purple" | "orange" | "cyan" | "green" | "gray";
	nodeType:
		| "company"
		| "shareholder"
		| "management"
		| "affiliate"
		| "conglomerate";
	ticker?: string;
	bubbleSize?: number;
	sharePercentage?: number | null;
	holderCategory?: string;
	shareCategory?: ShareholderCategory;
	companyRole?: "target" | "connected";
};

export type EntityNode = Node<EntityNodeData>;
