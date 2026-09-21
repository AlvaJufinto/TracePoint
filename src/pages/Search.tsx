/** @format */

import { Search } from "lucide-react";

const SearchPage = () => {
	return (
		<div className="min-h-screen bg-[#080d14] text-white font-sans relative overflow-hidden flex flex-col">
			{/* Background Decorative Circles */}
			<div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#0c1a24] rounded-full opacity-50 blur-3xl pointer-events-none" />
			<div className="absolute top-[-30%] right-[-20%] w-[1200px] h-[1200px] bg-[#0a141d] rounded-full opacity-80 blur-3xl pointer-events-none" />

			{/* Navigation */}
			<nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto w-full">
				<div className="flex items-center gap-3">
					<div className="relative flex items-center justify-center">
						<Search className="w-8 h-8 text-[#00c3d9]" strokeWidth={2.5} />
						<div className="absolute w-1.5 h-1.5 bg-[#00c3d9] rounded-full mt-[-2px] ml-[-2px]" />
					</div>
					<div className="flex flex-col">
						<span className="text-xl font-bold tracking-wide">TracePoint</span>
						<span className="text-[10px] font-bold text-[#00c3d9] tracking-widest mt-[-2px]">
							OWNERSHIP EXPLORER
						</span>
					</div>
				</div>
				<a
					href="#"
					className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
				>
					How it works
				</a>
			</nav>

			{/* Main Content */}
			<main className="relative z-10 flex-grow flex flex-col px-8 pb-12 max-w-[1400px] mx-auto w-full mt-12 lg:mt-24">
				<div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-24 mb-16">
					{/* Left Column */}
					<div className="flex flex-col items-start pt-4">
						<div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#1d3245] bg-transparent mb-8">
							<span className="text-[11px] font-semibold tracking-wide text-[#00c3d9]">
								SECTORS-NATIVE RESEARCH
							</span>
						</div>

						<h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
							Trace ownership. <br />
							<span className="text-[#00c3d9]">Follow the connection.</span>
						</h1>

						<p className="text-[#8ba3b8] text-[15px] mb-12 max-w-xl leading-relaxed">
							Mulai dari satu emiten, lihat siapa yang terhubung, lalu telusuri{" "}
							<span className="underline decoration-[#00c3d9] decoration-1 underline-offset-4">
								entitas tersebut ke emiten lain—tanpa mengarang hubungan.
							</span>
						</p>

						{/* Empty Search Box Area */}
						<div className="w-full h-20 rounded-xl border border-[#1d3245] bg-[#0c1824] mb-8" />

						<div className="flex flex-col gap-4">
							<span className="text-[11px] font-bold text-gray-500 tracking-wider">
								TRY A VALIDATED TICKER
							</span>
							<div className="flex flex-wrap gap-3">
								{["BBCA", "BREN", "ADRO", "AMMN", "TLKM"].map((ticker) => (
									<button
										key={ticker}
										className="px-6 py-2 rounded-full border border-[#1d3245] bg-[#122230] text-sm text-gray-300 hover:bg-[#1a2f42] hover:text-white transition-colors"
									>
										{ticker}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Right Column (Investigation Flow Card) */}
					<div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-8 h-fit shadow-2xl">
						<h3 className="text-[11px] font-bold text-[#00c3d9] tracking-wider mb-8">
							INVESTIGATION FLOW
						</h3>

						<div className="relative flex flex-col gap-8">
							{/* Vertical connecting line */}
							<div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#1d3245]" />

							<div className="relative flex items-start gap-6">
								<div className="w-10 h-10 rounded-full bg-[#122a3d] text-[#00c3d9] flex items-center justify-center text-xs font-semibold z-10 ring-4 ring-[#0c1824]">
									01
								</div>
								<div className="pt-2">
									<h4 className="text-white font-semibold text-lg mb-1">Map</h4>
									<p className="text-gray-400 text-sm">
										See reported ownership
									</p>
								</div>
							</div>

							<div className="relative flex items-start gap-6">
								<div className="w-10 h-10 rounded-full bg-[#122a3d] text-[#00c3d9] flex items-center justify-center text-xs font-semibold z-10 ring-4 ring-[#0c1824]">
									02
								</div>
								<div className="pt-2">
									<h4 className="text-white font-semibold text-lg mb-1">
										Inspect
									</h4>
									<p className="text-gray-400 text-sm">
										Open raw entity details
									</p>
								</div>
							</div>

							<div className="relative flex items-start gap-6">
								<div className="w-10 h-10 rounded-full bg-[#122a3d] text-[#00c3d9] flex items-center justify-center text-xs font-semibold z-10 ring-4 ring-[#0c1824]">
									03
								</div>
								<div className="pt-2">
									<h4 className="text-white font-semibold text-lg mb-1">
										Trace
									</h4>
									<p className="text-gray-400 text-sm">
										Verify cross-company links
									</p>
								</div>
							</div>

							<div className="relative flex items-start gap-6">
								<div className="w-10 h-10 rounded-full bg-[#122a3d] text-[#00c3d9] flex items-center justify-center text-xs font-semibold z-10 ring-4 ring-[#0c1824]">
									04
								</div>
								<div className="pt-2">
									<h4 className="text-white font-semibold text-lg mb-1">
										Context
									</h4>
									<p className="text-gray-400 text-sm">
										Read float & composition
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer Card */}
				<div className="bg-[#0c1824] border border-[#1d3245] rounded-xl p-6 mt-auto flex flex-col md:flex-row items-start md:items-center gap-6">
					<div className="inline-flex items-center px-4 py-2 rounded-full bg-[#122a3d] whitespace-nowrap">
						<span className="text-xs font-semibold tracking-wide text-[#b59f77]">
							DATA BOUNDARY
						</span>
					</div>
					<div className="flex flex-col">
						<h4 className="text-white font-medium text-base mb-1">
							Ownership is reported by Sectors—not verified beneficial
							ownership.
						</h4>
						<p className="text-gray-400 text-sm">
							Missing values remain Not available. Affiliate and conglomerate
							links are context metadata.
						</p>
					</div>
				</div>
			</main>
		</div>
	);
};

export default SearchPage;
