import { transpile } from "jsr:@deno/emit";
import * as path from "jsr:@std/path";
const url = new URL("./Object.ts", import.meta.url);
const textEnc = new TextEncoder()
for (const [pth, res] of await transpile(url)) {
    const realpth = path.fromFileUrl(pth)
    // const p = path.join(path.dirname(realpth), "dist", path.basename(realpth).replaceAll(".ts", ".js"))
    const p = realpth.replaceAll(".ts", ".js")
    await Deno.writeFile(p, textEnc.encode(res))
}