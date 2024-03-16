const bible = {
    old: [
        "Genesis",
        "Exodus",
        "Leviticus",
        "Numbers",
        "Deuteronomy",
        "Joshua",
        "Judges",
        "Ruth",
        "1 Samuel",
        "2 Samuel",
        "1 Kings",
        "2 Kings",
        "1 Chronicles",
        "2 Chronicles",
        "Ezra",
        "Nehemiah",
        "Esther",
        "Job",
        "Psalms",
        "Proverbs",
        "Ecclesiastes",
        "Song of Solomon",
        "Isaiah",
        "Jeremiah",
        "Lamentations",
        "Ezekiel",
        "Daniel",
        "Hosea",
        "Joel",
        "Amos",
        "Obadiah",
        "Jonah",
        "Micah",
        "Nahum",
        "Habakkuk",
        "Zephaniah",
        "Haggai",
        "Zechariah",
        "Malachi",
    ],
    new: [
        "Matthew",
        "Mark",
        "Luke",
        "John",
        "Acts",
        "Romans",
        "1 Corinthians",
        "2 Corinthians",
        "Galatians",
        "Ephesians",
        "Philippians",
        "Colossians",
        "1 Thessalonians",
        "2 Thessalonians",
        "1 Timothy",
        "2 Timothy",
        "Titus",
        "Philemon",
        "Hebrews",
        "James",
        "1 Peter",
        "2 Peter",
        "1 John",
        "2 John",
        "3 John",
        "Jude",
        "Revelation",
    ],
}

const books =
    /(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Psalms|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)/g
const abbrBooks =
    /(?:(Gen|Exo|Lev|Num|Deu|Jos|Jdg|Rut|1 Sa|2 Sa|1 Kgs|2 Kgs|1 Chr|2 Chr|Ezr|Neh|Est|Job|Psa|Pro|Ecc|Son|Isa|Jer|Lam|Eze|Dan|Hos|Joe|Amo|Oba|Jon|Mic|Nah|Hab|Zep|Hag|Zec|Mal|Matt|Mar|Luk|Joh|Act|Rom|1 Cor|2 Cor|Gal|Eph|Phi|Col|1 Thess|2 Thess|1 Ti|2 Ti|Tit|Phm|Heb|Jam|1 Pe|2 Pe|1 Jo|2 Jo|3 Jo|Jud|Rev))/g
const chapter = /(?:\s?\d+:?)/g
const verse = /\b:\s*?(\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?!p|j|k|s|c|t)\b/g
const scripturesRegex = new RegExp(`(${books.source})(${chapter.source})?(${verse.source})`, "gm")
const abbrScripturesRegex = new RegExp(`(${abbrBooks.source})(${chapter.source})?(${verse.source})`, "gm")

const regex = {
    books,
    abbrBooks,
    chapter,
    verse,
    scripturesRegex,
    abbrScripturesRegex,
}

/**
 * Constructor for creating an instance of the class.
 *
 * @constructor
 * @param {object} bible - The bible object.
 * @param {object} regex - The regex object containing book, abbrBooks, chapter, verse, scripturesRegex, and abbrScripturesRegex.
 * @property {array} found - The array to store found passages.
 * @property {array} passages - The array to store passages.
 * @property {object} bible - The bible object.
 * @property {object} bookRegex - The regex for book names.
 * @property {object} bookAbbrRegex - The regex for abbreviated book names.
 * @property {object} chapterRegex - The regex for chapters.
 * @property {object} verseRegex - The regex for verses.
 * @property {object} scripturesRegex - The regex for scriptures.
 * @property {object} abbrScripturesRegex - The regex for abbreviated scriptures.
 */
class CodexParser {
    /**
     * Constructor for creating an instance of the class.
     * @param {Object} bible - The bible object.
     * @param {Object} regex - The regex object containing book, abbrBooks, chapter, verse, scripturesRegex, and abbrScripturesRegex.
     */
    constructor(bible, regex) {
        this.found = [];
        this.passages = [];
        this.bible = bible;
        this.bookRegex = regex.books;
        this.bookAbbrRegex = regex.abbrBooks;
        this.chapterRegex = regex.chapter;
        this.verseRegex = regex.verse;
        this.scripturesRegex = regex.scripturesRegex;
        this.abbrScripturesRegex = regex.abbrScripturesRegex;
    }
    /**
     * Parses the passage using the bookRegex.
     * @param {string} reference - The passage to be parsed
     * @return {Array|null} An array of matches or null if there are no matches
     */
    parse(reference) {
        this.passages = [];
        this.scan(reference);
        for (let i = 0; i < this.found.length; i++) {
            const book = this.found[i].match(this.bookRegex)[0];
            const chapter = this.found[i].replace(book, "").match(this.chapterRegex)[0].replace(":", "").trim();
            const verse = this.found[i].match(this.verseRegex)[0].replace(":", "").trim().split(/,/).filter(Boolean);
            const passage = {
                original: this.found[i],
                book,
                chapter,
                verse,
                testament: this.bible.old.includes(book) ? "old" : "new"
            };
            this.passages.push(passage);
        }
        this.found = [];
        return this.passages;
    }
    /**
     * Scans the input text and stores the matching passages in the 'passages' property.
     * @param {string} text - The input text to scan.
     * @return {Array} The array of matches.
     */
    scan(text) {
        this.found = text.match(this.scripturesRegex) || [];
        return this.found;
    }
    /**
     * Get the passages.
     * @return {Array} The passages.
     */
    getPassages() {
        return this.passages;
    }
}

const parser = new CodexParser(bible, regex);
console.log(parser);


