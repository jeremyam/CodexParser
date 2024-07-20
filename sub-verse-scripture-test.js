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
const result = parser.parse("Gen 13:14-16 Clement of Letter to the Romanse, Letter to the Corinthians [51; 77; 111] 10:4-5; Jubilees [14; 43; 46; 118; 175; 179] 13:19-20; Genesis Apocryphon 21:8-10, 13 // Gen 13:15 Gal 3:16; Pseudo-Philo 8:3 Allusions - Jub 19:21-22; QapGn 21:8-10 // Gen 13:15 - Ac 7:5")
dump(result.getPassages())
