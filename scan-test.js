const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
const string = "Genesis 1:1  John 1:1"
console.log(string)
const parser = new BibleParser()
const result = parser.find(string)
dump(result)
