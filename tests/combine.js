const BibleParser = require("../src/core/CodexParser.js")
const { dump, dd } = require("../src/utils/functions.js")
const parser = new BibleParser()

/* const text2 = "John 1:12"
const text3 = "John 3:16"

const text2Parsed = parser.parse(text2).getPassages().first()
const text3Parsed = parser.parse(text3).getPassages().first()
const combinedNext = [text2Parsed, text3Parsed] // Combine the two passages

dump(parser.combine(combinedNext))
 */

const text = `Rev 1:8, Rev 2:17`

const passages = parser.parse(text)
const combined = parser.combine()
console.log(combined)
