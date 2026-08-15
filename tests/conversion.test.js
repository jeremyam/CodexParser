/**
 * Version-conversion coverage: version suffix detection in references,
 * getLXX/getMT/getBHS/getEnglish on passages and collections, and
 * multi-verse conversions between versification systems.
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

// ---------------------------------------------------------------------------
// Version suffix detection in the reference text
// ---------------------------------------------------------------------------
test("trailing LXX/MT suffix sets the passage version", () => {
    const passages = new CodexParser().parse("Zechariah 2:8 LXX; Zechariah 2:8 MT; Zechariah 2:8").getPassages()
    assert.equal(passages.length, 3)
    assert.deepEqual(
        Array.from(passages, (p) => p.version.abbreviation),
        ["lxx", "mt", "eng"]
    )
    // Same surface reference, different versification anchors per version.
    assert.deepEqual(passages[0].passages[0].versification, { lxx: "2:8", mt: "2:12", eng: "2:8" })
    assert.deepEqual(passages[1].passages[0].versification, { lxx: "2:4", mt: "2:8", eng: "2:4" })
    assert.deepEqual(passages[2].passages[0].versification, { lxx: "2:8", mt: "2:12", eng: "2:8" })
})

test("version suffix works on a multi-chapter range (Psalms 94:4-100:6 MT)", () => {
    const p = new CodexParser().parse("Psalms 94:4-100:6 MT").getPassages().first()
    assert.equal(p.version.abbreviation, "mt")
    assert.equal(p.scripture.hash, "Ps.94.4-Ps.100.6")
})

// ---------------------------------------------------------------------------
// Per-passage conversion helpers
// ---------------------------------------------------------------------------
test("getLXX()/getMT() remap Psalm 4:5 to 4:6", () => {
    const p = new CodexParser().parse("Psalm 4:5").getPassages().first()
    assert.equal(p.scripture.hash, "Ps.4.5")
    const lxx = p.getLXX()
    assert.equal(lxx.version.abbreviation, "lxx")
    assert.equal(lxx.scripture.cv, "4:6")
    assert.equal(lxx.scripture.hash, "Ps.4.6")
    const mt = p.getMT()
    assert.equal(mt.version.abbreviation, "mt")
    assert.equal(mt.scripture.hash, "Ps.4.6")
})

test("getBHS() is an alias for the MT conversion", () => {
    const p = new CodexParser().parse("Psalm 4:5").getPassages().first()
    const bhs = p.getBHS()
    assert.equal(bhs.version.abbreviation, "mt")
    assert.equal(bhs.scripture.hash, "Ps.4.6")
})

test("getEnglish() on an English passage is an identity conversion", () => {
    const p = new CodexParser().parse("Psalm 4:5").getPassages().first()
    const eng = p.getEnglish()
    assert.equal(eng.scripture.hash, "Ps.4.5")
})

test("getLXX() on an unversified NT passage keeps the reference", () => {
    const p = new CodexParser().parse("John 3:16").getPassages().first()
    const lxx = p.getLXX()
    assert.equal(lxx.version.abbreviation, "lxx")
    assert.equal(lxx.scripture.hash, "John.3.16")
})

// ---------------------------------------------------------------------------
// Collection-level conversion
// ---------------------------------------------------------------------------
test("collection getLXX() converts every passage and stays a PassageCollection", () => {
    const passages = new CodexParser().parse("Psalm 4:5; Psalm 23:1").getPassages()
    const lxx = passages.getLXX()
    assert.equal(lxx.constructor.name, "PassageCollection")
    assert.deepEqual(
        Array.from(lxx, (p) => p.scripture.hash),
        ["Ps.4.6", "Ps.22.1"]
    )
})

// ---------------------------------------------------------------------------
// convertVersion across whole ranges and non-English source versions
// ---------------------------------------------------------------------------
test("MT-parsed Psalm 94:4-23 converts to LXX 93:4-23", () => {
    const parser = new CodexParser().bibleVersion("mt")
    const p = parser.parse("Psalm 94:4-23").getPassages().first()
    assert.equal(p.scripture.cv, "94:4-23")
    const lxx = p.convertVersion("lxx")
    assert.equal(lxx.scripture.cv, "93:4-23")
    assert.equal(lxx.scripture.hash, "Ps.93.4-Ps.93.23")
})

test("LXX-parsed Jeremiah 29:31-30:31 validates against LXX chapter bounds", () => {
    const parser = new CodexParser().bibleVersion("lxx")
    const p = parser.parse("Jeremiah 29:31-30:31").getPassages().first()
    assert.equal(p.valid, true)
    assert.equal(p.scripture.hash, "Jer.29.31-Jer.30.31")
})
