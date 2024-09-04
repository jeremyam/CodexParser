const bcv_parser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const text = "Genesis 22:1,2,4-6"

const parser = new bcv_parser({
    invalid_sequence_strategy: "include",
    invalid_passage_strategy: "include",
    sequence_combination_strategy: "combine",
})
const textParser = parser.parse(text)
console.log(textParser)
const passages = textParser.parsed_entities()
dump(passages)