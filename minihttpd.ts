function txt_resp(status: number, body: BodyInit, content_type?: string): Response {
	return new Response(body, {
		status,
		headers: {
			'content-type': content_type ?? 'text/plain; charset=utf-8',
		}
	});
}

function not_found(): Response {
	return txt_resp(404, "you're (not) welcome");
}

export class MiniHTTPD {
	private contents: Map<string, [Uint8Array, string | undefined]>;
	constructor(init: Iterable<[string, [Uint8Array, string | undefined]]>) {
		this.contents = new Map(init);
	}

	handle(req: Request, info: Deno.ServeHandlerInfo): Response {
		const url = new URL(req.url);
		const r_addr = info.remoteAddr as Deno.NetAddr;
		console.log(`${r_addr.hostname}:${r_addr.port} ${req.headers.get("user-agent")} ${decodeURI(url.pathname)}`);

		const resp = this.contents.get(url.pathname);
		if (resp === undefined) {
			return not_found();
		} else {
			return txt_resp(200, resp[0], resp[1]);
		}
	}
}

if (import.meta.main) {
	const httpd = new MiniHTTPD([["/", [(new TextEncoder).encode("hello"), undefined]]]);
	Deno.serve({ hostname: "127.0.0.1", port: 8080 },
		(req, info) => {
			return httpd.handle(req, info);
		}
	);
}
