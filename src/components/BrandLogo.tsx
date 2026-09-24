type BrandLogoProps = {
	className?: string;
	iconOnly?: boolean;
};

export default function BrandLogo({
	className = "",
	iconOnly = false,
}: BrandLogoProps) {
	return (
		<span
			aria-label="TracePoint"
			className={`inline-flex items-center gap-[0.55em] font-semibold leading-none tracking-[-0.045em] ${className}`}
			role="img"
		>
			<svg
				aria-hidden="true"
				className="h-[1.05em] w-auto shrink-0"
				fill="none"
				viewBox="0 0 145 68"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0 34C0 15.2 14.1 0 32 0c14.2 0 23.1 8.9 32.2 20 5.9 7.2 10.8 10 16.8 10 6.1 0 11-2.8 17-9 6.2-6.8 14.1-11 23-11 13.3 0 24 10.7 24 24s-10.7 24-24 24c-8.9 0-16.8-4.2-23-11-6-6.2-10.9-9-17-9-6 0-10.9 2.8-16.8 10C55.1 59.1 46.2 68 32 68 14.1 68 0 52.8 0 34Z"
					fill="var(--color-accent)"
				/>
			</svg>
			{!iconOnly && <span aria-hidden="true">TracePoint</span>}
		</span>
	);
}