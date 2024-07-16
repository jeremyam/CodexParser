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
                passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
                let next = results[j + 1]
                while (next && next.type === "integer" && next.end.c === result.start.c) {
                    passage.verses.push(next.start.v)
                    if (next.end.v !== next.start.v) passage.verses.push(next.end.v)
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
        return chapter.start.c
    }

    versify(passage) {
        if (passage.start.v !== passage.end.v) {
            if (passage.type === "range") {
                return [`${passage.start.v}-${passage.end.v}`]
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
    find(text) {
        const books = [
            "Gen",
            "Ge",
            "Gn",
            "Exo",
            "Ex",
            "Exod",
            "Lev",
            "Le",
            "Lv",
            "Num",
            "Nu",
            "Nm",
            "Nb",
            "Deut",
            "Dt",
            "Josh",
            "Jos",
            "Jsh",
            "Judg",
            "Jdg",
            "Jg",
            "Jdgs",
            "Rth",
            "Ru",
            "Sam",
            "Samuel",
            "Kings",
            "Kgs",
            "Kin",
            "Chron",
            "Chronicles",
            "Ezra",
            "Ezr",
            "Ez",
            "Neh",
            "Ne",
            "Esth",
            "Es",
            "Job",
            "Job",
            "Jb",
            "Pslm",
            "Ps",
            "Psalms",
            "Psa",
            "Psm",
            "Pss",
            "Prov",
            "Pr",
            "Prv",
            "Eccles",
            "Ec",
            "Song",
            "So",
            "Canticles",
            "Song of Songs",
            "SOS",
            "Isa",
            "Is",
            "Jer",
            "Je",
            "Jr",
            "Lam",
            "La",
            "Ezek",
            "Eze",
            "Ezk",
            "Dan",
            "Da",
            "Dn",
            "Hos",
            "Ho",
            "Joel",
            "Joe",
            "Jl",
            "Amos",
            "Am",
            "Obad",
            "Ob",
            "Jnh",
            "Jon",
            "Micah",
            "Mic",
            "Nah",
            "Na",
            "Hab",
            "Zeph",
            "Zep",
            "Zp",
            "Haggai",
            "Hag",
            "Hg",
            "Zech",
            "Zec",
            "Zc",
            "Mal",
            "Mal",
            "Ml",
            "Matt",
            "Mt",
            "Mrk",
            "Mk",
            "Mr",
            "Luk",
            "Lk",
            "John",
            "Jn",
            "Jhn",
            "Acts",
            "Ac",
            "Rom",
            "Ro",
            "Rm",
            "Co",
            "Cor",
            "Corinthians",
            "Gal",
            "Ga",
            "Ephes",
            "Eph",
            "Phil",
            "Php",
            "Col",
            "Col",
            "Th",
            "Thes",
            "Thess",
            "Thessalonians",
            "Ti",
            "Tim",
            "Timothy",
            "Titus",
            "Tit",
            "Philem",
            "Phm",
            "Hebrews",
            "Heb",
            "He",
            "James",
            "Jas",
            "Jm",
            "Pe",
            "Pet",
            "Pt",
            "Peter",
            "Jn",
            "Jo",
            "Joh",
            "Jhn",
            "John",
            "Jude",
            "Jd",
            "Jud",
            "Jud",
            "Rev",
            "The Revelation",
            "Genesis",
            "Exodus",
            "Leviticus",
            "Numbers",
            "Deuteronomy",
            "Joshua",
            "Judges",
            "Ruth",
            "Samuel",
            "Kings",
            "Chronicles",
            "Ezra",
            "Nehemiah",
            "Esther",
            "Job",
            "Psalms",
            "Psalm",
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
            "Matthew",
            "Mark",
            "Luke",
            "John",
            "Acts",
            "Romans",
            "Corinthians",
            "Galatians",
            "Ephesians",
            "Philippians",
            "Colossians",
            "Thessalonians",
            "Timothy",
            "Titus",
            "Philemon",
            "Hebrews",
            "James",
            "Peter",
            "John",
            "Revelation",
            "Re",
            "Ap",
            "Jd.",
            "Heb.",
        ]

        const preStrings = ["III", "II", "I", "1st", "2nd", "3rd", "First", "Second", "Third", "1", "2", "3"]
        const preStringed = [
            "Sam",
            "Samuel",
            "Kings",
            "Kgs",
            "Kin",
            "Chron",
            "Chronicles",
            "Corinthians",
            "Co",
            "Cor",
            "Thessalonians",
            "Th",
            "Thes",
            "Thess",
            "Timothy",
            "Ti",
            "Tim",
            "Peter",
            "Pe",
            "Pet",
            "Pt",
            "John",
            "Jn",
            "Jhn",
        ]

        //add the prestringed versions e.g. 1 Peter
        for (let b = 0; b < preStringed.length; b++) {
            for (let pre = 0; pre < preStrings.length; pre++) {
                books.push(preStrings[pre] + " " + preStringed[b])
            }
        }
        // add the book name with . at the end as this seems to be added sometimes, at least to the shortened forms
        const length = books.length
        for (let b = 0; b < length; b++) {
            books.push(books[b] + ".")
        }

        // sort descending - longer items first
        books.sort((a, b) => b.length - a.length)
        let booksAt = []
        // go thro' each book finding where it matches in text
        for (let b = 0; b < books.length; b++) {
            const book = books[b]
            let chNoInText = 0
            while (chNoInText < text.length) {
                let j = text.indexOf(book, chNoInText)
                if (j < 0) break
                if (j + book.length < text.length && !text.charAt(j + book.length).match(/^[a-z]+$/)) {
                    booksAt.push([book, j])
                    let replacement = book
                    for (let k = 0; k < book.length; k++) {
                        replacement = replacement.replace(book.charAt(k), "X")
                    }
                    text = text.replace(book, replacement) // to prevent a shorter version matching
                }
                chNoInText = j + book.length + 1
            }
        }
        // into ascending order of start position
        booksAt.sort(function (a, b) {
            return a[1] - b[1]
        })
        let newText = ""
        let chNoInText = 0
        for (let b = 0; b < booksAt.length; b++) {
            while (chNoInText < booksAt[b][1]) {
                //copy across characters to start of book
                newText += text.charAt(chNoInText)
                chNoInText++
            }
            newText += booksAt[b][0]
            chNoInText += booksAt[b][0].length //skip the 'fill-in characters
            for (let i = 0; i < 100; i++) {
                chNoInText++
                const nextCh = text.charAt(chNoInText)
                //test whether are at the end of the chapter(s) and verse(s)
                if (nextCh.match(/^[a-z]+$/)) break
                if (nextCh.match(/^[A-Z]+$/)) break
                newText += text.charAt(chNoInText - 1)
            }
        }
        return newText
    }
}

module.exports = CodexParser
