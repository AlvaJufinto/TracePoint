export function formatShares(amount: number | null | undefined): string {
	if (amount == null || !Number.isFinite(amount)) {
		return "Not available";
	}

	if (amount >= 1_000_000_000_000) {
		return `${(amount / 1_000_000_000_000).toFixed(2)}T`;
	}

	if (amount >= 1_000_000_000) {
		return `${(amount / 1_000_000_000).toFixed(2)}B`;
	}

	if (amount >= 1_000_000) {
		return `${(amount / 1_000_000).toFixed(2)}M`;
	}

	if (amount >= 1_000) {
		return `${(amount / 1_000).toFixed(0)}K`;
	}

	return amount.toLocaleString();
}

export function percentage(value: number | null | undefined): string {
	return value == null || !Number.isFinite(value)
		? "Not available"
		: `${(value * 100).toFixed(3)}%`;
}
