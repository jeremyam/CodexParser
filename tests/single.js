const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump

const parser = new BibleParser()

const text = "Job 1:1-5"

const passages = parser.parse(text).getPassages()

dump(passages)
