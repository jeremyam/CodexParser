const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const text = parser.parse("Joel 2:10, 11")
console.log(text)