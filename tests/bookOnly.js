const CodexParser = require("../src/core/CodexParser.js")
const parser = new CodexParser()

const book = "Isaiah"

const passage = parser.parse(book).getPassages()
console.log("Passage:", passage)
