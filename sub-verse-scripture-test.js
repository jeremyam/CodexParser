const BibleParser = require("./src/CodexParser.js")
const string = "Revelation 4:9; 10:5; 12:14"
const parser = new BibleParser()
const result = parser.parse(string)
console.log(result.getPassages())