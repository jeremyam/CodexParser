const BibleParser = require("./src/CodexParser.js")
const string = "He 4.4 He 5.6 Genesis 12:1"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())