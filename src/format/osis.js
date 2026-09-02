/**
 * osis.js
 * OSIS reference formatter and book code mapping (text + numeric)
 */

const bible = require("../data/bible")

const OSIS_BOOKS = {
    // Old Testament
    Genesis: "Gen",
    Exodus: "Exod",
    Leviticus: "Lev",
    Numbers: "Num",
    Deuteronomy: "Deut",
    Joshua: "Josh",
    Judges: "Judg",
    Ruth: "Ruth",
    "1 Samuel": "1Sam",
    "2 Samuel": "2Sam",
    "1 Kings": "1Kgs",
    "2 Kings": "2Kgs",
    "1 Chronicles": "1Chr",
    "2 Chronicles": "2Chr",
    Ezra: "Ezra",
    Nehemiah: "Neh",
    Esther: "Esth",
    Job: "Job",
    Psalms: "Ps",
    Psalm: "Ps",
    Proverbs: "Prov",
    Ecclesiastes: "Eccl",
    "Song of Solomon": "Song",
    "Song of Songs": "Song",
    Isaiah: "Isa",
    Jeremiah: "Jer",
    Lamentations: "Lam",
    Ezekiel: "Ezek",
    Daniel: "Dan",
    Hosea: "Hos",
    Joel: "Joel",
    Amos: "Amos",
    Obadiah: "Obad",
    Jonah: "Jonah",
    Micah: "Mic",
    Nahum: "Nah",
    Habakkuk: "Hab",
    Zephaniah: "Zeph",
    Haggai: "Hag",
    Zechariah: "Zech",
    Malachi: "Mal",

    // New Testament
    Matthew: "Matt",
    Mark: "Mark",
    Luke: "Luke",
    John: "John",
    Acts: "Acts",
    Romans: "Rom",
    "1 Corinthians": "1Cor",
    "2 Corinthians": "2Cor",
    Galatians: "Gal",
    Ephesians: "Eph",
    Philippians: "Phil",
    Colossians: "Col",
    "1 Thessalonians": "1Thess",
    "2 Thessalonians": "2Thess",
    "1 Timothy": "1Tim",
    "2 Timothy": "2Tim",
    Titus: "Titus",
    Philemon: "Phlm",
    Hebrews: "Heb",
    James: "Jas",
    "1 Peter": "1Pet",
    "2 Peter": "2Pet",
    "1 John": "1John",
    "2 John": "2John",
    "3 John": "3John",
    Jude: "Jude",
    Revelation: "Rev",

    // Deuterocanonical books
    Tobit: "Tob",
    Judith: "Jdt",
    "Wisdom of Solomon": "Wis",
    Sirach: "Sir",
    Baruch: "Bar",
    "Epistle of Jeremiah": "EpJer",
    "1 Esdras": "1Esd",
    "1 Maccabees": "1Macc",
    "2 Maccabees": "2Macc",
    "3 Maccabees": "3Macc",
    "4 Maccabees": "4Macc",
    "Prayer of Manasseh": "PrMan",
}

function getOsisBook(book) {
    return OSIS_BOOKS[book] || book.replace(/\s+/g, "")
}

// Build canonical OSIS order (unique, Old + New) using bible.js and OSIS names
const CANONICAL_OSIS_ORDER = (() => {
    const order = []
    const seen = new Set()
    const pushIfNew = (name) => {
        const osis = getOsisBook(name)
        if (!seen.has(osis)) {
            seen.add(osis)
            order.push(osis)
        }
    }
    // Deuterocanonical books come AFTER the New Testament so the protestant
    // canon keeps its stable 1-66 numbering (John stays 43, etc.).
    ;[...bible.old, ...bible.new, ...(bible.deuterocanonical || [])].forEach((name) => pushIfNew(name))
    return order
})()

function getCanonicalBookNumber(book) {
    const osis = getOsisBook(book)
    const idx = CANONICAL_OSIS_ORDER.indexOf(osis)
    return idx >= 0 ? idx + 1 : null
}

/**
 * Converts a book/chapter/verse into the pythonbible-style integer verse id
 * Scheme: bookNumber * 1_000_000 + chapter * 1_000 + verse
 * Example: John 3:16 (book 43) => 43_003_016 => 43003016
 */
