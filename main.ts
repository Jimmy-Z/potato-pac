
import { gen_pac } from "./pac.ts";
import { MiniHTTPD } from "./minihttpd.ts";

if (import.meta.main) {
	const args = Deno.args;
	if (args.length >= 1 && args[0] === "gen") {
		console.log(await gen_pac(args[1] ?? "127.0.0.1:1080"));
	} else if (args.length >= 1 && args[0] === "srv") {
		const pac = await gen_pac(args[1] ?? "127.0.0.1:1080");
		const httpd = new MiniHTTPD([
			["/", [(new TextEncoder).encode(pac), "application/x-ns-proxy-autoconfig"]],
		]);
		Deno.serve({ hostname: args[2] ?? "127.0.0.1", port: parseInt(args[3] ?? "8080"), }, (req, info) => {
			return httpd.handle(req, info);
		});
	} else {
		console.error("unexpected arguments");
	}
}
