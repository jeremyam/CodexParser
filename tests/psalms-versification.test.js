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
