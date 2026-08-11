const BibleParser = require("../src/core/CodexParser.js")
const string = "Revelation 3:5-4:1"
const parser = new BibleParser()
const passages = parser.parse(string)
console.log(passages.getPassages())
