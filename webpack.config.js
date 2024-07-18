const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
    mode: "production",
    entry: {
        main: "./src/CodexParser.js",
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
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
    target: "web",
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
        ],
    },
}
