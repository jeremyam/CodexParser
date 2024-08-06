const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = "Malachi 3:32"
const parser = new BibleParser()
parser.options({
    invalid_passage_strategy: "include",
    invalid_sequence_strategy: "include",
    single_chapter_1_strategy: "verse",
    sequence_combination_strategy: "combine"
})
const result = parser.parse("Revelation 2:4 // Jeremiah 2:32 Hosea 1-3")
dump(result.getPassages())
