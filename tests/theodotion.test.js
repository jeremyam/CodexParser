/**
 * Theodotion (θ′, "LXX-Th") coverage: the LXX-Th suffix, English → Theodotion
 * conversion, Theodotion-native references, and the column rule in
 * src/data/theodotion.js (MT numbering in Daniel 3-4, the lxx column elsewhere).
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

const first = (ref) => new CodexParser().parse(ref).getPassages().first()
const th = (ref) => first(ref).getTheodotion().scripture.cv
const eng = (ref) => first(ref).getEnglish().scripture.cv

// ---------------------------------------------------------------------------
// Suffix detection
// ---------------------------------------------------------------------------
test("trailing LXX-Th sets the Theodotion version and survives in abbr", () => {
    const p = first("Daniel 7:13 LXX-Th")
    assert.deepEqual(p.version, { name: "Theodotion", value: "LXX-Th", abbreviation: "th" })
    assert.equal(p.scripture.cv, "7:13")
    assert.equal(p.abbr, "Dan. 7:13 LXX-Th")
    assert.equal(p.valid, true)
})

test("LXX-Th is case-insensitive and not read as a bare LXX", () => {
    assert.equal(first("Daniel 7:13 lxx-th").version.abbreviation, "th")
    assert.equal(first("Daniel 7:13 LXX").version.abbreviation, "lxx")
    assert.equal(first("Daniel 7:13 MT").version.abbreviation, "mt")
})

test("an LXX-Th OT reference beside an NT one yields both passages", () => {
    const passages = new CodexParser().parse("Daniel 7:13 LXX-Th // Mark 14:62").getPassages()
    assert.deepEqual(
        Array.from(passages, (p) => `${p.book} ${p.scripture.cv} ${p.version.value}`),
        ["Daniel 7:13 LXX-Th", "Mark 14:62 ENG"]
    )
})

test("bibleVersion accepts lxx-th and th", () => {
    for (const version of ["lxx-th", "th", "LXX-Th"]) {
        const p = new CodexParser().bibleVersion(version).parse("Daniel 3:31").getPassages().first()
        assert.equal(p.version.value, "LXX-Th")
        assert.equal(p.getEnglish().scripture.cv, "4:1")
    }
})

// ---------------------------------------------------------------------------
// English → Theodotion
// ---------------------------------------------------------------------------
test("Daniel 3-4 follow the MT, not the Old Greek", () => {
    assert.equal(th("Daniel 3:24"), "3:24") // OG 3:91
    assert.equal(first("Daniel 3:24").getLXX().scripture.cv, "3:91")
    assert.equal(th("Daniel 3:30"), "3:30")
    assert.equal(th("Daniel 4:1"), "3:31")
    assert.equal(th("Daniel 4:1-3"), "3:31-33")
    assert.equal(th("Daniel 4:4-6"), "4:1-3")
    assert.equal(th("Daniel 4:37"), "4:34")
})

test("Daniel 5:31 and chapter 6 follow the English division, not the MT", () => {
    assert.equal(th("Daniel 5:31"), "5:31")
    assert.equal(first("Daniel 5:31").getMT().scripture.cv, "6:1")
    assert.equal(th("Daniel 6:1"), "6:1")
    assert.equal(th("Daniel 6:28"), "6:28")
})

test("chapters outside the renumbered ones are identity", () => {
    assert.equal(th("Daniel 7:13"), "7:13")
    assert.equal(th("Daniel 12:2"), "12:2")
})

test("the Old Greek additions in Daniel 3 have no Theodotion counterpart", () => {
    const converted = first("Daniel 3:52 LXX").getTheodotion()
    assert.equal(converted.passages.length, 0)
    assert.equal(converted.missingPassages[0].missingIn, "th")
})

test("Jeremiah θ′ supplements land at Ziegler's coordinates", () => {
    assert.equal(th("Jeremiah 33:14-26"), "40:14-26")
    assert.equal(th("Jeremiah 39:4"), "46:4")
    assert.equal(th("Jeremiah 48:45-47"), "31:45-47")
    assert.equal(th("Jeremiah 49:6"), "30:22")
})

test("convertVersion and the collection accept LXX-Th", () => {
    assert.equal(first("Daniel 4:1").convertVersion("LXX-Th").scripture.cv, "3:31")
    assert.equal(first("Daniel 4:1").convertVersion("th").version.value, "LXX-Th")
    const collection = new CodexParser().parse("Daniel 4:1-3; Jeremiah 33:15").getPassages()
    assert.deepEqual(
        Array.from(collection.getTheodotion(), (p) => p.scripture.cv),
        ["3:31-33", "40:15"]
    )
    assert.deepEqual(
        Array.from(collection.getVersion("LXX-Th"), (p) => p.version.abbreviation),
        ["th", "th"]
    )
})

// ---------------------------------------------------------------------------
// Theodotion-native references
// ---------------------------------------------------------------------------
test("Theodotion-native verses map back to English and stay valid", () => {
    assert.equal(eng("Daniel 3:31 LXX-Th"), "4:1")
    assert.equal(first("Daniel 3:31 LXX-Th").valid, true) // English Daniel 3 ends at v. 30
    assert.equal(eng("Daniel 3:31-33 LXX-Th"), "4:1-3")
    assert.equal(eng("Daniel 4:1 LXX-Th"), "4:4")
    assert.equal(eng("Daniel 4:34 LXX-Th"), "4:37")
    assert.equal(eng("Daniel 3:24 LXX-Th"), "3:24")
    assert.equal(eng("Daniel 6:1 LXX-Th"), "6:1")
    assert.equal(eng("Jeremiah 40:15 LXX-Th"), "33:15")
})

test("Theodotion-native verses convert to the MT and the Old Greek", () => {
    const p = first("Daniel 3:31 LXX-Th")
    assert.equal(p.getMT().scripture.cv, "3:31")
    assert.equal(p.getLXX().scripture.cv, "4:34a")
})

test("combine merges a Theodotion-native passage with an English one", () => {
    const parser = new CodexParser()
    const combined = parser.combine(parser.parse("Daniel 3:31 LXX-Th; Daniel 4:4").getPassages())
    assert.equal(combined.scripture.passage, "Daniel 4:1,4")
    assert.equal(combined.version.value, "ENG")
})
