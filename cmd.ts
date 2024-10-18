
export async function cmd(cmd: string, args: string[]): Promise<{ code: number, out: Uint8Array }> {
	const c = new Deno.Command(cmd, {
		args,
		stdin: "null",
		stdout: "piped",
		stderr: "inherit",
	});
	const p = c.spawn();

	return {
		code: (await p.status).code,
		// ever thought the web streams API is to clunky to use?
		// don't worry, even std is doing this: https://jsr.io/@std/streams/1.0.7/to_blob.ts
		out: await new Response(p.stdout).bytes(),
	};
}
