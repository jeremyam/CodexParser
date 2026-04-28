// Versification mappings for Esther.
//
// Hebrew Esther (1:1-10:3): MT and LXX otherwise share numbering. The one
// versification difference within the canonical Hebrew portion is the bridge
// verse: Vulgate/MT 1:1 corresponds to LXX 1:1s in Hanhart's Göttingen Esther
// (1983) and the revised Rahlfs-Hanhart 2006 hand-edition - the canonical
// "in the days of Ahasuerus" sentence ends Addition A's interpolated cluster
// before chapter 1 verse 2 resumes.
//
// Greek Esther adds six blocks (Additions A-F) to the LXX text. Keys use the
// Vulgate / RSV-with-Apocrypha numbering (chapters 10:4-16:24 appended after
// the Hebrew portion). Letter sequences in the `lxx` field were verified
// against the Septuaginta SESB edition (Rahlfs-Hanhart 2006, ed. Hanhart) for
// each addition. Hanhart's letters skip 'j' throughout (not a Greek letter)
// and additionally skip 'v' in Addition C and 'v','w' in Addition E.
//
// Vulgate-to-Hanhart counts:
//   Add A (1:1a-1:1r):  17 letters = 17 Vulgate verses (11:2-12 + 12:1-6) 1:1
//   Bridge (1:1s):       1 letter  = canonical Vulgate 1:1
//   Add B (3:13a-13g):   7 letters = 7 Vulgate verses
//   Add C (4:17a-17z):  24 letters < 30 Vulgate verses (13:8-18 + 14:1-19);
//                       last 6 verses (14:14-19) collapse to 4:17z
//   Add D (5:1a-1f, 5:2a-2b): 8 letters < 16 Vulgate verses (15:1-16);
//                       overflow collapses to 5:2b
//   Add E (8:12a-12u, 12x): 21 letters < 24 Vulgate verses (16:1-24);
//                       last 3 verses (16:22-24) collapse to 8:12x
//   Add F (10:3a-3l):   11 letters = 11 Vulgate verses (10:4-13 + 11:1) 1:1
//
// Where Hanhart's letter run is shorter than the Vulgate verse count, this
// file maps the surplus Vulgate verses to the last available letter rather
// than fabricate letters Hanhart does not print. If the user's edition
// (Rahlfs vs Göttingen) handles the overflow differently, override the
// affected entries with `lxxRahlfs`.

// Build a verse map from a list of LXX letter-suffixes (in order) and the
// starting deuterocanonical chapter:verse. Each entry is shaped as the
// existing versification format: { lxx, mt: null, eng }.
function mapAddition(engChapter, engStart, lxxAnchorChapter, lxxAnchorVerse, letters, vulgateCount) {
    const out = {}
    for (let i = 0; i < vulgateCount; i++) {
        const eng = `${engChapter}:${engStart + i}`
        // Use letter[i] if available; once we exhaust letters, collapse to the
        // last letter (this only happens in C, D, E where Vulgate > Hanhart).
        const letterIdx = Math.min(i, letters.length - 1)
        const lxx = `${lxxAnchorChapter}:${lxxAnchorVerse}${letters[letterIdx]}`
        out[eng] = { lxx, mt: null, eng }
    }
    return out
}

// Build a verse map for an addition that uses two LXX anchors (e.g., Add D
// has 5:1a-1f then 5:2a-2b). `segments` is an array of
// { chapter, verse, letters } entries traversed in order.
function mapSegmentedAddition(engChapter, engStart, segments, vulgateCount) {
    const out = {}
    const flat = []
    for (const seg of segments) {
        for (const ch of seg.letters) flat.push({ chapter: seg.chapter, verse: seg.verse, letter: ch })
    }
    for (let i = 0; i < vulgateCount; i++) {
        const eng = `${engChapter}:${engStart + i}`
        const idx = Math.min(i, flat.length - 1)
        const slot = flat[idx]
        out[eng] = { lxx: `${slot.chapter}:${slot.verse}${slot.letter}`, mt: null, eng }
    }
    return out
}

// Letter sequences (verified against Hanhart 2006 in Logos LLS:LXXSESB).
const ADD_A_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l", "m", "n", "o", "p", "q", "r"] // 17, skip j
const ADD_B_LETTERS = ["a", "b", "c", "d", "e", "f", "g"] // 7
const ADD_C_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "w", "x", "y", "z"] // 24, skip j+v
const ADD_E_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "x"] // 21, skip j+v+w
const ADD_F_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "k", "l"] // 11, skip j

module.exports = {
    // Addition F (interpretation of Mordecai's dream + colophon): Vulgate
    // 10:4-13 + 11:1 -> LXX 10:3a-3l. Hanhart printed sequence in Esther 10.
    ...mapAddition(10, 4, 10, 3, ADD_F_LETTERS, 10),
    "11:1": { lxx: "10:3l", mt: null, eng: "11:1" }, // colophon

    // Addition A part 1 (Mordecai's dream): Vulgate 11:2-12 -> LXX 1:1a-1l.
    ...mapAddition(11, 2, 1, 1, ADD_A_LETTERS.slice(0, 11), 11),
    // Addition A part 2 (Mordecai uncovers the eunuchs' plot): Vulgate
    // 12:1-6 -> LXX 1:1m-1r.
    ...mapAddition(12, 1, 1, 1, ADD_A_LETTERS.slice(11), 6),

    // Bridge: canonical Vulgate/MT 1:1 corresponds to Hanhart LXX 1:1s, the
    // last letter-suffixed slot before the chapter resumes at 1:2.
    "1:1": { lxx: "1:1s", mt: "1:1", eng: "1:1" },

    // Addition B (king's first decree): Vulgate 13:1-7 -> LXX 3:13a-3:13g.
    ...mapAddition(13, 1, 3, 13, ADD_B_LETTERS, 7),

    // Addition C (Mordecai's prayer + Esther's prayer):
    //   Mordecai: Vulgate 13:8-18  -> LXX 4:17a-4:17l (11 letters)
    //   Esther:   Vulgate 14:1-19  -> LXX 4:17m-4:17z (13 letters);
    //             Vulgate 14:14-19 collapse to 4:17z because Hanhart's
    //             addition concludes at 4:17z (24-letter run total).
    ...mapAddition(13, 8, 4, 17, ADD_C_LETTERS.slice(0, 11), 11),
    ...mapAddition(14, 1, 4, 17, ADD_C_LETTERS.slice(11), 19),

    // Addition D (Esther approaches the king): Vulgate 15:1-16 distributed
    // across two LXX anchors (5:1a-1f then 5:2a-2b = 8 letters total).
    // Vulgate 15:9-16 collapse to 5:2b because Hanhart's addition is shorter.
    ...mapSegmentedAddition(15, 1, [
        { chapter: 5, verse: 1, letters: ["a", "b", "c", "d", "e", "f"] },
        { chapter: 5, verse: 2, letters: ["a", "b"] },
    ], 16),

    // Addition E (king's second decree): Vulgate 16:1-24 -> LXX 8:12a-12u, 12x
    // (21 letters; Hanhart skips v and w). Vulgate 16:22-24 collapse to 8:12x.
    ...mapAddition(16, 1, 8, 12, ADD_E_LETTERS, 24),
}
