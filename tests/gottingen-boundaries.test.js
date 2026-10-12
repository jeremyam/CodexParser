const { test } = require("node:test")
const assert = require("node:assert")
const { CodexParser } = require("..")

const parse = (ref, version = "eng") => {
    const p = new CodexParser()
    p.bibleVersion(version)
    return p.parse(ref).getPassages()[0]
}
const convert = (ref, target, version = "eng") => parse(ref, version).convertVersion(target)
const cv = (ref) => convert(ref, "lxx").scripture.cv

// Exodus 36-39 follow Wevers' order (Einleitung C.5) and his verse division.
test("Exodus 36:10-34 (curtains and frames) are LXX minuses", () => {
    for (const v of [10, 20, 34]) {
        const lxx = convert(`Exodus 36:${v}`, "lxx")
        assert.equal(lxx.passages.length, 0)
    }
})

test("Exodus 37:23 (seven lamps) -> G 38:17; 37:25-28 (incense altar) are minuses", () => {
    assert.equal(cv("Exodus 37:23"), "38:17")
    assert.equal(convert("Exodus 37:25", "lxx").passages.length, 0)
})

test("Exodus 37:4 (the ark's poles) -> G 38:11, the poles of ark and table", () => {
    assert.equal(cv("Exodus 37:4"), "38:11")
})

test("Exodus 38:26 (the beka) spans G 39:2-3; 38:28 (hooks) -> G 39:6", () => {
    assert.equal(cv("Exodus 38:26"), "39:2-3")
    assert.equal(cv("Exodus 38:27"), "39:4-5")
    assert.equal(cv("Exodus 38:28"), "39:6")
})

test("Exodus 39:17-31 (breastpiece to plate) follow G 36:25-40", () => {
    assert.equal(cv("Exodus 39:16"), "36:23-24")
    assert.equal(cv("Exodus 39:17"), "36:25")
    assert.equal(cv("Exodus 39:30"), "36:38-39")
    assert.equal(cv("Exodus 39:31"), "36:40")
})

test("Exodus 39:32-41 follow Wevers' parenthetical MT numbers", () => {
    assert.equal(cv("Exodus 39:32"), "39:10-11")
    assert.equal(cv("Exodus 39:34"), "39:21")
    assert.equal(cv("Exodus 39:37"), "39:16-17")
    assert.equal(cv("Exodus 39:40"), "39:20-21")
    assert.equal(cv("Exodus 39:41"), "39:19")
})

test("Hebrew verses split by a Göttingen boundary map to the covering range", () => {
    assert.equal(cv("Leviticus 11:15"), "11:14-15")
    assert.equal(cv("Leviticus 11:14"), "11:14")
    assert.equal(cv("Leviticus 25:53"), "25:52-53")
    assert.equal(cv("Numbers 1:10"), "1:9-10")
    assert.equal(cv("Numbers 23:7"), "23:6-7")
    assert.equal(cv("Jeremiah 47:2"), "29:1-2")
    assert.equal(cv("2 Chronicles 4:22"), "4:21-22")
    assert.equal(cv("2 Chronicles 35:20"), "35:19-20")
})

test("A Göttingen verse reverse-maps to the first Hebrew verse it holds", () => {
    assert.equal(convert("Leviticus 11:14 LXX", "eng").scripture.cv, "11:14")
    assert.equal(convert("Exodus 38:14 LXX", "eng").scripture.cv, "37:17")
})
