// Versification mappings for Proverbs.
// The app stores Rahlfs for Proverbs (no Göttingen edition), with Rahlfs'
// lettered verses merged into their base verse at import. Two seams need
// mapping (verified against the stored Greek text):
//
// Ch. 15/16 seam — MT 16:6-9 live as Rahlfs 15:27a-29b, merged into 15:27-29;
// LXX 16:7-9 are LXX-only pluses occupying those numbers, so an unmapped
// same-number lookup would silently return the wrong verse. MT 16:4's
// counterpart is the plus numbered LXX 16:9 (πάντα τὰ ἔργα τοῦ κυρίου …
// φυλάσσεται δὲ ὁ ἀσεβὴς εἰς ἡμέραν κακήν). MT 16:1 and 16:3 have no LXX
// counterpart.
//
// Ch. 20 — MT 20:20-22 live as Rahlfs 20:9a-c, merged into 20:9
// (… μὴ εἴπῃς Τείσομαι τὸν ἐχθρόν). MT 20:14-19 have no LXX counterpart.
//
// Genuine LXX omissions (no entry, lookup correctly finds nothing):
// 4:7; 8:33; 11:4; 15:31; 16:1, 3; 18:23-24; 19:1-2; 20:14-19; 21:5; 22:6; 23:23.
module.exports = {
    "16:4": {
        lxx: "16:9",
        mt: "16:4",
        eng: "16:4",
    },
    "16:6": {
        lxx: "15:27",
        mt: "16:6",
        eng: "16:6",
    },
    "16:7": {
        lxx: "15:28",
        mt: "16:7",
        eng: "16:7",
    },
    "16:8": {
        lxx: "15:29",
        mt: "16:8",
        eng: "16:8",
    },
    "16:9": {
        lxx: "15:29",
        mt: "16:9",
        eng: "16:9",
    },
    "20:20": {
        lxx: "20:9",
        mt: "20:20",
        eng: "20:20",
    },
    "20:21": {
        lxx: "20:9",
        mt: "20:21",
        eng: "20:21",
    },
    "20:22": {
        lxx: "20:9",
        mt: "20:22",
        eng: "20:22",
    },
}
