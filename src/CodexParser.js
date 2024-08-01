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
        let newText = ""

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
        newText = ""
        let chNoInText = 0
        for (let b = 0; b < booksAt.length; b++) {
            while (chNoInText < booksAt[b][1]) {
                //copy across characters to start of book
                newText += text.charAt(chNoInText)
                chNoInText++
            }
            newText += "<span class='passage'>" + booksAt[b][0]
            let passage = booksAt[b][0]
            chNoInText += booksAt[b][0].length //skip the 'fill-in characters
            for (let i = 0; i < 100; i++) {
                chNoInText++
                const nextCh = text.charAt(chNoInText)
                //test whether are at the end of the chapter(s) and verse(s)
                if (nextCh.match(/^[a-z]+$/) && nextCh !== "f" && nextCh !== "ff") break
                if (nextCh.match(/^[A-Z]+$/)) break
                newText += text.charAt(chNoInText - 1)
                passage += text.charAt(chNoInText - 1)
            }
            this.found.push(passage.trim())
            newText += "</span>&nbsp;"
        }
        return this
    }

    enhance() {
        if (this.found.length > 0) {
            for (let i = 0; i < this.found.length; i++) {
                const passage = {
                    original: this.found[i],
                    book: this.bookify(this.found[i].match(this.bookRegex)[0]),
                    chapter: this.found[i].match(this.chapterRegex),
                    verse: this.found[i].match(/(?<=[.:])(\d+.+)/),
                }
                this.passages.push(passage)
            }
        }
        return this.passages
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
