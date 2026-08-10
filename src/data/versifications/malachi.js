// Versification mappings for Malachi.
// The app reads Malachi from the Göttingen edition (Duodecim Prophetae XIII),
// which has a chapter 4 numbered 4:1–6 like English — but the Göttingen text
// REORDERS the final verses per the LXX manuscript tradition, placing
// "Remember the law of Moses" (MT 3:22 / ESV 4:4) last, at 4:6. The
// parenthetical numbers in the edition ((19)1 … (24)6) are sequential by
// position, not verse identity — matching numbers to content:
//   Göttingen 4:4 (ἀποστέλλω ὑμῖν Ηλίαν)  = MT 3:23 = ESV 4:5
//   Göttingen 4:5 (ὃς ἀποκαταστήσει)      = MT 3:24 = ESV 4:6
//   Göttingen 4:6 (μνήσθητε νόμου Μωυσῆ)  = MT 3:22 = ESV 4:4
// 4:1–3 are unaffected (lxx = eng, mt = 3:19–21).
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
        lxx: "4:6",
        mt: "3:22",
        eng: "4:4",
    },
    "4:5": {
        lxx: "4:4",
        mt: "3:23",
        eng: "4:5",
    },
    "4:6": {
        lxx: "4:5",
        mt: "3:24",
        eng: "4:6",
    },
}
