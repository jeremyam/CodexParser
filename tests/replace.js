const CodexParser = require("../src/core/CodexParser.js")
const parser = new CodexParser()

const text = `But he turned, and said unto Peter, Get thee behind me, Satan; thou art an offense unto me. —Mat 16:23 a. Lk. 1:1`
console.log("Original Text: ", text)
parser.parse(text)
console.log("Parsed Passages: ", parser.getPassages())
console.log("Abbreviated:", parser.replace(text, true))
console.log("Full names:", parser.replace(text, false))
