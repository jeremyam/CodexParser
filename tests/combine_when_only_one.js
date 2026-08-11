const BibleParser = require("../src/core/CodexParser.js")
const { dump, dd } = require("../src/utils/functions.js")
const parser = new BibleParser()

const text = "Daniel 7:1-5"

const parsed = parser.parse(text).getPassages().first()

dump(parser.combine(parsed))
