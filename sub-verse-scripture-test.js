const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const text = parser.parse("Nehemiah 1:1d")
console.log(text)