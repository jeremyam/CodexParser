import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
    entry: {
        main: ["./src/bible.js", "./src/regex.js", "./src/CodexParser.js"],
    },
    output: {
        filename: "CodeParser.js",
        path: path.resolve(__dirname, "./dist"),
        library: "CodexParser",
        libraryTarget: "umd",
        globalObject: 'typeof self !== "undefined" ? self : this',
    },
}
