const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbrevations = require("./abbr")
const toc = require("./toc")

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
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        this.found = text.match(this.scripturesRegex)
        return this.found
    }

    /**
     * Parses the given reference to extract passages.
     *
     * @param {string} reference - The reference to parse.
     * @return {array} An array of parsed passages.
     */
    parse(reference) {
        if (!reference) {
            return null // return null if no reference is provided
        }
        this.passages = []
        this.scan(reference)
        console.log(this.found)
        for (let i = 0; i < this.found.length; i++) {
            const book = this.found[i].match(this.bookRegex)
            const chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)
            const passage = {
                original: this.found[i],
                book: this.bookify(book[0].charAt(0).toUpperCase() + book[0].slice(1)),
                chapter: chapter[0].replace(/[:.]/, "").trim(),
                verses: this.found[i].match(this.verseRegex)[0].replace(/[:.]/, "").trim(),
            }
            passage.verses = passage.verses.split(/,/).filter(Boolean)
            passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
            this.passages.push(passage)
        }
        this.found = []
        return this.passages
    }
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
}

module.exports = CodexParser
