import { assertEquals } from "jsr:@std/assert";

import { curl } from "./curl.ts";

Deno.test("curl", async () => {
	const { code, out } = await curl("https://cloudflare.com/cdn-cgi/trace");
	assertEquals(code, 0);
	console.log(out);
});
