const BibleParser = require("./src/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}

const parser = new BibleParser()

const text =
    "Gen 1:1 - Jos Ant 1:27; Just Apol 1:59, 64; Mel Pasc 47; Ph Aet 19; Her 122; Opif 26-27; Theoph 2.10 Allusions Jn 1:1; Heb 11:3; DialSav 127:20; 4Ez 6:38; Mel Pasc 104; Ph QuGen 4:215; Opif 29; Mos 2:266; Plant 86; Praem 1; Sacrif 8; PrMan 2; Prov 8:22; Tat 5"

parser.find(text)
dump(parser.getPassages())
