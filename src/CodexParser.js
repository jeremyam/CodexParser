const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbrevations = require("./abbr")
const toc = require("./toc")
const crawler = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser

class CodexParser {
    constructor() {
        this.found = []
        this.passages = []
        this.bible = bible
        this.bookRegex = bookRegex
        this.chapterRegex = chapterRegex
        this.verseRegex = verseRegex
        this.scripturesRegex = scripturesRegex
        this.abbrevations = abbrevations
        this.toc = toc
        this.crawler = new crawler()
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        const passages = this.crawler.parse(text).parsed_entities()
        this.found.push(...passages.flatMap(passage => passage.entities))
    }

    /**
     * Parses the given reference to extract passages.
     *
     * @param {string} reference - The reference to parse.
     * @return {array} An array of parsed passages.
     */
    parse(reference) {
        if (!reference) {
            throw new Error("Parse error (parse(), line 46): reference is undefined")
        }
        this.passages = []
        this.scan(reference)
        for (let i = 0; i < this.found.length; i++) {
            console.log(this.found[i])
            const passage = {
                book: this.bookify(this.found[i].start.b),
                chapter: this.chapterify(this.found[i]),
                verses: ""
            }
            console.log(passage)
        }
        /* for (let i = 0; i < this.found.length; i++) {
            const hasChapterRange = this.found[i].match(/(?<=-\s?)\b\d+[.:].+\b/)
            const book = this.found[i].match(this.bookRegex)
            if (book === null) continue
            let verse,
                chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)
            if (this.found[i].match(this.verseRegex))
                verse = this.found[i].match(this.verseRegex)[0].replace(/[:.]/, "").trim()
            else {
                if (this.bookify(book).toLowerCase() === "jude" || this.bookify(book).toLowerCase() === "philemon") {
                    verse = chapter
                    chapter = "1"
                } else {
                    verse = []
                }
            }
            const passage = {
                original: this.found[i].replace(/([.,])\1*$/, "").trim(),
                book: this.bookify(book),
                chapter: this.chapterify(chapter),
                verses: verse,
            }

            if (hasChapterRange) {
                passage.to = {
                    book: passage.book,
                    chapter: this.chapterify(hasChapterRange[0].match(this.chapterRegex)),
                    verses: hasChapterRange[0].match(this.verseRegex)[0].replace(/[:.]/, "").trim(),
                }
                passage.to.verses = passage.to.verses.split(/,/).filter(Boolean)
                passage.to.testament = this.bible.old.includes(passage.to.book) ? "old" : "new"
            }
            passage.verses =
                typeof passage.verses !== "object"
                    ? passage.verses.split(/,/).filter(Boolean)
                    : passage.verses.filter((item) => item.trim())
            passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
            passage.scripture = this.scripturize(passage)
            this.passages.push(passage)
        }

        this.found = []
        return this.passages */
    }
    chapterify(chapter) {
        if(chapter.type === "range") {
            return `${chapter.start.c} - ${chapter.end}`
        }
    }

    /**
     * Converts a book name to its corresponding full name from the bible.
     *
     * @param {string} book - The abbreviated or partial name of the book.
     * @return {string|undefined} The full name of the book if found, otherwise undefined.
     */
    bookify(book) {
        let bookified
        bookified = this.abbrevations[book]
        if (!bookified) {
            bookified = this.bible.new.find(
                (b) =>
                    b.charAt(0).toLowerCase() === book.charAt(0).toLowerCase() &&
                    b.toLowerCase().includes(book.toLowerCase())
            )
            if (!bookified) {
                bookified = this.bible.old.find(
                    (b) =>
                        b.charAt(0).toLowerCase() === book.charAt(0).toLowerCase() &&
                        b.toLowerCase().includes(book.toLowerCase())
                )
            }
        }
        return bookified
    }

    /**
     * Returns the passages stored in the object.
     *
     * @return {array} The passages stored in the object.
     */
    getPassages() {
        return this.passages
    }

    /**
     * @param {object} passage - A passage object
     */
    scripturize(passage) {
        const { book, chapter, verses, to } = passage
        const colon = verses.length !== 0 ? ":" : ""
        const parts = [book, chapter, colon, verses]
        if (to) {
            parts.push("-", to.chapter, ":", to.verses)
        }
        return parts
            .join(" ")
            .replace(/\s+:\s+/g, ":")
            .trim()
    }
}

module.exports = CodexParser
