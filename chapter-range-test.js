const BibleParser = require("./src/CodexParser.js")
const string = "Revelation 3:5; 7:14; 12:7; 13:8; 16:18; 20:1-6"
const parser = new BibleParser()
const passages = parser.parse(string)
//console.log(passages.getPassages())