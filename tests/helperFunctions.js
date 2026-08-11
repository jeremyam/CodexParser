const BibleParser = require("../src/core/CodexParser.js")
const { dump, dd } = require("../src/utils/functions.js")
const parser = new BibleParser()

parser.parse("Genesis 1:1-3, Genesis 1:4-5, Genesis 2:5, Matthew 1:1-5, Matthew 12:16, Matthew 12:19")
const passages = parser.getPassages()
console.log("Combined by same book and chapter: ", passages.combine({ chapter: false, book: true }))


const passage = "Matthew 12:16, 17; 13:1-5"
parser.parse(passage)

const matthew = parser.getPassages()
