const bcv_parser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const text = "Genesis 1:1 John 1:1"

const parser = new bcv_parser()
const textParser = parser.parse(text)
const passages = textParser.parsed_entities()
passages.forEach((passage) => {
    dump(passage)
})