/** @format */

import { Link } from "react-router-dom";

import PanelFeedback from "./PanelFeedback";
import type {
	PanelState,
	TracePointCompany,
	TracePointOwnershipSnapshot,
} from "../../types/tracepoint";

type Props = {
	ticker: string;
	company: PanelState<TracePointCompany>;
	ownership: PanelState<TracePointOwnershipSnapshot>;
	continuedName: string | null;
	origin: string | null;
	searchLink: string;
	retryCompany: () => void;
};

export default function TraceHeader({
	ticker,
	company,
	ownership,
	continuedName,
	origin,
	searchLink,
	retryCompany,
}: Props) {
	return (
		<header className="mb-6">
			<div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
				<h1 className="text-3xl font-bold">{ticker.replace(/\.JK$/, "")}</h1>
				<p className="text-base">
					{company.data?.name ||
						ownership.data?.companyName ||
						(company.status === "loading"
							? "Loading company…"
							: "Company name unavailable")}
				</p>
			</div>

			<PanelFeedback
				state={company}
				label="company details"
				retry={retryCompany}
			/>

			{continuedName && (
				<p className="mt-3 break-words text-sm">
					Continuing trace of <strong>{continuedName}</strong>
					{origin && (
						<>
							{" "}
							from{" "}
							<Link
								className="underline"
								to={
									"/trace?" +
									new URLSearchParams({
										ticker: origin,
										shareholder: continuedName,
										returnTo: searchLink,
									})
								}
							>
								{origin}
							</Link>
						</>
					)}
					. Inspect this company’s report to continue.
				</p>
			)}
		</header>
	);
}
