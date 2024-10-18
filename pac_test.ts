import { assertEquals } from "jsr:@std/assert";

import { exported_for_testing } from "./pac.ts";
const { ip2n, chk_ip_in_set, chk_host_in_set, PRIVATE, FindProxyForURL, dns_lut } = exported_for_testing;

// to do: more test cases

Deno.test("ip2n", () => {
	const cases = [
		"127.0.0.1",
		"1.1.1.1",
		"8.8.8.8",
		"172.25.0.1",
		"192.0.2.172",
		"172.2.0.192",
	];
	for (const ip of cases) {
		const n = ip2n(ip);
		console.log(`${ip} -> ${n}(${n.toString(16)})`);
	}
});

Deno.test("chk_ip_in_set", () => {
	const tests: [string, boolean][] = [
		["10.0.0.1", true],
		["127.0.0.1", true],
		["169.254.0.1", true],
		["172.25.0.1", true],
		["192.168.250.1", true],
		["192.169.0.0", false],
		["1.1.1.1", false],
		["172.15.255.255", false],
	];
	for (const t of tests) {
		assertEquals(chk_ip_in_set(ip2n(t[0]), PRIVATE), t[1]);
	}
});

Deno.test("chk_host_in_set", () => {
	const set = new Set([
		"a",
		"a.b"
	]);
	const tests: [string, boolean][] = [
		[ "a", true],
		[ "a.b", true],
		[ "a.a", true],
		[ "a.a.b", true ],
		["aa", false],
		["aa.b", false],
		["b", false],
	];
	for (const t of tests) {
		assertEquals(chk_host_in_set(t[0], set), t[1]);
	}
})

Deno.test("FindProxyForURL", async () => {
	const tests: [string, boolean][] = [
		["192.168.250.1", false],
		["localhost", false],
		["example.com", true],
	];
	// prepare dns_lut
	for (const t of tests) {
		const h = t[0];
		if (ip2n(h) == -2) {
			const r = await Deno.resolveDns(h, "A");
			console.log(`dns_lut: ${h} resolved to ${r}`);
			dns_lut.set(h, r[0]);
		}
	}
	for (const t of tests) {
		const v = FindProxyForURL(null, t[0]) !== "DIRECT";
		assertEquals(v, t[1]);
	}
});
