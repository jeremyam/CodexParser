const BibleParser = require("./src/CodexParser.js")
const string = "Rev 12:18"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())