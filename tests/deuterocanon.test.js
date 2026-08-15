/**
 * Deuterocanonical book support (0.6.0) plus regression coverage for the
 * fixes that shipped alongside it: Song of Solomon chapter data, combine()
 * hash/type, chainable conversions, and the restored Ez abbreviation.
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

const lxxFirst = (ref) => new CodexParser().bibleVersion("lxx").parse(ref).first()
const first = (ref) => new CodexParser().parse(ref).first()

// ---------------------------------------------------------------------------
// Deuterocanonical books
// ---------------------------------------------------------------------------
test("every deuterocanonical book parses by full name and is valid", () => {
    const cases = [
        ["Tobit 4:5", "Tob.4.5"],
        ["Judith 8:1", "Jdt.8.1"],
        ["Wisdom of Solomon 7:26", "Wis.7.26"],
        ["Sirach 24:1", "Sir.24.1"],
        ["Baruch 4:4", "Bar.4.4"],
        ["1 Esdras 5:47", "1Esd.5.47"],
        ["1 Maccabees 2:1", "1Macc.2.1"],
        ["2 Maccabees 7:28", "2Macc.7.28"],
        ["3 Maccabees 5:1", "3Macc.5.1"],
        ["4 Maccabees 17:22", "4Macc.17.22"],
    ]
    for (const [ref, hash] of cases) {
        const p = lxxFirst(ref)
        assert.ok(p, `${ref} should parse`)
        assert.equal(p.scripture.hash, hash)
        assert.equal(p.valid, true, `${ref} should be valid`)
        assert.equal(p.testament, "old")
        assert.equal(p.version.value, "LXX")
    }
})

test("deuterocanonical abbreviations resolve to full book names", () => {
    const cases = [
        ["Tob 4:5", "Tobit"],
        ["Jdt 8:1", "Judith"],
        ["Wis 7:26", "Wisdom of Solomon"],
        ["Sir 24:1", "Sirach"],
        ["Ecclus 2:1", "Sirach"],
        ["Bar 4:4", "Baruch"],
        ["1 Esd 5:47", "1 Esdras"],
        ["1 Macc 2:1", "1 Maccabees"],
        ["4 Macc 17:22", "4 Maccabees"],
    ]
    for (const [ref, book] of cases) {
        assert.equal(lxxFirst(ref)?.book, book, `${ref} should resolve to ${book}`)
    }
})

test("SBL abbreviations format with the LXX suffix", () => {
    assert.equal(lxxFirst("Sirach 24:1-4").abbr, "Sir. 24:1-4 LXX")
    assert.equal(lxxFirst("1 Maccabees 2:1").abbr, "1 Macc. 2:1 LXX")
})

test("Epistle of Jeremiah and Prayer of Manasseh are single-chapter books", () => {
    assert.equal(lxxFirst("Ep Jer 5").scripture.hash, "EpJer.1.5")
    assert.equal(lxxFirst("Pr Man 8").scripture.hash, "PrMan.1.8")
})

test("numeric OSIS ids for the deuterocanon start after the protestant canon", () => {
    assert.equal(lxxFirst("Tobit 1:1").scripture.osisNumeric, "67001001") // Tobit = 67
    assert.equal(first("John 3:16").scripture.osisNumeric, "43003016") // John stays 43
    assert.equal(first("Revelation 22:21").scripture.osisNumeric, "66022021") // Rev stays 66
})

test("out-of-range deuterocanonical verses are flagged invalid", () => {
    const p = lxxFirst("Sirach 24:99")
    assert.equal(p.valid.error, true)
    assert.equal(p.valid.code, 104)
})

// ---------------------------------------------------------------------------
// Regression fixes shipped with 0.6.0
// ---------------------------------------------------------------------------
test("Song of Solomon chapter data resolves (was invalid, chapter 102)", () => {
    const p = first("Song of Solomon 2:1")
    assert.equal(p.valid, true)
    assert.equal(p.scripture.hash, "Song.2.1")
})

test("by-book combine() hash keeps the final comma verse", () => {
    const parser = new CodexParser().parse("Matthew 1:1-5, Matthew 12:16, Matthew 12:19")
    const combined = parser.getPassages().combine({ book: true, chapter: false })
    assert.equal(combined[0].scripture.hash, "Matt.1.1-Matt.12.19")
    assert.deepEqual(combined[0].end, { book: "Matthew", chapter: 12, verse: 19 })
})

test("combine() of a single range passage is typed chapter_verse_range", () => {
    const parser = new CodexParser().parse("Daniel 7:1-5")
    assert.equal(parser.combine().type, "chapter_verse_range")
})

test("converted passages keep their helpers, so conversions chain", () => {
    const eng = first("Genesis 31:55")
    const roundTrip = eng.getLXX().getEnglish()
    assert.equal(roundTrip.scripture.hash, "Gen.31.55")
    const nt = first("John 3:16").convertVersion("lxx")
    assert.equal(typeof nt.getEnglish, "function")
})

test("Ez abbreviation resolves to Ezra; Ezek still wins for Ezekiel", () => {
    assert.equal(first("Ez 1:3").book, "Ezra")
    assert.equal(first("Ezek 1:3").book, "Ezekiel")
})
