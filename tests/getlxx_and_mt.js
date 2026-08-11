const { dd, dump } = require("../src/utils/functions.js")
const BibleParser = require("../src/core/CodexParser.js")

const parser = new BibleParser()

const text = "John 1:1 // Psalm 4:5"
const passages = parser.parse(text).getPassages()

for (const passage of passages) {
    dump(passage.getLXX())
}
