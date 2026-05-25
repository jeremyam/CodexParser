// Versification mappings for Zephaniah.
// The app reads Zephaniah from the Göttingen edition, which moves ESV/MT 2:15
// into chapter 3 as its verse 1 (Göttingen ch2 has 14 verses, vs 15 in
// ESV/MT). So Göttingen 3:1 = ESV 2:15 and Göttingen 3:2 = ESV 3:1; Göttingen
// then merges ESV 3:1+3:2 under 3:2 (the lone "(2)" in the text is a Rahlfs
// cross-reference), realigning from 3:3 on. Only the two shifted verses need an
// entry; everything else is identity.
module.exports = {
    "2:15": {
        lxx: "3:1",
        mt: "2:15",
        eng: "2:15",
    },
    "3:1": {
        lxx: "3:2",
        mt: "3:1",
        eng: "3:1",
    },
}
