const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()
const secondText = "Ge 27.27-29,89-40 Heb 11.20 Heb. 12.17 Jonah 3"
const secondTextparsed = parser.parse(secondText).getPassages()
console.log(secondText)
dump(secondTextparsed)
