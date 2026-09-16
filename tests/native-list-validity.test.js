/**
 * Native (MT/LXX) references whose verse list mixes identity verses with
 * remapped ones, and the LXX Jeremiah 38:38–40 table entries.
 * Found by validating every row of the Tapestry masterlist against the parser.
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

const first = (ref) => new CodexParser().parse(ref).first()

test("a native list mixing an identity verse with remapped verses is valid (Malachi 3:1,23,24 MT)", () => {
    for (const ref of ["Malachi 3:1,23,24 MT", "Malachi 3:1,23 MT", "Malachi 3:23,24 MT"]) {
        assert.equal(first(ref).valid, true, `${ref} should be valid`)
    }
})

test("a native list is still invalid when any member is out of bounds", () => {
    assert.notEqual(first("Malachi 3:25 MT").valid, true)
    assert.notEqual(first("Malachi 3:1,25 MT").valid, true)
})

test("LXX Jeremiah 38:38–40 are valid native references", () => {
    for (const ref of ["Jeremiah 38:38 LXX", "Jeremiah 38:39 LXX", "Jeremiah 38:40 LXX", "Jeremiah 38:38-40 LXX"]) {
        assert.equal(first(ref).valid, true, `${ref} should be valid`)
    }
})

test("ESV Jeremiah 31:38 converts to LXX 38:38 and back", () => {
    const lxx = first("Jeremiah 31:38").convertVersion("lxx")
    assert.equal(lxx.passages[0].chapter, 38)
    assert.equal(lxx.passages[0].verse, 38)
    const eng = first("Jeremiah 38:38 LXX").convertVersion("eng")
    assert.equal(eng.passages[0].chapter, 31)
    assert.equal(eng.passages[0].verse, 38)
})
