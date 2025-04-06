import fs       from "node:fs"
import path     from "node:path"
import url      from "node:url"
import ts       from "typescript"
import * as esb from "esbuild"

const dirname       = path.dirname(url.fileURLToPath(import.meta.url))
const file_js_path  = path.join(dirname, "smd.js")
const file_dts_path = path.join(dirname, "smd.d.ts")
const file_map_path = path.join(dirname, "smd.d.ts.map")

/** @type {ts.CompilerOptions} */
const ts_options = {
    allowJs             : true,
    checkJs             : true,
    skipLibCheck        : false,
    maxNodeModuleJsDepth: 1,
    emitDeclarationOnly : true,
    noEmit              : false,
    noEmitOnError       : false,
    declaration         : true,
    declarationMap      : true,
}

function main() {
    const begin = performance.now()

    /* Build minified version for the CDNs */
    esb.build({
        entryPoints: ["smd_min_entry.js"],
        format: "esm",
        platform: "browser",
        bundle: true,
        minify: true,
        drop: ["console", "debugger"],
        outfile: "smd.min.js",
    }).then(() => {
        console.log(`MIN complete at ${Math.ceil(performance.now() - begin)}ms`)
    })


    /* DTS */
    // Remove old .d.ts files
    if (fs.existsSync(file_dts_path)) fs.unlinkSync(file_dts_path)
    if (fs.existsSync(file_map_path)) fs.unlinkSync(file_map_path)

    // Emit d.ts files
    const program = ts.createProgram([file_js_path], ts_options)
    program.emit()
    console.log(`DTS complete at ${Math.ceil(performance.now() - begin)}ms`)
}


main()
