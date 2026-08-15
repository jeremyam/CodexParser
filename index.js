const CodexParser = require("./src/core/CodexParser.js")

// Support both `const CodexParser = require("codexparser")` and
// `const { CodexParser } = require("codexparser")`.
module.exports = CodexParser
module.exports.CodexParser = CodexParser
module.exports.default = CodexParser
