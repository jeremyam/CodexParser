import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
    entry: {
        main: "./src/CodexParser.js",
    },
    output: {
        filename: "CodexParser.js",
        path: path.resolve(__dirname, "dist"),
        library: {
            name: "CodexParser",
            type: "umd",
            export: "default",
        },
        globalObject: "typeof self !== 'undefined' ? self : this",
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
}
