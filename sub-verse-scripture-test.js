const BibleParser = require("./src/CodexParser.js")
const string = "Psalms 128:6"
const parser = new BibleParser()
parser.options({
    
})
const result = parser.parse(string)
console.log(result.getPassages())