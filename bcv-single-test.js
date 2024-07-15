const bcv_parser = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const text = "Revelation 3:5; 7:14; 12:7; 13:8; 16:18; 20:1-6"

const parser = new bcv_parser()
const textParser = parser.parse(text)
const passages = textParser.parsed_entities()
passages.forEach((passage) => {
    console.log(passage)
})