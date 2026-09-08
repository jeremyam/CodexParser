const { test } = require("node:test")
const assert = require("node:assert")
const { CodexParser } = require("..")

const parse = (ref, version = "eng") => {
    const p = new CodexParser()
    p.bibleVersion(version)
    return p.parse(ref).getPassages()[0]
}
const convert = (ref, target, version = "eng") => parse(ref, version).convertVersion(target)
const verses = (converted) => converted.passages.map((p) => `${p.chapter}:${p.verse}`)

// Ziegler 1:15 absorbs the first stich of MT 1:16 ("Ἐπὶ τούτοις ἐγὼ κλαίω").
test("Lam 1:15 keeps its number; 1:16 spans Ziegler 1:15-16", () => {
    assert.equal(convert("Lamentations 1:15", "lxx").scripture.cv, "1:15")
    const v16 = convert("Lamentations 1:16", "lxx")
    assert.equal(v16.scripture.cv, "1:15-16")
    assert.deepEqual(verses(v16), ["1:15", "1:16"])
})

// Ziegler 2:2 begins with the last stich of MT 2:1 ("ἐν ἡμέρᾳ ὀργῆς αὐτοῦ").
test("Lam 2:1 spans Ziegler 2:1-2; 2:2 keeps its number", () => {
    assert.equal(convert("Lamentations 2:1", "lxx").scripture.cv, "2:1-2")
    assert.equal(convert("Lamentations 2:2", "lxx").scripture.cv, "2:2")
    assert.equal(convert("Lamentations 2:3", "lxx").scripture.cv, "2:3")
})

test("Lam 3:22-24 and 3:29 are Old Greek minuses", () => {
    for (const v of [22, 23, 24, 29]) {
        const c = convert(`Lamentations 3:${v}`, "lxx")
        assert.equal(c.passages.length, 0, `3:${v} should have no LXX passage`)
        assert.equal(c.missingPassages.length, 1)
        assert.equal(c.missingPassages[0].missingIn, "lxx")
        assert.equal(c.missingPassages[0].verse, v)
    }
    assert.equal(convert("Lamentations 3:21", "lxx").scripture.cv, "3:21")
    assert.equal(convert("Lamentations 3:25", "lxx").scripture.cv, "3:25")
    assert.equal(convert("Lamentations 3:28", "lxx").scripture.cv, "3:28")
    assert.equal(convert("Lamentations 3:30", "lxx").scripture.cv, "3:30")
})

test("Lam 3:21-25 range drops the minuses and keeps the rest", () => {
    const c = convert("Lamentations 3:21-25", "lxx")
    assert.deepEqual(verses(c), ["3:21", "3:25"])
    assert.deepEqual(
        c.missingPassages.map((m) => m.verse),
        [22, 23, 24]
    )
})

// Ziegler 4:18 = last stich of MT 4:17 + first stich of MT 4:18;
// Ziegler 4:19 = rest of MT 4:18 ("ἤγγικεν ὁ καιρὸς ἡμῶν") + MT 4:19.
test("Lam 4:17-19 map to the covering Ziegler ranges", () => {
    assert.equal(convert("Lamentations 4:16", "lxx").scripture.cv, "4:16")
    assert.equal(convert("Lamentations 4:17", "lxx").scripture.cv, "4:17-18")
    const v18 = convert("Lamentations 4:18", "lxx")
    assert.equal(v18.scripture.cv, "4:18-19")
    assert.deepEqual(verses(v18), ["4:18", "4:19"])
    assert.equal(convert("Lamentations 4:19", "lxx").scripture.cv, "4:19")
    assert.equal(convert("Lamentations 4:20", "lxx").scripture.cv, "4:20")
})

test("Lam 4:17-19 as a range converts to LXX 4:17-19 without duplicates", () => {
    const c = convert("Lamentations 4:17-19", "lxx")
    assert.deepEqual(verses(c), ["4:17", "4:18", "4:19"])
    assert.equal(c.scripture.cv, "4:17-19")
})

test("MT numbering equals English throughout Lamentations", () => {
    for (const ref of ["1:16", "2:1", "3:22", "4:17", "4:18", "4:19", "5:22"]) {
        assert.equal(convert(`Lamentations ${ref}`, "mt").scripture.cv, ref)
    }
})

test("LXX-tagged references reverse-map to the Hebrew verse whose text they hold", () => {
    const cases = {
        "1:15": "1:15",
        "1:16": "1:16",
        "2:1": "2:1",
        "2:2": "2:2",
        "4:17": "4:17",
        "4:18": "4:18",
        "4:19": "4:19",
        "4:20": "4:20",
    }
    for (const [lxx, eng] of Object.entries(cases)) {
        const p = parse(`Lamentations ${lxx} LXX`)
        assert.equal(p.valid, true, `Lamentations ${lxx} LXX should be valid`)
        assert.equal(p.version.abbreviation, "lxx")
        assert.equal(p.convertVersion("eng").scripture.cv, eng, `LXX ${lxx} -> eng ${eng}`)
        assert.equal(p.convertVersion("mt").scripture.cv, eng, `LXX ${lxx} -> mt ${eng}`)
    }
})

test("Hübner-style 'Lamentations 4:18,19 LXX' covers English 4:18-19", () => {
    const p = parse("Lamentations 4:18,19 LXX")
    assert.deepEqual(verses(p.convertVersion("eng")), ["4:18", "4:19"])
    assert.equal(p.convertVersion("eng").scripture.cv, "4:18-19")
})
