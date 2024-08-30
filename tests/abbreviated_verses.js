const BibleParser = require("../src/CodexParser.js")
const dump = require("../src/functions.js").dump
const parser = new BibleParser()
const text = "Job 1:1b"

const passages = parser.find(text).enhance()

dump(passages)
