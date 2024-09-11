const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()
const secondText = "Psalm 3:0"
const secondTextparsed = parser.parse(secondText).getPassages()

dump(secondTextparsed)
