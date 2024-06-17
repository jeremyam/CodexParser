const BibleParser = require("./src/CodexParser.js")
const string = "Ps 109:4,5"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())