function toVerseId(book, chapter, verse) {
    const bnum = getCanonicalBookNumber(book)
    const ch = Number(chapter)
    const vs = Number(verse)
    if (bnum == null || Number.isNaN(ch) || Number.isNaN(vs)) return null
    return bnum * 1_000_000 + ch * 1_000 + vs
}

/**
 * Formats a passage object into an OSIS reference string
 * - Single verse: Book.Ch.V
 * - Verse range: Book.Ch.V1-Book.Ch.Vn
 * - Multi-chapter range: Book.Ch1.V1-Book.Ch2.Vn
 * - Multiple verses: Book.Ch.V1,Book.Ch.V2
 * - Sequences across chapters: Book.Ch1.V1;Book.Ch2.V2
 * @param {Object} passage
 * @returns {string}
 */
function formatOsis(passage) {
    const book = getOsisBook(passage.book)
    const chapter = Number(passage.chapter)
    const verses = passage.verses || []

    const isRange = passage.to && (passage.type === "multi_chapter_verse_range" || passage.type === "chapter_range")
    if (isRange) {
        const startVerse =
            verses[0] && String(verses[0]).includes("-")
                ? Number(String(verses[0]).split("-")[0])
                : Number.isFinite(Number(verses[0]))
                ? Number(verses[0])
                : 1
        const endChapter = Number(passage.to.chapter)
        const endEntries = passage.to.verses || []
        const endLast = endEntries.length ? endEntries[endEntries.length - 1] : "1"
        const endVerse = String(endLast).includes("-")
            ? Number(String(endLast).split("-")[1])
            : Number.isFinite(Number(endLast))
            ? Number(endLast)
            : 1
        return `${book}.${chapter}.${startVerse}-${book}.${endChapter}.${endVerse}`
    }

    // No explicit range: build from verse list at same chapter
    const parts = []
    for (const v of verses) {
        if (String(v).includes("-")) {
            const [s, e] = String(v).split("-").map(Number)
            parts.push(`${book}.${chapter}.${s}-${book}.${chapter}.${e}`)
        } else {
            const num = Number(v)
            if (!isNaN(num) && num >= 0) {
                parts.push(`${book}.${chapter}.${num}`)
            }
        }
    }
    return parts.join(",")
}

/**
 * Formats a passage object into an OSIS numeric reference string
 * - Single verse: B.Ch.V (B = canonical book number 1..66)
 * - Verse range (same chapter): B.Ch.V1-B.Ch.Vn
 * - Multi-chapter range: B.Ch1.V1-B.Ch2.Vn
 * - Multiple verses: B.Ch.V1,B.Ch.V2
 * - Sequences across chapters: B.Ch1.V1;B.Ch2.V2
 * @param {Object} passage
 * @returns {string}
 */
function formatOsisNumeric(passage) {
    const chapter = Number(passage.chapter)
    const verses = passage.verses || []

    if (Number.isNaN(chapter)) return ""

    const isRange = passage.to && (passage.type === "multi_chapter_verse_range" || passage.type === "chapter_range")
    if (isRange) {
        const startVerse =
            verses[0] && String(verses[0]).includes("-")
                ? Number(String(verses[0]).split("-")[0])
                : Number.isFinite(Number(verses[0]))
                ? Number(verses[0])
                : 1
        const endChapter = Number(passage.to.chapter)
        const endEntries = passage.to.verses || []
        const endLast = endEntries.length ? endEntries[endEntries.length - 1] : "1"
        const endVerse = String(endLast).includes("-")
            ? Number(String(endLast).split("-")[1])
            : Number.isFinite(Number(endLast))
            ? Number(endLast)
            : 1
        const startId = toVerseId(passage.book, chapter, startVerse)
        const endId = toVerseId(passage.book, endChapter, endVerse)
        return startId != null && endId != null ? `${startId}-${endId}` : ""
    }

    const parts = []
    for (const v of verses) {
        if (String(v).includes("-")) {
            const [s, e] = String(v).split("-").map(Number)
            const startId = toVerseId(passage.book, chapter, s)
            const endId = toVerseId(passage.book, chapter, e)
            if (startId != null && endId != null) {
                parts.push(`${startId}-${endId}`)
            }
        } else {
            const num = Number(v)
            const id = toVerseId(passage.book, chapter, num)
            if (id != null) parts.push(String(id))
        }
    }
    return parts.join(",")
}
module.exports = { formatOsis, getOsisBook, formatOsisNumeric, getCanonicalBookNumber, toVerseId }
