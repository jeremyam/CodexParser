const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()

const text = "Genesis 22:1-2,14,19"

const passages = parser.parse(text).getPassages()

dump(passages)
