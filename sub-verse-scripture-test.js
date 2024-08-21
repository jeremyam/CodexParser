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
const result = parser.parse("John 12:38 John 1:29,34 Isaiah 6:3 LXX Isaiah 52:13 LXX Isaiah 53:1 Isaiah 6:10 Isaiah 6:1 Isaiah 52:13 Isaiah 6:7 Isaiah 53:12 Isaiah 52:13 - 53:12")
dump(result.getPassages())
