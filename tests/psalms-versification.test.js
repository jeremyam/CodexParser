const { test } = require("node:test")
const assert = require("node:assert")
const { CodexParser } = require("..")

// Regression tests for the Psalms superscription-offset fixes (0.6.5).
// Ground truth = the per-verse alignment of the BHS/Rahlfs texts:
// psalms whose MT/LXX count the title as v. 1 (or vv. 1-2) shift English
// verse numbers by +1 (or +2); Ps 66 fuses the title into v. 1 (no shift);
// MT/LXX Ps 13:6 absorbs English 13:5-6.

const convert = (ref, version) => {
    const p = new CodexParser()
    p.bibleVersion("eng")
    return p.parse(ref).getPassages()[0].convertVersion(version).original
}

test("+1 psalms: title is MT/LXX v. 1 (80, 81, 83-85, 88, 92, 140)", () => {
    assert.strictEqual(convert("Psalms 81:16", "mt"), "Psalms 81:17")
    assert.strictEqual(convert("Psalms 81:16", "lxx"), "Psalms 80:17")
    assert.strictEqual(convert("Psalms 80:1", "lxx"), "Psalms 79:2")
    assert.strictEqual(convert("Psalms 92:15", "mt"), "Psalms 92:16")
    assert.strictEqual(convert("Psalms 140:13", "lxx"), "Psalms 139:14")
})

test("+2 psalms: two-verse titles (54, 60)", () => {
    assert.strictEqual(convert("Psalms 60:1", "mt"), "Psalms 60:3")
    assert.strictEqual(convert("Psalms 60:12", "lxx"), "Psalms 59:14")
    assert.strictEqual(convert("Psalms 54:1", "lxx"), "Psalms 53:3")
})

test("Ps 66: title fused into v. 1 — no shift", () => {
    assert.strictEqual(convert("Psalms 66:1", "mt"), "Psalms 66:1")
    assert.strictEqual(convert("Psalms 66:20", "lxx"), "Psalms 65:20")
})

test("Ps 13: +1 at the head, tail merge (MT/LXX v. 6 = Eng 5-6)", () => {
    assert.strictEqual(convert("Psalms 13:1", "mt"), "Psalms 13:2")
    assert.strictEqual(convert("Psalms 13:5", "mt"), "Psalms 13:6")
    assert.strictEqual(convert("Psalms 13:6", "mt"), "Psalms 13:6")
    assert.strictEqual(convert("Psalms 13:6", "lxx"), "Psalms 12:6")
})

test("LXX chapter corrections: Eng 12 → LXX 11, Eng 54 → LXX 53", () => {
    assert.strictEqual(convert("Psalms 12:5", "lxx"), "Psalms 11:6")
    assert.strictEqual(convert("Psalms 54:7", "lxx"), "Psalms 53:9")
})

// English ":0" is the address for a psalm superscription (unnumbered in
// English, verse 1 in MT/LXX). Previously rejected as "verse 0 does not exist"
// so the title could not be fetched at all.

test("Psalm 18:0 (title) is valid and converts to MT 18:1 / LXX 17:1", () => {
    const p = new CodexParser().parse("Psalm 18:0").first()
    assert.equal(p.valid, true)
    assert.deepEqual(p.verses, ["0"])
    assert.equal(p.scripture.cv, "18:0")
    assert.equal(p.scripture.hash, "Ps.18.0")
    assert.deepEqual(p.passages[0].versification, { lxx: "17:1", mt: "18:1", eng: "18:0" })
    assert.equal(p.convertVersion("mt").scripture.cv, "18:1")
    assert.equal(p.convertVersion("lxx").scripture.cv, "17:1")
    assert.deepEqual(
        p.convertVersion("mt").passages.map((x) => x.verse),
        [1]
    )
})

test("Psalm 18:1 (English) is still the first numbered verse, not the title", () => {
    assert.strictEqual(convert("Psalm 18:1", "mt"), "Psalms 18:2")
    assert.strictEqual(convert("Psalm 18:1", "lxx"), "Psalms 17:2")
})

test("Psalm 18:1 MT is the superscription (eng 18:0)", () => {
    const p = new CodexParser().parse("Psalm 18:1 MT").first()
    assert.equal(p.valid, true)
    assert.equal(p.version.abbreviation, "mt")
    assert.deepEqual(p.passages[0].versification, { lxx: "17:1", mt: "18:1", eng: "18:0" })
    assert.equal(p.convertVersion("mt").scripture.cv, "18:1")
    assert.equal(p.convertVersion("lxx").scripture.cv, "17:1")
    const eng = p.convertVersion("eng")
    assert.equal(eng.scripture.cv, "18:0")
    assert.equal(eng.passages[0].verse, 0)
})

test("Psalm 18:0-1 covers title + first English verse", () => {
    const p = new CodexParser().parse("Psalm 18:0-1").first()
    assert.equal(p.valid, true)
    assert.deepEqual(
        p.passages.map((x) => x.verse),
        [0, 1]
    )
    assert.deepEqual(
        p.convertVersion("mt").passages.map((x) => `${x.chapter}:${x.verse}`),
        ["18:1", "18:2"]
    )
})

test("two-verse titles expand: Psalm 54:0 → MT 54:1-2 / LXX 53:1-2", () => {
    const p = new CodexParser().parse("Psalm 54:0").first()
    assert.equal(p.valid, true)
    const mt = p.convertVersion("mt")
    assert.deepEqual(
        mt.passages.map((x) => x.verse),
        [1, 2]
    )
    assert.equal(mt.scripture.cv, "54:1-2")
    const lxx = p.convertVersion("lxx")
    assert.deepEqual(
        lxx.passages.map((x) => `${x.chapter}:${x.verse}`),
        ["53:1", "53:2"]
    )
})

test("Psalm 89:0 (missing title entry restored) → MT 89:1 / LXX 88:1", () => {
    const p = new CodexParser().parse("Psalm 89:0").first()
    assert.equal(p.valid, true)
    assert.equal(p.convertVersion("mt").scripture.cv, "89:1")
    assert.equal(p.convertVersion("lxx").scripture.cv, "88:1")
})

test("Genesis 1:0 is still invalid (no title entry)", () => {
    const p = new CodexParser().parse("Genesis 1:0").first()
    assert.equal(p.valid.error, true)
    assert.equal(p.valid.code, 104)
})

test("combine() of a title passage keeps verse 0", () => {
    const parser = new CodexParser()
    const p = parser.parse("Psalm 18:0").getPassages()
    const combined = parser.combine(p)
    assert.equal(combined.scripture.cv, "18:0")
    assert.deepEqual(
        combined.passages.map((x) => x.verse),
        [0]
    )
})
