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
const result = parser.parse("John 17 Deuteronomy 31-33 Gen. 49; Josh. 23–24; 1 Sam. 12; 1 Kings 2:1–12; 1 Chron. 28–29")
dump(result.getPassages())
