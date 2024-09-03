const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()

const text = "Genesis 22:2,12 LXX"

const passages = parser.parse(text).getPassages()

dump(passages)
