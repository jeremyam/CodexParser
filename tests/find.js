const CodexParser = require("../src/CodexParser.js")

const parser = new CodexParser()

parser.find('Psalm 2:2-13; 3:2-4 30:5 LXX').enhance()

console.log(parser.getPassages())
console.log(parser.getText())