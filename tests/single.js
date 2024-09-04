const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()
const text = "Genesis 22:1,2,4-6"
const secondText = "Genesis 22:1-2"
const textParsed = parser.parse(text).getPassages()
const secondTextparsed = parser.parse(secondText).getPassages()

dump(textParsed)
dump(secondTextparsed)
