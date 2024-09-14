const CodexParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}

const parser = new CodexParser({
    invalid_sequence_strategy: "include",
    invalid_passage_strategy: "include",
})
const text = `Joel 10:13 The passages Luke 2:32 and Lk 1:23 that we are looking at tonight  1 Cor 12:34 2 Cor 3:4 are found Jude 6, in Jude 5, Genesis 2:1 - 3:19,  1 John 3:16-17, 1 Peter 1:1, and Romans 10:13, 15, 17. Please turn in your Bibles.  Ps 109:4,5,6,8.  Isaiah 61.2-3 Mt 5.4`
const single = "Ge 27.27-29,89-40 Heb 11.20 Heb. 12.17 Jonah 3 "
const jd = "Jd. 5"
const cor = "1 Cor 12:4 2 Cor 3:4"
const noSpace = "Re13.8 "
const ezra = " Ez 1:3"
const passages = parser.parse(text + single + jd + cor + noSpace + ezra)
console.log(text + single + jd + cor + noSpace + ezra)
dump(passages.getPassages())
