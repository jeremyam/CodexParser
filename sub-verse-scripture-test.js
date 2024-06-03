const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const text = parser.parse("Nehemiah 1:1d")
const multiNoSpace = parser.parse('Ps 109:4,5,7,8')
console.log(multiNoSpace)