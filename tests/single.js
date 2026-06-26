// Manual smoke script: parse one reference and dump the result.
// Usage: node tests/single.js ["Isaiah 8:23"]
const { CodexParser } = require("../index.js")
const dump = require("../src/utils/functions").dump

const passage = process.argv[2] || "Isaiah 8:23"
const passages = new CodexParser().parse(passage).getPassages()
dump(passages)
