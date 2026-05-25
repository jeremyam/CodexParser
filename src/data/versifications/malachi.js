// Versification mappings for Malachi.
// The app reads Malachi from the Göttingen edition (Duodecim Prophetae XIII),
// which has a chapter 4 numbered like English: Göttingen 4:1–6 = ESV 4:1–6,
// sequential, with Rahlfs in parens ((R19)G1 … (R24)G6). MT folds these into
// chapter 3 as 3:19–24. So `lxx` = `eng`; `mt` = 3:19–24 sequential.
// (Note: the Rahlfs edition reorders 3:22–24; the Göttingen edition does not,
// and the app uses Göttingen — so no reorder here.)
module.exports = {
    "4:1": {
        lxx: "4:1",
        mt: "3:19",
        eng: "4:1",
    },
    "4:2": {
        lxx: "4:2",
        mt: "3:20",
        eng: "4:2",
    },
    "4:3": {
        lxx: "4:3",
        mt: "3:21",
        eng: "4:3",
    },
    "4:4": {
        lxx: "4:4",
        mt: "3:22",
        eng: "4:4",
    },
    "4:5": {
        lxx: "4:5",
        mt: "3:23",
        eng: "4:5",
    },
    "4:6": {
        lxx: "4:6",
        mt: "3:24",
        eng: "4:6",
    },
}
