/** @format */

type BrandLogoProps = {
	className?: string;
	variant?: "black" | "white";
};

export default function BrandLogo({
	className = "",
	variant = "black",
}: BrandLogoProps) {
	return (
		<img
			alt="TracePoint"
			className={`block w-auto object-contain ${className}`}
			src={variant === "white" ? "/white-logo.png" : "/black-logo.png"}
		/>
	);
}
