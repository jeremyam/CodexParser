const BibleParser = require("./src/CodexParser.js")
const parser = new BibleParser()
const scripture = "Genesis 2.2 Не 4.4"
const result = parser.parse(scripture)
console.log(result.getPassages())