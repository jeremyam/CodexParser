const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbrevations = require("./abbr")
const toc = require("./toc")
const crawler = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")

const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}

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

    options(options) {
        this.crawler.set_options(options)
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        const regex = /(?:He(?=\s?\d+))/g
        let match
        const matches = []

        while ((match = regex.exec(text)) !== null) {
            const index = match.index
            const book = this.bookify(match[0])
            matches.push({
                abbr: match[0],
                book: book,
                index: index,
            })
        }
        for (let i = matches.length - 1; i >= 0; i--) {
            const match = matches[i]
            text = text.substring(0, match.index) + match.book + text.substring(match.index + match.abbr.length)
        }
        const passages = this.crawler.parse(text).parsed_entities()

        for (let j = 0; j < passages.length; j++) {
            const passage = passages[j]
            for (let i = 0; i < passage.entities.length; i++) {
                const entity = passage.entities[i]
                this.found.push(entity)
            }
        }
    }

    /**
     * Parses the given reference to extract passages.
     *
     * @param {string} reference - The reference to parse.
     * @return {array} An array of parsed passages.
     */
    parse(reference) {
        //TODO: Need to fix chapter ranges when another verse is tacted onto the end of it.
        if (!reference) {
            throw new Error("Parse error (parse(): reference is undefined")
        }
        this.passages = []
        this.scan(reference)
        const books = []
        for (let i = 0; i < this.found.length; i++) {
            books.push(this.found[i].start.b)
        }
        const uniqueBooks = [...new Set(books)]

        const booksWithResults = []
        for (const book of uniqueBooks) {
            const found = this.found.filter((passage) => passage.start.b === book)
            booksWithResults.push(found)
        }

        for (let i = 0; i < booksWithResults.length; i++) {
            const results = booksWithResults[i]
            for (let j = 0; j < results.length; j++) {
                const result = results[j]
                const passage = {
                    book: this.bookify(result.start.b),
                    chapter: result.start.c,
                    verses: this.versify(result),
                    type: result.type,
                }
                let next = results[j + 1]
                while (next && next.type === "integer" && next.end.c === result.start.c) {
                    passage.verses.push(next.start.v)
                    passage.subType = next.type
                    j++
                    next = results[j + 1]
                }
                if (passage.type === "range") {
                    if (result.start.c !== result.end.c) {
                        passage.verses = [result.start.v]
                        passage.to = {
                            book: this.bookify(result.end.b),
                            chapter: result.end.c,
                            verses: result.end.v,
                        }
                    }
                }
                passage.original = result.osis
                passage.scripture = this.scripturize(passage)
                passage.indices = result.indices
                passage.entities = result.entities
                this.passages.push(passage)
            }
        }
        this.passages.sort((a, b) => a.chapter - b.chapter)
        this.found = []
        return this
    }
    chapterify(chapter) {
        if (chapter.type === "range") {
            return `${chapter.start.c} - ${chapter.end}`
        }
    }

    versify(passage) {
        const singleBooks = ["Obadiah", "Philemon", "2 John", "3 John", "Jude"]
        if (passage.start.b && singleBooks.includes(passage.start.b)) {
            return [passage.start.v + "-" + passage.end.v]
        } else {
            if (passage.start.v !== passage.end.v) {
                if (passage.type === "range") {
                    return [`${passage.start.v}-${passage.end.v}`]
                } else {
                    const verses = []
                    for (let i = passage.start.v; i <= passage.end.v; i++) {
                        verses.push(i)
                    }
                    return verses
                }
            } else {
                return [passage.start.v]
            }
        }
    }

    /**
     * Converts a book name to its corresponding full name from the bible.
     *
     * @param {string} book - The abbreviated or partial name of the book.
     * @return {string|undefined} The full name of the book if found, otherwise undefined.
     */
    bookify(book) {
        if (typeof book !== "string") {
            book = book[0]
        }
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
