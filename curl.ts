
import { cmd } from "./cmd.ts";

export async function curl(url: string, proxy?: string): Promise<{ code: number, out: Uint8Array }> {
	const args = [];
	if (proxy !== undefined) {
		args.push("--proxy", `socks5h://${proxy}`);
	}
	args.push("--location",
		"--max-time", "7",
		"--retry", "3",
		`${url}`);
	return await cmd("curl", args);
}
