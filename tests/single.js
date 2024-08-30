const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()

const text = "Genesis 31:55-56"

const passages = parser.parse(text).getPassages()

