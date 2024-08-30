const versified = require("./versified")
const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex, EzraAbbrv } = require("./regex")
const abbrevations = require("./abbr")
const crawler = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser
const util = require("util")
const dump = require("./functions").dump

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
        this.EzraAbbrv = EzraAbbrv
        //this.toc = toc
        this.crawler = new crawler()
        this.versificationDifferences = versified
    }

    /**
     * Sets the options for the crawler and returns the current instance.
     *
     * @param {Object} options - The options to set.
     * @return {Object} The current instance.
     */
    options(options) {
        this.crawler.set_options(options)
        return this
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        text = text.replace(/Rev(?=\s|\.)/gim, "Revelation")
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
        const bookShouldBeEra = text.match(this.EzraAbbrv)

        if (bookShouldBeEra) {
            text = text.replace(this.EzraAbbrv, "Ezra")
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
            this.passages = []
            return this
        }
        this.passages = []
        this.scan(reference)
        const books = []
        for (let i = 0; i < this.found.length; i++) {
            const result = this.found[i]
            if (result.type === "range" && result.start.b !== result.end.b) {
                const newPassageFound = result.end.b + " " + result.end.c + ":" + result.end.v
                const newPassageToAdd = this.crawler.parse(newPassageFound).parsed_entities()[0].entities
                this.found.splice(i + 1, 0, ...newPassageToAdd)
                result.end.b = result.start.b
                result.end.c = result.start.c
                result.end.v = result.start.v
            }

            const passage = {
                book: this.bookify(result.start.b),
                chapter: result.start.c,
                verses: this.versify(result),
                type: result.type,
            }
            passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
            let next = this.found[i + 1]
            if (next && next.type === "integer" && next.start.b === result.end.b && next.end.c === result.start.c) {
                while (
                    next &&
                    next.type === "integer" &&
                    next.start.b === result.end.b &&
                    next.end.c === result.start.c
                ) {
                    if (next.start.v > result.start.v) {
                        passage.verses.push(next.start.v)
                        if (next.end.v !== next.start.v) passage.verses.push(next.end.v)
                        passage.subType = next.type
                    }
                    i++
                    next = this.found[i + 1]
                }
            }

            if (passage.type === "range" && result.start.b === result.end.b) {
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
            passage.passages = this.populate(result.entities[0], passage.verses)
            passage.indices = result.indices
            passage.entities = result.entities[0]
            if (passage.entities.translations) {
                passage.version = {
                    name: passage.entities.translations[0].translation,
                    alias: passage.entities.translations[0].alias,
                    abbreviation: passage.entities.translations[0].osis,
                }
            }
            this.passages.push(passage)
        }
        this.found = []
        this.versification()
        return this
    }

    versification() {
        for (let i = 0; i < this.passages.length; i++) {
            const passage = this.passages[i]
            const hasVersification = this.versificationDifferences[passage.book]
            if (hasVersification) {
                for (let j = 0; j < hasVersification.length; j++) {
                    const versification = hasVersification[j]
                    if (passage.verses.some((item) => versification.verses.includes(item)) && versification.chapter === passage.chapter) {
                        passage.versification = {
                            mt: versification.mt,
                            lxx: versification.lxx,
                        }
                    }
                }
            }
        }
        dump(this.passages)
    }

    populate(entities, verses) {
        let passages = []
        for (let i = entities.start.v; i <= entities.end.v; i++) {
            passages.push({
                book: entities.start.b,
                chapter: entities.start.c,
                verse: i,
            })
        }

        if (verses.length > 1) {
            for (let i = 0; i < verses.length; i++) {
                const passage = {
                    book: entities.start.b,
                    chapter: entities.start.c,
                    verse: verses[i],
                }
                if (
                    !passages.find(
                        (p) => p.book === passage.book && p.chapter === passage.chapter && p.verse === passage.verse
                    )
                ) {
                    passages.push(passage)
                }
            }
        }

        return [...new Set(passages)]
    }

    chapterify(chapter) {
        return chapter.start.c
    }

    versify(passage) {
        if (passage.start.v !== passage.end.v) {
            if (passage.type === "range" || passage.type === "ff") {
                if (passage.start.b === passage.end.b) {
                    return [`${passage.start.v}-${passage.end.v}`]
                } else {
                    return [passage.start.v]
                }
            } else {
                if (passage.type !== "bc") {
                    const verses = []
                    for (let i = passage.start.v; i <= passage.end.v; i++) {
                        verses.push(i)
                    }
                    return verses
                } else {
                    return [passage.start.v + "-" + passage.end.v]
                }
            }
        } else {
            return [passage.start.v]
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
        let bookified = Object.keys(this.abbrevations).find((abbr) => {
            return abbr.toLowerCase() === book.toLowerCase()
        })
        bookified = this.abbrevations[bookified]
        if (!bookified) {
            bookified = this.bible.new.find(
                (b) => b.toLowerCase() === book.toLowerCase() && b.toLowerCase().includes(book.toLowerCase())
            )
            if (!bookified) {
                bookified = this.bible.old.find(
                    (b) => b.toLowerCase() === book.toLowerCase() && b.toLowerCase().includes(book.toLowerCase())
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
            .replace(/\s[-–—]\s/, "-")
            .trim()
    }
}

if (typeof window !== "undefined" && window) {
    if (!window.CodexParser) window.CodexParser = CodexParser
}

module.exports = CodexParser
