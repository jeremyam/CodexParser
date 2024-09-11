const CodexParser = require("../src/CodexParser.js")

const parser = new CodexParser()

parser.find('Psalm 3:0').enhance()

console.log(parser.getPassages())
console.log(parser.getText())