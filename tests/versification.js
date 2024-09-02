const BibleParser = require("../src/CodexParser")
const dump = require("../src/functions").dump

const parser = new BibleParser()

const passages = parser.parse("Exodus 8:1").getPassages()

dump(passages)
