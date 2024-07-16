const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = "Revelation 1:2, 12:8, 13:3-5, 14:2, 4, 6, 8"
const parser = new BibleParser()
const result = parser.parse(string)
dump(result.getPassages())
