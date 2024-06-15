const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const scripture = "And then he said, turn to He 1:1-3, 8. and He doesn't like it"
const result = parser.parse(`${scripture}. Please turn in your Bibles.`)
console.log(result.getPassages())