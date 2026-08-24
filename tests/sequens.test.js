const { test } = require("node:test")
const assert = require("node:assert")
const { CodexParser } = require("..")

// Regression tests for 0.6.8: NA-style sequens suffixes ("25s" = the verse
// and the one following, "25ss" = the two following), the Exodus 20 /
// Deuteronomy 5 Decalogue maps (BHS order matches English; the swapped
// order is Wevers' Göttingen text), and validity of MT/LXX-tagged verses
// that fall outside the English chapter bounds.

const first = (ref) => new CodexParser().parse(ref).getPassages()[0]
const verses = (p) => p.passages.map((v) => `${v.chapter}:${v.verse}`)
const engs = (p) => p.passages.map((v) => v.versification?.eng).filter(Boolean)

test("sequens: 's' extends by one verse, cv shows the real range", () => {
    const p = first("Psalms 118:25s MT")
    assert.strictEqual(p.scripture.cv, "118:25-26")
    assert.deepStrictEqual(verses(p), ["118:25", "118:26"])
    assert.strictEqual(p.valid, true)
})

test("sequens: 'ss' extends by two verses", () => {
    const p = first("Hosea 2:1ss MT")
    assert.strictEqual(p.scripture.cv, "2:1-3")
    assert.deepStrictEqual(engs(p), ["1:10", "1:11", "2:1"])
})

test("sequens: redundant before an explicit range end", () => {
    const p = first("Psalms 72:10s-15 MT")
    assert.strictEqual(p.scripture.cv, "72:10-15")
    assert.strictEqual(p.passages.length, 6)
})

test("sequens: works on NT references too", () => {
    const p = first("Romans 9:26s")
    assert.strictEqual(p.scripture.cv, "9:26-27")
})

test("sequens: past the English chapter end resolves via the MT map", () => {
    const p = first("Malachi 3:23s MT")
    assert.strictEqual(p.scripture.cv, "3:23-24")
    assert.deepStrictEqual(engs(p), ["4:5", "4:6"])
    assert.strictEqual(p.valid, true)
})

test("Decalogue: BHS Exodus 20:13-15 numbering matches English", () => {
    for (const v of [13, 14, 15]) {
        const p = first(`Exodus 20:${v} MT`)
        assert.strictEqual(p.passages[0].versification.eng, `20:${v}`)
    }
})

test("Decalogue: Wevers LXX order (adultery 13, steal 14, murder 15)", () => {
    assert.strictEqual(first("Exodus 20:13 LXX").passages[0].versification.eng, "20:14")
    assert.strictEqual(first("Exodus 20:14 LXX").passages[0].versification.eng, "20:15")
    assert.strictEqual(first("Exodus 20:15 LXX").passages[0].versification.eng, "20:13")
    assert.strictEqual(first("Deuteronomy 5:17 LXX").passages[0].versification.eng, "5:18")
    assert.strictEqual(first("Deuteronomy 5:18 LXX").passages[0].versification.eng, "5:17")
    assert.strictEqual(first("Deuteronomy 5:17 MT").passages[0].versification.eng, "5:17")
})

test("native validity: attested MT verses beyond English bounds are valid", () => {
    for (const ref of ["Malachi 3:19 MT", "Daniel 3:31 MT", "Joel 4:13 MT", "Nehemiah 3:33 MT"]) {
        const p = first(ref)
        assert.strictEqual(p.valid, true, `${ref} should be valid`)
        assert.ok(p.passages[0].versification?.eng, `${ref} should map to an English verse`)
    }
    const range = first("Malachi 3:19-24 MT")
    assert.strictEqual(range.valid, true)
    assert.deepStrictEqual(engs(range), ["4:1", "4:2", "4:3", "4:4", "4:5", "4:6"])
})

test("native validity: untagged and unmapped out-of-bounds verses stay invalid", () => {
    assert.notStrictEqual(first("Malachi 3:19").valid, true)
    assert.notStrictEqual(first("Malachi 3:27 MT").valid, true)
})
