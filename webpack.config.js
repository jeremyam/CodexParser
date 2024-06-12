const path = require("path")

module.exports = {
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
