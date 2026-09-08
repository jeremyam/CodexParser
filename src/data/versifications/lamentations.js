// Versification mappings for Lamentations (Threni).
//
// The app reads Lamentations from Ziegler's Göttingen edition (Septuaginta XV:
// Ieremias, Baruch, Threni, Epistula Ieremiae). Ziegler divides the verses by
// Greek stichs, and in three places that division departs from the Hebrew
// acrostic verses (MT = English throughout, so `mt` = `eng`):
//
//   Ziegler 1:15 = MT 1:15 + the first stich of MT 1:16 ("Ἐπὶ τούτοις ἐγὼ κλαίω")
//   Ziegler 1:16 = the rest of MT 1:16 ("ὁ ὀφθαλμός μου κατήγαγεν ὕδωρ …")
//   Ziegler 2:1  = MT 2:1 minus its last stich
//   Ziegler 2:2  = that stich ("ἐν ἡμέρᾳ ὀργῆς αὐτοῦ") + MT 2:2
//   Ziegler 4:17 = MT 4:17 minus its last stich
//   Ziegler 4:18 = that stich ("ἀπεσκοπεύσαμεν εἰς ἔθνος οὐ σῷζον") + the first
//                  stich of MT 4:18 ("ἐθηρεύσαμεν μικροὺς ἡμῶν …")
//   Ziegler 4:19 = the rest of MT 4:18 ("ἤγγικεν ὁ καιρὸς ἡμῶν …") + MT 4:19
//
// Rahlfs keeps the Hebrew numbering at all three points (Ziegler prints the
// Rahlfs number in parentheses at 1:16 and 2:2). Where a Hebrew verse spans two
// Ziegler verses the `lxx` value is the range that contains the whole verse,
// as with Genesis 31:48, so a consumer sees every Greek word of the Hebrew
// verse (plus the neighbouring stich) rather than half of it.
//
// The Old Greek has no counterpart for MT 3:22-24 (the ח strophe) or 3:29 —
// Ziegler's text runs 3:21 → 3:25 and 3:28 → 3:30 — so those are LXX minuses.
//
// ORDER MATTERS within each shifted group: a reverse lookup ("Lamentations
// 4:19 LXX") takes the FIRST entry whose `lxx` value covers the verse, so the
// entry whose `lxx` is a single verse must precede the ranges that also cover
// it. Verified against the printed Göttingen text (Logos LLS:GSXVJER arts.
// 406-410) and its Apparatus I on 2026-09-07.
module.exports = {
    "1:15": {
        lxx: "1:15",
        mt: "1:15",
        eng: "1:15",
    },
    "1:16": {
        lxx: "1:15-16",
        mt: "1:16",
        eng: "1:16",
    },
    "2:2": {
        lxx: "2:2",
        mt: "2:2",
        eng: "2:2",
    },
    "2:1": {
        lxx: "2:1-2",
        mt: "2:1",
        eng: "2:1",
    },
    "3:22": {
        lxx: null,
        mt: "3:22",
        eng: "3:22",
    },
    "3:23": {
        lxx: null,
        mt: "3:23",
        eng: "3:23",
    },
    "3:24": {
        lxx: null,
        mt: "3:24",
        eng: "3:24",
    },
    "3:29": {
        lxx: null,
        mt: "3:29",
        eng: "3:29",
    },
    "4:19": {
        lxx: "4:19",
        mt: "4:19",
        eng: "4:19",
    },
    "4:18": {
        lxx: "4:18-19",
        mt: "4:18",
        eng: "4:18",
    },
    "4:17": {
        lxx: "4:17-18",
        mt: "4:17",
        eng: "4:17",
    },
}
