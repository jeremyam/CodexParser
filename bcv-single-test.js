const bcv_parser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const text = "John 12:38 John 1:29,34 Isaiah 53:1 Isaiah 6:10 Isaiah 6:1 Isaiah 52:13 Isaiah 6:3 LXX Isaiah 52:13 LXX Isaiah 6:7 Isaiah 53:12 Isaiah 52:13 - 53:12"

const parser = new bcv_parser({
    invalid_sequence_strategy: "include",
    invalid_passage_strategy: "include",
    sequence_combination_strategy: "combine"
})
const textParser = parser.parse(text)
console.log(textParser)
const passages = textParser.parsed_entities()
passages.forEach((passage) => {
    dump(passage)
})
