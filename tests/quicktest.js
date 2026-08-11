const BibleParser = require("../src/core/CodexParser.js")
const string = "Ezra 1:20 Ezk 23:22"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())
