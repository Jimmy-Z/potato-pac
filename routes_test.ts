
import { get } from "./routes.ts";

Deno.test("routes", async () => {
	const routes = await get();
	const stats: number[] = [];
	for (const l of routes) {
		const len = parseInt(l.split("/")[1]);
		const c = stats[len];
		if (c === undefined) {
			stats[len] = 1;
		} else {
			stats[len] = c + 1;
		}
	}
	let entries = 0;
	let addrs = 0;
	for (const i in stats) {
		const len = parseInt(i);
		const count = stats[len];
		entries += count;
		addrs += count << (32 - len);
	}
	console.log("total:", entries, addrs);
	let c_entries = 0;
	let c_addrs = 0;
	for (const i in stats) {
		const len = parseInt(i);
		const count = stats[len];
		c_entries += count;
		c_addrs += count << (32 - len);
		console.log(`${len}: ${count}, ${c_entries / entries}, ${c_addrs / addrs}`);
	}
});
