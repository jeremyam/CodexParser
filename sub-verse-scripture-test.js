const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const scripture = "He 1:1-3, 8"
console.log(scripture)
parser.parse(`${scripture}. Please turn in your Bibles.`)