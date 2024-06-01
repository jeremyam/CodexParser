const CodexParser = require("./src/CodexParser.js")

const parser = new CodexParser()
const text =
    "The passages that we are looking at tonight are found Jude 6, in Jude 5, Genesis 2:1 - 3:19, 1 John 3:16-17, 1 Peter 1:1, and Romans 10:13, 15, 17. Please turn in your Bibles."
const single = "Ge 27.27-29,89-40 Heb 11.20"
const jd = "Jd. 5"
const passages = parser.parse(single)
console.log(passages)

