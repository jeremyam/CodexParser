const { test } = require("node:test")
const assert = require("node:assert")
const { CodexParser } = require("..")

const parse = (ref) => new CodexParser().parse(ref).getPassages()[0]
const cv = (ref, target) => parse(ref).convertVersion(target).scripture.cv
const addresses = (converted) => converted.passages.map((p) => `${p.chapter}:${p.verse}${p.verseSuffix || ""}`)

// 3 Kingdoms: Rahlfs prints MT 4:20-5:8 in the second miscellany (2:46a-l) and at
// 5:1; his apparatus names each place ("46a cf. M 4:20", "46f, 46g = M 5:4, 5",
// "46i cf. M 5:6", "46k cf. M 5:1", "5:1 = M 7, 8").
test("1 Kings 4:20-28 reaches the miscellany instead of reading as LXX minuses", () => {
    assert.equal(cv("1 Kings 4:20", "lxx"), "2:46a")
    assert.equal(cv("1 Kings 4:21", "lxx"), "2:46b,46k")
    assert.equal(cv("1 Kings 5:1 MT", "lxx"), "2:46b,46k")
    assert.equal(cv("1 Kings 4:25", "lxx"), "2:46g")
    assert.equal(cv("1 Kings 4:26", "lxx"), "2:46i")
    assert.equal(cv("1 Kings 4:28", "lxx"), "5:1")
    const whole = parse("1 Kings 4:20-28").convertVersion("lxx")
    assert.equal(whole.missingPassages, undefined)
    assert.deepEqual(addresses(whole).slice(0, 3), ["2:46a", "2:46b", "2:46k"])
})

test("1 Kings 4:17 is Rahlfs 4:19; 7:46-47 trade places; 6:37-38 are 6:1c-d", () => {
    assert.equal(cv("1 Kings 4:17", "lxx"), "4:19")
    assert.equal(cv("1 Kings 7:46", "lxx"), "7:33")
    assert.equal(cv("1 Kings 7:47", "lxx"), "7:32")
    assert.equal(cv("1 Kings 6:37-38", "lxx"), "6:1c,1d")
    assert.equal(cv("1 Kings 5:17", "lxx"), "6:1a")
})

test("1 Kings 3:1, 8:12-13 and 9:15-25 follow Rahlfs' relocations", () => {
    assert.equal(cv("1 Kings 3:1", "lxx"), "5:14a")
    assert.equal(cv("1 Kings 8:12-13", "lxx"), "8:53a")
    assert.equal(cv("1 Kings 9:24", "lxx"), "9:9a")
    assert.equal(cv("1 Kings 9:20-22", "lxx"), "10:22b,22c")
})

test("3 Kingdoms sets Naboth (MT 21) before the Aramean wars (MT 20)", () => {
    assert.equal(cv("1 Kings 21:19", "lxx"), "20:19")
    assert.equal(cv("1 Kings 20:30-43", "lxx"), "21:30-43")
    assert.equal(cv("1 Kings 20:19 LXX", "eng"), "21:19")
    assert.equal(cv("1 Kings 21:1 LXX", "mt"), "20:1")
})

test("genuine 3 Kingdoms minuses stay missing", () => {
    const lxx = parse("1 Kings 7:31").convertVersion("lxx")
    assert.equal(lxx.passages.length, 0)
    assert.equal(lxx.missingPassages.length, 1)
})

// Rahlfs letters run past "e"; a bare "f" is also the German "and following".
test("verse letters f-z parse only in an LXX-tagged reference; s stays the sequens", () => {
    assert.deepEqual(addresses(parse("1 Kings 2:46g LXX")), ["2:46g"])
    assert.deepEqual(addresses(parse("1 Kings 12:24n LXX")), ["12:24n"])
    assert.deepEqual(addresses(parse("1 Kings 2:46f")), ["2:46"])
    assert.deepEqual(addresses(parse("Psalm 22:2f.")), ["22:2"])
    assert.deepEqual(addresses(parse("Matthew 5:3ff")), ["5:3"])
    assert.deepEqual(addresses(parse("Psalm 118:25s")), ["118:25", "118:26"])
})

test("combine keeps lettered verses as their own tokens", () => {
    const parser = new CodexParser()
    const converted = parser.parse("1 Kings 4:20-28").getPassages().map((p) => p.convertVersion("lxx"))
    const combined = parser.combine(converted)
    assert.equal(combined.scripture.cv, "2:46a,46b,46g,46i,46k;5:1-4")
    assert.ok(combined.passages.some((p) => p.verse === 46 && p.verseSuffix === "g"))
})

// Göttingen volumes that number as the English does where the Hebrew differs.
test("Wevers' Leviticus: 5:1-19, 6:1-40 (through Eng 7:10), 7:1-28 (= Eng 7:11-38)", () => {
    assert.equal(cv("Leviticus 6:9", "lxx"), "6:9")
    assert.equal(cv("Leviticus 6:9", "mt"), "6:2")
    assert.equal(cv("Leviticus 7:1", "lxx"), "6:31")
    assert.equal(cv("Leviticus 7:11", "lxx"), "7:1")
    assert.equal(cv("Leviticus 7:38", "lxx"), "7:28")
    assert.equal(cv("Leviticus 7:1 LXX", "eng"), "7:11")
})

test("Wevers' Numbers: 13:1 is Eng 12:16; chapters 16-17 divide as the English; 6:27 is his 6:24", () => {
    assert.equal(cv("Numbers 12:16", "lxx"), "13:1")
    assert.equal(cv("Numbers 13:33", "lxx"), "13:34")
    assert.equal(cv("Numbers 16:36", "lxx"), "16:36")
    assert.equal(cv("Numbers 16:36", "mt"), "17:1")
    assert.equal(cv("Numbers 17:8", "lxx"), "17:8")
    assert.equal(cv("Numbers 6:27", "lxx"), "6:24")
})

test("Hanhart's 2 Chronicles and Nehemiah divide chapters as the English does", () => {
    assert.equal(cv("2 Chronicles 2:2", "lxx"), "2:2")
    assert.equal(cv("2 Chronicles 2:2", "mt"), "2:1")
    assert.equal(cv("2 Chronicles 14:1", "lxx"), "14:1")
    assert.equal(cv("Nehemiah 4:1", "lxx"), "4:1")
    assert.equal(cv("Nehemiah 4:1", "mt"), "3:33")
    assert.equal(cv("Nehemiah 9:38", "lxx"), "9:38")
    assert.equal(cv("Nehemiah 10:39", "lxx"), "10:39")
})

test("Wevers' Genesis: 2:25 opens 3:1; chapter 31 ends at 31:55", () => {
    assert.equal(cv("Genesis 2:25", "lxx"), "3:1")
    assert.equal(cv("Genesis 31:55", "lxx"), "31:55")
    assert.equal(cv("Genesis 31:55", "mt"), "32:1")
    assert.equal(cv("Genesis 32:32", "lxx"), "32:32")
})

test("Ziegler's Jeremiah 9 numbers 1-26; Rahlfs' 1 Kingdoms 20:42 keeps its number", () => {
    assert.equal(cv("Jeremiah 9:1", "lxx"), "9:1")
    assert.equal(cv("Jeremiah 9:1", "mt"), "8:23")
    assert.equal(cv("Jeremiah 9:26", "lxx"), "9:26")
    assert.equal(cv("1 Samuel 20:42", "lxx"), "20:42")
})
