const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = " Ps 109-110"
const parser = new BibleParser()
const result = parser.parse(string)
dump(result.getPassages())
