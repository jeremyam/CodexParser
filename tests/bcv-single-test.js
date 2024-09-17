const bcv_parser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const text = "Psalm 3:1"

const parser = new bcv_parser()
parser.set_options({
    invalid_sequence_strategy: "include",
    invalid_passage_strategy: "include",
    sequence_combination_strategy: "combine",
    versification_system: "nab",
})
const textParser = parser.parse(text)
console.log(textParser)
const passages = textParser.parsed_entities()
dump(passages)
