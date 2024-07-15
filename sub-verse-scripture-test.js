const BibleParser = require("./src/CodexParser.js")
const string = "Romans 9:32 Romans 9:33"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())