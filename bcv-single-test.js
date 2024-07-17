const bcv_parser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const text = "Malachi 3:23"

const parser = new bcv_parser({
    invalid_sequence_strategy: "include",
    invalid_passage_strategy: "include",
})
const textParser = parser.parse(text)
const passages = textParser.parsed_entities()
passages.forEach((passage) => {
    dump(passage)
})
