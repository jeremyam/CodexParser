const CodexParser = require("../src/core/CodexParser.js")
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}

function logPassage(p) {
    console.log("- Base:", p.original, "version:", p.version.abbreviation)
    console.log("  OSIS:", p.scripture.hash, "numeric:", p.scripture.osisNumeric, "abbr:", p.abbr)
    const lxx = p.getLXX()
    const mt = p.getMT()
    const eng = p.getEnglish()
    console.log("  → LXX:", lxx.scripture.cv, lxx.scripture.hash, lxx.abbr)
    console.log("  → MT:", mt.scripture.cv, mt.scripture.hash, mt.abbr)
    console.log("  → ENG:", eng.scripture.cv, eng.scripture.hash, eng.abbr)
}

const parser = new CodexParser()

console.log("Case 1: suffix detection MT")
let res1 = parser.parse("Psalms 94:4-100:6 MT").getPassages()
res1.forEach(logPassage)

console.log("\nCase 2: Zechariah differences")
let res2 = parser.parse("Zechariah 2:8 LXX; Zechariah 2:8 MT; Zechariah 2:8").getPassages()
res2.forEach(logPassage)

console.log("\nCase 3: Jeremiah multi-chapter LXX")
let res3 = parser.parse("Jeremiah 29:31-30:31 LXX").getPassages()
res3.forEach(logPassage)
