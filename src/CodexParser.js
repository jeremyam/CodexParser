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
        const judeRegex = /(?:[j|J][d|ude]+.?\s?\d+)/gim
        const jude = text.match(judeRegex)
        this.found = text.match(this.scripturesRegex)
        if (!this.found) {
            this.found = []
        }
        if (jude) {
            this.found.push(...jude)
        }
        console.log(this.found)
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
        for (let i = 0; i < this.found.length; i++) {
            const hasChapterRange = this.found[i].match(/(?<=-\s?)\b\d+[.:].+\b/)
            const book = this.found[i].match(this.bookRegex)
            let verse,
                chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)
            if (this.found[i].match(this.verseRegex))
                verse = this.found[i].match(this.verseRegex)[0].replace(/[:.]/, "").trim()
            else {
                verse = chapter
                chapter = "1"
            }
            const passage = {
                original: this.found[i],
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
        return this.passages
    }
    chapterify(chapter) {
        return chapter[0].replace(/[:\.]/, "").trim()
    }

    /**
     * Converts a book name to its corresponding full name from the bible.
     *
     * @param {string} book - The abbreviated or partial name of the book.
     * @return {string|undefined} The full name of the book if found, otherwise undefined.
     */
    bookify(book) {
        let bookified
        book = book[0].charAt(0).toUpperCase() + book[0].slice(1)
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
        const parts = [book, chapter, ":", verses]
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
