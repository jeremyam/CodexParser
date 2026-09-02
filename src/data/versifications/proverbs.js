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
// Genuine LXX omissions (lxx: "" → missingPassages). Verified against the
// stored Rahlfs text: 4:7; 8:33; 11:4; 15:31; 16:1, 3; 18:23-24; 19:1-2;
// 20:14-19; 21:5; 22:6; 23:23.
module.exports = {
    "4:7": {
        lxx: "",
        mt: "4:7",
        eng: "4:7",
    },
    "8:33": {
        lxx: "",
        mt: "8:33",
        eng: "8:33",
    },
    "11:4": {
        lxx: "",
        mt: "11:4",
        eng: "11:4",
    },
    "15:31": {
        lxx: "",
        mt: "15:31",
        eng: "15:31",
    },
    "16:1": {
        lxx: "",
        mt: "16:1",
        eng: "16:1",
    },
    "16:3": {
        lxx: "",
        mt: "16:3",
        eng: "16:3",
    },
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
    "18:23": {
        lxx: "",
        mt: "18:23",
        eng: "18:23",
    },
    "18:24": {
        lxx: "",
        mt: "18:24",
        eng: "18:24",
    },
    "19:1": {
        lxx: "",
        mt: "19:1",
        eng: "19:1",
    },
    "19:2": {
        lxx: "",
        mt: "19:2",
        eng: "19:2",
    },
    "20:14": {
        lxx: "",
        mt: "20:14",
        eng: "20:14",
    },
    "20:15": {
        lxx: "",
        mt: "20:15",
        eng: "20:15",
    },
    "20:16": {
        lxx: "",
        mt: "20:16",
        eng: "20:16",
    },
    "20:17": {
        lxx: "",
        mt: "20:17",
        eng: "20:17",
    },
    "20:18": {
        lxx: "",
        mt: "20:18",
        eng: "20:18",
    },
    "20:19": {
        lxx: "",
        mt: "20:19",
        eng: "20:19",
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
    "21:5": {
        lxx: "",
        mt: "21:5",
        eng: "21:5",
    },
    "22:6": {
        lxx: "",
        mt: "22:6",
        eng: "22:6",
    },
    "23:23": {
        lxx: "",
        mt: "23:23",
        eng: "23:23",
    },
}
