import assert from "node:assert/strict";

import { serializeSectorsUrl } from "../../api/_lib/sectors-fetch";

const url = new URL("https://api.sectors.app/v2/companies/");
url.searchParams.set(
	"where",
	"major_shareholders_name like '%PT Dwimuria Investama Andalan%'",
);
url.searchParams.set("limit", "3");

const serialized = serializeSectorsUrl(url);
assert.ok(
	!serialized.includes("+"),
	"Sectors query spaces must use %20 because the upstream parser treats + literally",
);
assert.ok(serialized.includes("major_shareholders_name%20like%20"));
assert.ok(serialized.includes("PT%20Dwimuria%20Investama%20Andalan"));

console.log("✓ Sectors URLs encode structured-query spaces as %20");
