/**
 * Test for comma-separated verse parsing bug fix
 *
 * Bug: When parsing comma-separated verse lists like "Genesis 1:3, 9, 11",
 * the parser was interpreting standalone numbers (like 9, 11) as chapter
 * references instead of continuing verses within the same chapter context.
 */

const CodexParser = require("../src/core/CodexParser.js")

const parser = new CodexParser({
    invalid_sequence_strategy: "include",
    invalid_passage_strategy: "include",
})

const testCases = [
    {
        input: "Genesis 1:3, 9, 11, 15, 24, 29-30",
        expectedChapter: 1,
        expectedVerses: ["3", "9", "11", "15", "24", "29-30"],
        description: "Original bug case: Genesis 1:3, 9, 11, 15, 24, 29-30"
    },
    {
        input: "Genesis 1:3, 9, 11",
        expectedChapter: 1,
        expectedVerses: ["3", "9", "11"],
        description: "Simple case: Genesis 1:3, 9, 11"
    },
    {
        input: "Psalm 119:1, 5, 10, 15",
        expectedChapter: 119,
        expectedVerses: ["1", "5", "10", "15"],
        description: "Psalm 119:1, 5, 10, 15"
    },
    {
        input: "Romans 8:1, 28, 38-39",
        expectedChapter: 8,
        expectedVerses: ["1", "28", "38-39"],
        description: "Romans 8:1, 28, 38-39"
    },
    {
        input: "John 3:16, 17, 36",
        expectedChapter: 3,
        expectedVerses: ["3", "16", "17", "36"].slice(1), // just 16, 17, 36
        description: "John 3:16, 17, 36"
    },
    {
        input: "Genesis 1:3-5, 9, 11",
        expectedChapter: 1,
        expectedVerses: ["3-5", "9", "11"],
        description: "Range followed by comma-separated: Genesis 1:3-5, 9, 11"
    }
]

console.log("Testing comma-separated verse parsing fix\n")
console.log("=" .repeat(60))

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
    const passages = parser.parse(testCase.input).getPassages()
    const passage = passages[0]

    console.log(`\nTest ${index + 1}: ${testCase.description}`)
    console.log(`  Input: "${testCase.input}"`)
    console.log(`  Parsed chapter: ${passage.chapter}`)
    console.log(`  Parsed verses: [${passage.verses.join(", ")}]`)

    const chapterMatch = passage.chapter === testCase.expectedChapter

    // Convert verses to strings for comparison
    const actualVerses = passage.verses.map(v => String(v))
    const versesMatch = JSON.stringify(actualVerses) === JSON.stringify(testCase.expectedVerses)

    if (chapterMatch && versesMatch) {
        console.log(`  ✓ PASSED`)
        passed++
    } else {
        console.log(`  ✗ FAILED`)
        if (!chapterMatch) {
            console.log(`    Expected chapter: ${testCase.expectedChapter}, got: ${passage.chapter}`)
        }
        if (!versesMatch) {
            console.log(`    Expected verses: [${testCase.expectedVerses.join(", ")}]`)
            console.log(`    Got verses: [${actualVerses.join(", ")}]`)
        }
        failed++
    }
})

console.log("\n" + "=" .repeat(60))
console.log(`\nResults: ${passed} passed, ${failed} failed`)

if (failed > 0) {
    process.exit(1)
}
