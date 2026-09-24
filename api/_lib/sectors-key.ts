import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

/** Local files take precedence only in development, never in deployment. */
export function getSectorsApiKey(): string | undefined {
	const isLocal = process.env.VERCEL_ENV === "development" ||
		(process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production" &&
			!process.env.VERCEL_ENV);

	if (isLocal) {
		for (const file of [".env.local", ".env"]) {
			let contents: string;
			try {
				contents = readFileSync(resolve(process.cwd(), file), "utf8");
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
				throw error;
			}
			const key = parseEnv(contents).SECTORS_API_KEY;
			if (key !== undefined) return key.trim() || undefined;
		}
	}

	return process.env.SECTORS_API_KEY?.trim() || undefined;
}
