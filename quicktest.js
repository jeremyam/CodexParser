const BibleParser = require("./src/CodexParser.js")
const string = "He 4.4"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())