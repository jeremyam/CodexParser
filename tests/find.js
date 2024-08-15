const CodexParser = require("../src/CodexParser.js")

const parser = new CodexParser()

parser.find('1 John 2-3').enhance()

console.log(parser.getPassages())