
import { curl } from "./curl.ts";
import { ROUTES_URL } from "./consts.ts";

const CACHE_FN = "routes.lst";

export async function get(proxy?: string): Promise<string[]> {
	let fi;
	try {
		fi = await Deno.stat(CACHE_FN);
	} catch (e) {
		if (e instanceof Deno.errors.NotFound) {
			fi = null;
		} else if (e instanceof Deno.errors.NotCapable) {
			console.error("read permission not granted");
			throw e
		} else {
			console.error("unexpected error");
			throw e
		}
	}
	let routes;
	if (fi !== null && fi.size > 0 && fi.mtime !== null && since(fi.mtime) < 24 * 3600 * 1000) {
		console.error("cache is fresh enough");
		routes = await Deno.readFile(CACHE_FN);
	} else {
		// fetch doesn't support socks proxy, we are gonna cheat by calling curl instead
		console.error("cache is missing/stale, try refreshing ...");
		const { code, out } = await curl(ROUTES_URL, proxy);
		if (code === 0) {
			console.error("cache refreshed");
			await Deno.writeFile(CACHE_FN, out);
			routes = out;
		} else if (fi !== null && fi.size > 0) {
			console.error("failed, fallback to cache");
			routes = await Deno.readFile(CACHE_FN);
		} else {
			throw "failed";
		}
	}

	return (new TextDecoder).decode(routes).split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0 && l.charAt(0) !== "#"); // remove empty lines and comments
}

function since(d: Date): number {
	return Date.now() - d.getTime();
}
