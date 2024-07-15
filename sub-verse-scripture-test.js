const BibleParser = require("./src/CodexParser.js")
const string = "Revelation 12:3; 13:1"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())