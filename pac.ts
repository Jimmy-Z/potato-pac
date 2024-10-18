
import { TextLineStream } from "jsr:@std/streams";

import * as routes from "./routes.ts";

// convert IPv4 address to a number
// >=0 for IPv4
// -1 for not having any dots(plain host or IPv6)
// -2 for others(FQDN)
// be aware, we don't use convert_addr
function ip2n(ip: string): number {
	const s = ip.split(".");
	if (s.length === 1) {
		return -1;
	}
	if (s.length !== 4) {
		return -2;
	}
	const n = [parseInt(s[0]), parseInt(s[1]), parseInt(s[2]), parseInt(s[3])];
	if (Number.isNaN(n[0]) || n[0] < 0 || n[0] > 255
		|| Number.isNaN(n[1]) || n[1] < 0 || n[1] > 255
		|| Number.isNaN(n[2]) || n[2] < 0 || n[2] > 255
		|| Number.isNaN(n[3]) || n[3] < 0 || n[3] > 255
	) {
		return -2;
	}
	return (n[0] << 24 |
		n[1] << 16 |
		n[2] << 8 |
		n[3]) >>> 0;
}

function chk_ip_in_set(ip: number, set: (Set<number> | number[])[]): boolean {
	for (const i in set) {
		const len = parseInt(i);
		let s = set[len];
		// convert array to set on encounter
		if (Array.isArray(s)) {
			s = new Set(s);
			set[len] = s;
		}
		if (s.has(ip >>> (32 - len))) {
			return true;
		}
	}
	return false;
}

function chk_host_in_set(host: string, set: Set<string>): boolean {
	const s = host.split(".");
	for (let i = 1; i <= s.length; ++i) {
		if (set.has(s.slice(-i).join("."))) {
			return true;
		}
	}
	return false;
}

const PRIVATE = cidr2set([
	"127.0.0.0/8",
	"169.254.0.0/16",
	"10.0.0.0/8",
	"172.16.0.0/12",
	"192.168.0.0/16",
]);

const D_IPS: number[][] = [];

const D_HOSTS: Set<string> = new Set;
const P_HOSTS: Set<string> = new Set;

const DIRECT = "DIRECT";
const PROXY = "PROXY";

function FindProxyForURL(_url: null, host: string): string {
	let n = ip2n(host);
	if (n == -2) {
		if (chk_host_in_set(host, D_HOSTS)) {
			return DIRECT;
		}
		if (chk_host_in_set(host, P_HOSTS)) {
			return PROXY;
		}
		const r = dnsResolve(host);
		// no specification when DNS fails, firefox returns null
		if (typeof r !== "string" || r.length === 0) {
			// alert(`unexpected dnsResolve("${host}") => "${r}"`);
			return PROXY;
		}
		n = ip2n(r);
	}
	if (n == -1 || chk_ip_in_set(n, PRIVATE)) {
		return "DIRECT";
	} else if (chk_ip_in_set(n, D_IPS)) {
		return DIRECT;
	} else {
		return PROXY;
	}
}

function cidr2set(lst: string[]): number[][] {
	const r = [];
	for (const cidr of lst) {
		// convert
		const s = cidr.split("/");
		const l = parseInt(s[1]);
		const n = ip2n(s[0]) >>> (32 - l);
		// insert
		let a: number[] | undefined = r[l];
		if (a === undefined) {
			a = [];
			a.push(n);
			r[l] = a;
		} else {
			a.push(n);
		}
	}
	return r;
}

async function load_conf(f_name: string): Promise<Map<string, Array<string>>> {
	using f = await Deno.open(f_name, { read: true });
	const t = f.readable.pipeThrough(new TextDecoderStream).pipeThrough(new TextLineStream);
	const r = new Map<string, Array<string>>();
	let s: Array<string> | undefined;
	for await (let l of t) {
		l = l.trim();
		if (l.length === 0 || l.startsWith("#")) {
			continue;
		}
		if (l.charAt(0) === "[" && l.charAt(l.length - 1) === "]") {
			const s_name = l.slice(1, -1);
			s = r.get(s_name);
			if (s === undefined) {
				s = [];
				r.set(s_name, s);
			}
		} else if (s !== undefined) {
			s.push(l);
		}
	}
	return r;
}

export async function gen_pac(proxy: string, directive?: string): Promise<string> {
	const r = [];
	const hosts = await load_conf("hosts.conf");
	r.push("const D_HOSTS = new Set(" + JSON.stringify(hosts.get("direct"), null, " ") + ");");
	r.push("const P_HOSTS = new Set(" + JSON.stringify(hosts.get("proxy"), null, " ") + ");");
	// JSON.stringify will convert empty sparse array items to null
	r.push("const PRIVATE = " + JSON.stringify(PRIVATE, null, " ").replaceAll("null", "") + ";");
	const d_ips = cidr2set(await routes.get(proxy));
	r.push("const D_IPS = " + JSON.stringify(d_ips, null, " ").replaceAll("null", "") + ";");
	r.push("const DIRECT = \"DIRECT\";");
	r.push(`const PROXY = "${directive ?? "SOCKS"} ${proxy}; DIRECT";`);
	// thankfully toString strips TS type decorations
	// to do: strip comments
	r.push(ip2n.toString());
	r.push(chk_ip_in_set.toString());
	r.push(chk_host_in_set.toString());
	r.push(FindProxyForURL.toString());
	return r.join("\n");
}

// Deno polyfill for PAC predefined functions for testing
// since Deno.dnsResolve is async
const dns_lut: Map<string, string> = new Map;
function dnsResolve(host: string): string {
	const r = dns_lut.get(host);
	if (r === undefined) {
		throw `dnsResolve("${host}") failed`
	}
	return r;
}

export const exported_for_testing = {
	ip2n,
	chk_ip_in_set,
	chk_host_in_set,
	PRIVATE,
	FindProxyForURL,
	dns_lut,
};
