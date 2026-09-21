/** @format */

const Investigation = () => {
	return (
		<div className="flex h-screen bg-[#080d14] text-white font-sans overflow-hidden">
			{/* Left Sidebar Layout */}
			<aside className="w-72 border-r border-[#1d3245] flex flex-col z-10 shrink-0">
				{/* Logo Area */}
				<div className="h-16 border-b border-[#1d3245] flex flex-col justify-center px-6 shrink-0">
					<span className="text-[17px] font-bold tracking-wide leading-tight">
						TracePoint
					</span>
					<span className="text-[9px] font-bold text-[#00c3d9] tracking-widest uppercase">
						Ownership Explorer
					</span>
				</div>

				{/* Investigation Path */}
				<div className="p-6 flex flex-col flex-1">
					<div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-6">
						Investigation Path
					</div>

					<div className="flex flex-col gap-2 flex-1">
						{/* Step 1 */}
						<div className="px-4 py-3 rounded-xl border border-transparent">
							<div className="text-white font-bold text-sm mb-0.5">
								<span className="text-gray-500 mr-2">01</span> Search
							</div>
							<div className="text-xs text-gray-500 pl-6">BBCA.JK</div>
						</div>

						{/* Step 2 */}
						<div className="px-4 py-3 rounded-xl border border-transparent">
							<div className="text-white font-bold text-sm mb-0.5">
								<span className="text-gray-500 mr-2">02</span> Map
							</div>
							<div className="text-xs text-gray-500 pl-6">PT Dwimuria</div>
						</div>

						{/* Step 3 */}
						<div className="px-4 py-3 rounded-xl border border-transparent">
							<div className="text-white font-bold text-sm mb-0.5">
								<span className="text-gray-500 mr-2">03</span> Trace
							</div>
							<div className="text-xs text-gray-500 pl-6">3 confirmed</div>
						</div>

						{/* Step 4 (Active) */}
						<div className="px-4 py-3 rounded-xl border border-[#00c3d9] bg-[#0c1824] shadow-sm">
							<div className="text-[#00c3d9] font-bold text-sm mb-0.5">
								<span className="mr-2">04</span> Context
							</div>
							<div className="text-xs text-gray-400 pl-6">TOWR.JK</div>
						</div>
					</div>

					<button className="mt-6 w-full py-2.5 rounded-lg border border-[#1d3245] bg-[#0c1824] text-sm text-[#00c3d9] hover:bg-[#122a3d] transition-colors font-medium">
						Restart from BBCA search
					</button>
				</div>
			</aside>

			{/* Main Content Layout */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top Header */}
				<header className="h-16 border-b border-[#1d3245] flex items-center justify-between px-8 bg-[#080d14] shrink-0">
					<div className="text-sm text-gray-400 flex items-center gap-2">
						<span>BBCA.JK</span>
						<span className="text-gray-600">/</span>
						<span>PT Dwimuria Investama Andalan</span>
						<span className="text-gray-600">/</span>
						<span className="text-gray-300">TOWR.JK</span>
					</div>

					<div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1d3245] bg-[#080d14] text-xs font-medium text-gray-300">
						<div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
						Confirmed source
					</div>
				</header>

				{/* Dashboard Workspace */}
				<main className="flex-1 overflow-y-auto p-8 lg:p-10 bg-[#080d14]">
					<div className="max-w-5xl">
						<h1 className="text-3xl font-bold mb-2 text-white">
							Ownership context — TOWR.JK
						</h1>
						<p className="text-sm text-gray-400 mb-10">
							Sarana Menara Nusantara · relationship traced from PT Dwimuria
							Investama Andalan
						</p>

						{/* Top Verified Banner */}
						<div className="border border-[#183a30] bg-[#051310] rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
							<div>
								<h3 className="text-[#4ade80] font-bold text-lg mb-1">
									Confirmed relationship
								</h3>
								<p className="text-sm text-gray-400">
									Candidate verified against TOWR Company Report ownership
									before entering the graph.
								</p>
							</div>

							<div className="bg-[#0c1824] border border-[#1d3245] rounded-xl px-5 py-4 min-w-[280px]">
								<div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
									SOURCE STATUS
								</div>
								<div className="text-[#4ade80] text-sm font-semibold">
									Confirmed via Company Report
								</div>
							</div>
						</div>

						{/* 3-Column Stats Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							{/* Reported Ownership Card */}
							<div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-6 flex flex-col">
								<div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">
									REPORTED OWNERSHIP
								</div>
								<div className="text-2xl font-bold text-[#f5a623] mb-4">
									Not available
								</div>
								<p className="text-sm text-gray-400 leading-relaxed">
									Sectors confirmed the shareholder name, but did not provide a
									percentage for TOWR.
								</p>
							</div>

							{/* Ownership Date Card */}
							<div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-6 flex flex-col">
								<div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">
									OWNERSHIP DATE
								</div>
								<div className="text-2xl font-bold text-[#f5a623] mb-4">
									Not available
								</div>
								<p className="text-sm text-gray-400 leading-relaxed">
									No synthetic as-of date is generated.
								</p>
							</div>

							{/* Relationship Type Card */}
							<div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-6 flex flex-col">
								<div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">
									RELATIONSHIP TYPE
								</div>
								<div className="text-2xl font-bold text-[#00c3d9] mb-4">
									Ownership
								</div>
								<p className="text-sm text-gray-400 leading-relaxed">
									Solid graph edge · Sectors-reported, not independently
									verified.
								</p>
							</div>
						</div>

						{/* Bottom 2-Column Section */}
						<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
							{/* Evidence Retained Card */}
							<div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-6">
								<h3 className="text-lg font-bold text-white mb-6">
									Evidence retained for audit
								</h3>

								<div className="flex flex-col gap-6">
									<div className="grid grid-cols-[200px_1fr] gap-4 items-start">
										<div className="text-sm text-gray-400">
											Screener raw name
										</div>
										<div className="text-sm text-white font-medium">
											PT Dwimuria Investama Andalan
										</div>
									</div>

									<div className="grid grid-cols-[200px_1fr] gap-4 items-start">
										<div className="text-sm text-gray-400">
											Company Report raw name
										</div>
										<div className="text-sm text-white font-medium">
											PT Dwimuria Investama Andalan
										</div>
									</div>

									<div className="grid grid-cols-[200px_1fr] gap-4 items-start">
										<div className="text-sm text-gray-400">
											Verification result
										</div>
										<div className="text-sm text-white font-medium">
											Exact normalized-name match
										</div>
									</div>

									<div className="grid grid-cols-[200px_1fr] gap-4 items-start">
										<div className="text-sm text-gray-400">Source</div>
										<div className="text-sm text-white font-medium">
											Sectors Financial API v2
										</div>
									</div>
								</div>
							</div>

							{/* Continue Investigation Card */}
							<div className="bg-[#0c1824] border border-[#1d3245] rounded-2xl p-6 flex flex-col justify-between">
								<div>
									<h3 className="text-lg font-bold text-white mb-3">
										Continue investigation
									</h3>
									<p className="text-sm text-gray-400 mb-6">
										Open TOWR as the new focal company without automatically
										expanding the full graph.
									</p>
								</div>

								<div className="flex flex-col gap-4 mt-auto">
									<button className="w-full bg-[#00c3d9] hover:bg-[#00a8bb] text-[#080d14] font-bold py-3 rounded-xl transition-colors">
										Open TOWR workspace
									</button>
									<div className="text-[10px] text-[#4ade80] font-medium tracking-wide">
										On-demand only · cache-aware · no blind refetch
									</div>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Investigation;
