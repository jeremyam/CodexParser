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
const result = parser.parse("1 Cor 1.20 Matt 1.1 Job 12.17 Is 19.12")
const result = parser.parse("Jude 1 Gen. 4:1–25 Num. 22–24")
dump(result.getPassages())
