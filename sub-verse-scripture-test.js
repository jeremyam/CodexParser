const BibleParser = require("./src/CodexParser.js")
const string = "Hos 1:1-3, 8"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())