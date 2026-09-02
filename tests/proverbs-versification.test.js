const { test } = require("node:test")
const assert = require("node:assert")
const { CodexParser } = require("..")

const convert = (ref, version) => {
    const p = new CodexParser()
    p.bibleVersion("eng")
    return p.parse(ref).getPassages()[0].convertVersion(version)
}

test("Prov 16:1 and 16:3 are LXX minuses", () => {
    const a = convert("Proverbs 16:1", "lxx")
    assert.equal(a.passages.length, 0)
    assert.equal(a.missingPassages.length, 1)
    assert.equal(a.missingPassages[0].missingIn, "lxx")
    assert.equal(a.missingPassages[0].verse, 1)

    const b = convert("Proverbs 16:3", "lxx")
    assert.equal(b.passages.length, 0)
    assert.equal(b.missingPassages[0].verse, 3)
})

test("Prov 16:4 maps to LXX 16:9 (not identity)", () => {
    const p = convert("Proverbs 16:4", "lxx")
    assert.equal(p.scripture.cv, "16:9")
})

test("combine() of a minus-only Proverbs 16:1 LXX conversion keeps missingPassages", () => {
    const parser = new CodexParser()
    const converted = parser.parse("Proverbs 16:1").getPassages().map((p) => p.convertVersion("lxx"))
    const combined = parser.combine(converted)
    assert.equal(combined.passages.length, 0)
    assert.equal(combined.missingPassages.length, 1)
    assert.equal(combined.missingPassages[0].missingIn, "lxx")
})
