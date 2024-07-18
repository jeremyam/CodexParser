const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = "Malachi 3:32"
const parser = new BibleParser()
parser.options({ invalid_passage_strategy: "include", invalid_sequence_strategy: "include" })
const result = parser.parse("Ez 1:2 Ezk 2:3")
dump(result.getPassages())
