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
})
const result = parser.parse("Gen  15:13 - Ph Her 266; QuGen  3:10; Ps-Ph 9:3 malachi 4:1 lxx")
dump(result.getPassages())
