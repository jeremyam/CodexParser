const CodexParser = require("../src/core/CodexParser.js")

console.log("=== Testing convertVersion Method ===\n")

const parser = new CodexParser()

// Test 1: Psalm with versification (ENG -> LXX)
console.log("Test 1: Psalm 4:5 (English) -> LXX")
const [p1] = parser.parse("Psalm 4:5").getPassages()
console.log("Original:", p1.scripture.hash, p1.version.abbreviation)
const p1_lxx = p1.convertVersion("lxx")
console.log("Converted:", p1_lxx.scripture.hash, p1_lxx.version.abbreviation)
console.log("Has versification:", p1.passages[0].versification ? "Yes" : "No")
console.log()

// Test 2: Zechariah with versification (ENG -> LXX)
console.log("Test 2: Zechariah 2:8 (English) -> LXX")
const [z1] = parser.parse("Zechariah 2:8").getPassages()
console.log("Original:", z1.scripture.hash, z1.version.abbreviation)
const z1_lxx = z1.convertVersion("lxx")
console.log("Converted:", z1_lxx.scripture.hash, z1_lxx.version.abbreviation)
console.log()

// Test 3: Reference without versification (John)
console.log("Test 3: John 3:16 (no versification) -> LXX")
const [j1] = parser.parse("John 3:16").getPassages()
console.log("Original:", j1.scripture.hash, j1.version.abbreviation)
const j1_lxx = j1.convertVersion("lxx")
console.log("Converted:", j1_lxx.scripture.hash, j1_lxx.version.abbreviation)
console.log("Has versification:", j1.passages[0].versification ? "Yes" : "No")
console.log("Should be same reference:", j1.scripture.hash === j1_lxx.scripture.hash)
console.log()

// Test 4: LXX -> English
console.log("Test 4: Psalm 115:5 (LXX) -> English")
parser.bibleVersion("lxx")
const [p2] = parser.parse("Psalm 115:5").getPassages()
console.log("Original:", p2.scripture.hash, p2.version.abbreviation)
const p2_eng = p2.convertVersion("eng")
console.log("Converted:", p2_eng.scripture.hash, p2_eng.version.abbreviation)
console.log()

// Test 5: Multi-verse with versification
console.log("Test 5: Psalm 94:4-23 (MT) -> LXX")
parser.bibleVersion("mt")
const [p3] = parser.parse("Psalm 94:4-23").getPassages()
console.log("Original:", p3.scripture.cv, p3.version.abbreviation)
const p3_lxx = p3.convertVersion("lxx")
console.log("Converted:", p3_lxx.scripture.cv, p3_lxx.version.abbreviation)
console.log()

console.log("=== All Tests Complete ===")
