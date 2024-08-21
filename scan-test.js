const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}
let text = `Psalm 94:4-100:6 MT`
const parser = new BibleParser()
const result = parser.find(text).enhance()
dump(result)
