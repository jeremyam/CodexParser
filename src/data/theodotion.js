// Theodotion (θ′, "LXX-Th") numbering, resolved from the existing versification
// columns rather than stored as a column of its own.
//
// Daniel: the Göttingen Theodotion text (Ziegler-Munnich-Fraenkel, Septuaginta
// XVI.2) as the canonical chapters only, without the Greek additions. Chapters 3-4
// follow the MT (MT 3:31-33 = ESV 4:1-3, MT 4:1-34 = ESV 4:4-37, and ESV 3:24-30
// stay 3:24-30 rather than the Old Greek's 3:91-97), while 5:31 and chapter 6
// follow the English division, as both Göttingen Greek texts print them. Outside
// chapters 3-4 that is exactly the `lxx` column.
//
// Jeremiah: the hexaplaric θ′ supplements Ziegler prints sub ※ (MT 33:14-26,
// 39:4-13, 48:45-47, 49:6) already carry their Greek coordinates in the `lxx`
// column (40:14-26, 46:4-13, 31:45-47, 30:22).
//
// Every other book: Theodotion follows the `lxx` column.
const MT_NUMBERED_CHAPTERS = {
    Daniel: [3, 4],
}

/**
 * The versification column that holds a verse's Theodotion number.
 * @param {string} book - Book name
 * @param {Object} versification - A versification entry ({ eng, mt, lxx, ... })
 * @returns {"mt"|"lxx"} Column to read
 */
function theodotionColumn(book, versification) {
    const chapters = MT_NUMBERED_CHAPTERS[book]
    if (chapters) {
        // Entries with no English verse are the Old Greek's additions (Daniel 3:24-90
        // LXX). Theodotion is numbered without them, so they read the MT column, which
        // is empty: no Theodotion counterpart.
        if (!versification?.eng) return "mt"
        const engChapter = Number(String(versification.eng).split(":")[0])
        if (chapters.includes(engChapter)) return "mt"
    }
    return "lxx"
}

/**
 * A verse's Theodotion number from a versification entry, or undefined when the
 * entry carries no value for the governing column.
 * @param {string} book - Book name
 * @param {Object} versification - A versification entry
 * @returns {string|null|undefined}
 */
function theodotionValue(book, versification) {
    if (!versification) return undefined
    if ("th" in versification) return versification.th
    const column = theodotionColumn(book, versification)
    return column in versification ? versification[column] : undefined
}

module.exports = { theodotionColumn, theodotionValue }
