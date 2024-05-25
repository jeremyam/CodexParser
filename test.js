const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const text =
    "The passages that we are looking at tonight are found in 1 John 3:16-17, 1 Peter 1:1, and Romans 10:13, 15, 17. Please turn in your Bibles."
const single = "1Cor 2.9"
parser.parse(single)
//parser.parse(single)
console.log(parser.getPassages())
