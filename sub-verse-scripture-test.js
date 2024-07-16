const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = "Gen 1 Jd1 Ps 119:2,4,6,8,19"
const parser = new BibleParser()
const result = parser.parse(string)
dump(result.getPassages())
