// Versification mappings for Haggai.
// The app reads Haggai from the Göttingen edition, which moves ESV/MT 1:15 into
// chapter 2 as its verse 1 (Göttingen ch1 has 14 verses, vs 15 in ESV/MT) and
// merges it with ESV 2:1 under Göttingen 2:1 (the lone "(1)" in the text is a
// Rahlfs cross-reference). Everything from 2:2 on is identity, so only the
// shifted verse needs an entry.
module.exports = {
    "1:15": {
        lxx: "2:1",
        mt: "1:15",
        eng: "1:15",
    },
}
