// Tracks which OT books have a published Göttingen Septuaginta critical
// edition. Books listed as "gottingen" are ones the parser treats as
// Göttingen-attested by default; everything else falls back to Rahlfs.
//
// Update this list when new Göttingen volumes ship. The `lxx` field in each
// versification entry should reflect this default (Göttingen where attested,
// Rahlfs elsewhere); add an `lxxRahlfs` override only when the two editions
// disagree on numbering for a specific verse.
//
// Sources:
//   https://adw-goe.de/forschung/forschungsprojekte-akademienprogramm/septuaginta-unternehmen/
//   Hanhart, R. (1983). Esther. Septuaginta VIII.3.
//   Ziegler, J. & Munnich, O. (1999). Susanna - Daniel - Bel et Draco. Septuaginta XVI.2.
//
// As of 2026-04: published. Pentateuch is partial (Genesis published as
// Wevers 1974; Exodus, Leviticus, Numbers, Deuteronomy via Wevers).
module.exports = {
    Genesis: "gottingen",
    Exodus: "gottingen",
    Leviticus: "gottingen",
    Numbers: "gottingen",
    Deuteronomy: "gottingen",
    Joshua: "rahlfs",
    Judges: "rahlfs",
    Ruth: "gottingen",
    "1 Samuel": "rahlfs",
    "2 Samuel": "rahlfs",
    "1 Kings": "rahlfs",
    "2 Kings": "rahlfs",
    "1 Chronicles": "rahlfs",
    "2 Chronicles": "rahlfs",
    Ezra: "gottingen", // 1 Esdras / 2 Esdras (Hanhart)
    Nehemiah: "gottingen",
    Esther: "gottingen", // Hanhart 1983
    Job: "gottingen", // Ziegler 1982
    Psalms: "gottingen", // Rahlfs 1931
    Proverbs: "rahlfs",
    Ecclesiastes: "gottingen", // Gentry 2019
    "Song of Songs": "rahlfs",
    "Song of Solomon": "rahlfs",
    Isaiah: "gottingen", // Ziegler 1939
    Jeremiah: "gottingen", // Ziegler 1957
    Lamentations: "gottingen",
    Ezekiel: "gottingen", // Ziegler 1952
    Daniel: "gottingen", // Ziegler & Munnich 1999 (incl. Susanna, Bel)
    Hosea: "gottingen", // Ziegler 1943 (Duodecim Prophetae)
    Joel: "gottingen",
    Amos: "gottingen",
    Obadiah: "gottingen",
    Jonah: "gottingen",
    Micah: "gottingen",
    Nahum: "gottingen",
    Habakkuk: "gottingen",
    Zephaniah: "gottingen",
    Haggai: "gottingen",
    Zechariah: "gottingen",
    Malachi: "gottingen",
}
