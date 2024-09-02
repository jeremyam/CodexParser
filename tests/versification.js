const BibleParser = require("../src/CodexParser")
const dump = require("../src/functions").dump

const parser = new BibleParser()

const passages = parser.parse("Genesis 31:55").getPassages()

console.log(passages)
