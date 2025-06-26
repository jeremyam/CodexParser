// Versification mappings for Malachi, aligning ESV (English), BHS (Masoretic Text), and Göttingen LXX (Septuagint).
// ESV uses 4 chapters, with 4:1–6 corresponding to BHS 3:19–24 and LXX 3:19–24.
// Note: LXX reorders verses 4–6: ESV 4:4 = LXX 3:24, ESV 4:5 = LXX 3:22, ESV 4:6 = LXX 3:23.
// Chapters 1–3 have identical versification across all three (e.g., 1:1 = 1:1).
module.exports = {
    "4:1": {
        lxx: "3:19",
        mt: "3:19",
        eng: "4:1",
    },
    "4:2": {
        lxx: "3:20",
        mt: "3:20",
        eng: "4:2",
    },
    "4:3": {
        lxx: "3:21",
        mt: "3:21",
        eng: "4:3",
    },
    "4:4": {
        lxx: "3:24", // Law of Moses (matches BHS 3:22 content)
        mt: "3:22",
        eng: "4:4",
    },
    "4:5": {
        lxx: "3:22", // Elijah’s coming (matches BHS 3:23 content)
        mt: "3:23",
        eng: "4:5",
    },
    "4:6": {
        lxx: "3:23", // Hearts restored (matches BHS 3:24 content)
        mt: "3:24",
        eng: "4:6",
    },
}
