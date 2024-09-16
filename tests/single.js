const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()
const secondText = "Genesis 2:9 - 3:19"
const secondTextparsed = parser.parse(secondText).getPassages()
console.log(secondText)
dump(secondTextparsed)
