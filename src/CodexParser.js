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
        this.crawler = new crawler({
            sequence_combination_strategy: "separate",
        })
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        const abbrs = text.match(/(?:He)(?=.\d+)/gm)
        if (abbrs) {
            const matches = abbrs.map((string) => {
                return {
                    abbr: string,
                    book: this.bookify(string),
                }
            })
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i]
                text = text.replace(match.abbr, match.book)
            }
        }
        const passages = this.crawler.parse(text).parsed_entities()
        this.found.push(...passages.flatMap((passage) => passage.entities))
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
        //console.log(booksWithResults)
        for (let i = 0; i < booksWithResults.length; i++) {
            const initialPassage = booksWithResults[i].shift()
            const firstPassage = {
                original: initialPassage.osis,
                book: this.bookify(initialPassage.start.b),
                chapter: initialPassage.start.c,
                type: initialPassage.type,
                entities: initialPassage.entities,
            }
            if (initialPassage.type === "range") {
                if (initialPassage.start.c !== initialPassage.end.c) {
                    firstPassage.verses = [initialPassage.start.v]
                    firstPassage.to = {
                        book: this.bookify(initialPassage.end.b),
                        chapter: initialPassage.end.c,
                        verses: [initialPassage.start.v],
                    }
                } else {
                    firstPassage.verses = [initialPassage.start.v + "-" + initialPassage.end.v]
                }
            } else {
                firstPassage.verses =
                    initialPassage.start.v !== initialPassage.end.v
                        ? [initialPassage.start.v, initialPassage.end.v]
                        : [initialPassage.start.v]
            }
            for (let j = 0; j < booksWithResults[i].length; j++) {
                const passage = booksWithResults[i][j]
                if (passage.type === "integer") {
                    if (firstPassage.type === "range") {
                        if (passage.start.c !== passage.end.c) {
                            firstPassage.to.verses.push(passage.start.v)
                        } else {
                            firstPassage.verses.push(passage.start.v)
                        }
                        firstPassage.original += ", " + passage.start.v
                    } else {
                        if (passage.start.v !== passage.end.v) {
                            firstPassage.verses.push(passage.start.v)
                            firstPassage.verses.push(passage.end.v)
                            firstPassage.original += ", " + passage.start.v + ", " + passage.end.v
                        } else {
                            firstPassage.verses.push(passage.start.v)
                            firstPassage.original += ", " + passage.start.v
                        }
                    }
                } else if (passage.type === "range") {
                    if (firstPassage.chapter === passage.start.c) {
                        firstPassage.verses.push(passage.start.v + "-" + passage.end.v)
                    }
                } else {
                    const subPassage = {
                        original: passage.osis,
                        book: this.bookify(passage.start.b),
                        chapter: passage.start.c,
                        type: passage.type,
                        entities: passage.entities,
                    }
                    if (passage.type === "range") {
                        if (passage.start.c !== passage.end.c) {
                            subPassage.to = {
                                book: this.bookify(passage.end.b),
                                chapter: passage.end.c,
                                verses: [passage.end.v],
                            }
                        } else {
                            subPassage.verses =
                                passage.start.v !== passage.end.v ? [passage.start.v, passage.end.v] : [passage.start.v]
                        }
                    } else {
                        subPassage.verses =
                            passage.start.v !== passage.end.v ? [passage.start.v, passage.end.v] : [passage.start.v]
                    }
                    subPassage.testament = this.bible.old.includes(subPassage.book) ? "old" : "new"
                    this.passages.push(subPassage)
                }
            }
            firstPassage.testament = this.bible.old.includes(firstPassage.book) ? "old" : "new"
            this.passages.push(firstPassage)
            //console.log(this.passages)
        }
        this.found = []
        return this
        //console.log(booksWithResults)
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
        if (chapter.type === "range") {
            return `${chapter.start.c} - ${chapter.end}`
        }
    }

    versify(passage, type) {
        if (type !== "range")
            return passage.start.v !== passage.end.v ? [passage.start.v, passage.end.v] : [passage.start.v]
        else return [passage.start.v + "-" + passage.end.v]
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
        console.log(passage)
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
