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
    sequence_combination_strategy: "combine",
})
const result = parser.parse("Jude 5-7,11 Numbers 14:29-30 Genesis 19:24-25 Genesis 4:3-8 Numbers 31:16 Numbers 16:1-50")
dump(result.getPassages())
