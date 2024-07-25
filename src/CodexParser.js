const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex, EzraAbbrv } = require("./regex")
const abbrevations = require("./abbr")
//const toc = require("./toc")
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
        this.EzraAbbrv = EzraAbbrv
        //this.toc = toc
        this.crawler = new crawler()
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
            if (passage.type === "range" && passage.book === result.end.b) {
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
            if (passage.entities[0].translations) {
                passage.version = {
                    name: passage.entities[0].translations[0].translation,
                    alias: passage.entities[0].translations[0].alias,
                    abbreviation: passage.entities[0].translations[0].osis,
                }
            }
            this.passages.push(passage)
        }
        this.found = []
        return this
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
            .trim()
    }
    find(text) {
        const bookNames = this.bookRegex.toString().split("|").slice(8)
        const books = [...this.bible.old, ...this.bible.new, ...bookNames]
        for (let i = 0; i < books.length; i++) {
            const book = books[i].toLowerCase()
            const index = text.toLowerCase().indexOf(book)
            // Checks to see if the previous character is a colon. If it is, skip.
            // This makes sure that if you have a case like Genesis 1:1 John 1:1, the code knows that
            // the book cannot be 1 John.
            if (text[index - 1] && text[index - 1].includes(":") && text[index - 1].match(/[a-zA-Z]/)) continue

            // Get the book and chapter
            if (index > -1) {
                const bookEndIndex = index + book.length - 1
                const passage = {
                    book: text.substring(index, bookEndIndex + 1),
                }
                let chapter = 0
                let chapterStartIndex = null
                let chapterEndIndex = null
                let j = bookEndIndex + 1
                while (j < text.length && !text[j].match(/[a-zA-Z]/)) {
                    const match = text.substring(j).match(/^\s*(\d+)/)
                    if (match) {
                        chapter = parseInt(match[1])
                        chapterStartIndex = j
                        chapterEndIndex = j + match[0].length
                        break
                    }
                    j++
                }

                let verseIndex = chapterEndIndex + 1
                let verseStartIndex = null
                let verseEndIndex = null
                let verse
                while (verseIndex < text.length && !text[verseIndex].match(/[a-zA-Z]/)) {
                    const match = text.substring(verseIndex).match(/^\s*?(\d+)[^a-zA-Z]*/)
                    if (match) {
                        verseStartIndex = verseIndex
                        verseEndIndex = verseIndex + match[0].length
                        break
                    }
                    verseIndex++
                }
                verse = parseInt(text.substring(verseStartIndex, verseEndIndex))

                if (chapter > 0) passage.chapter = chapter
                if (verse > 0) passage.verse = verse

                passage.index = {
                    start: index,
                }
                this.passages.push(passage)
            }
        }
        return this
    }

    regex(text) {
        this.found = text.match(this.scripturesRegex)
        return this
    }

    regexParser() {
        this.passages = []
        for (let i = 0; i < this.found.length; i++) {
            let verse, chapter
            const hasChapterRange = this.found[i].match(/(?<=-\s?)\b\d+[.:].+\b/)
            const book = this.found[i].match(this.bookRegex)
            if (book === null) continue
            chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)

            if (Array.isArray(chapter)) {
                chapter = chapter[0]
            }
            if (
                this.bookify(book).toLowerCase() === "jude" ||
                this.bookify(book).toLowerCase() === "philemon" ||
                this.bookify(book).toLowerCase() === "obadiah" ||
                this.bookify(book).toLowerCase() === "2 john" ||
                this.bookify(book).toLowerCase() === "3 john"
            ) {
                verse = this.found[i].split(" ")[1]
                chapter = "1"
            } else {
                if (this.found[i].match(this.verseRegex) && !hasChapterRange)
                    verse = this.found[i].match(this.verseRegex)[0].replace(/[:.]/, "").trim()
                else if (this.found[i].match(this.verseRegex) && hasChapterRange)
                    verse = this.found[i].match(this.verseRegex)
                        ? this.found[i].match(this.verseRegex)[0].split("-")[0].trim()
                        : ["Empty"]
            }
            if (!verse && this.found[i].match(/\d+/)) {
                chapter = this.found[i].match(/\d+/)[0]
            }

            const passage = {
                original: this.found[i].replace(/([.,])\1*$/, "").trim(),
                book: this.bookify(book),
                chapter: chapter,
                verses: verse ?? [],
            }

            if (hasChapterRange) {
                passage.to = {
                    book: passage.book,
                    chapter: hasChapterRange[0].match(this.chapterRegex)[0],
                    verses: hasChapterRange[0].match(this.verseRegex)[0],
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

        this.found = this.passages.map((passage) => passage.scripture)
        return this
    }
}

if (typeof window !== "undefined" && window) {
    if (!window.CodexParser) window.CodexParser = CodexParser
}

module.exports = CodexParser
