const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = "Joel 4:13 Mark 4:29 Revelation 14:15,18,19"
const parser = new BibleParser()
const result = parser.parse(string)
dump(result.getPassages())
