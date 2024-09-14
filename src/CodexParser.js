const versified = require("./versified")
const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex, EzraAbbrv } = require("./regex")
const abbrevations = require("./abbr")
const util = require("util")
const dump = require("./functions").dump
const dd = require("./functions").dd
const chapter_verses = require("./chapterVerseCombine")

class CodexParser {
    constructor() {
        this.found = []
        this.passages = []
        this.bible = bible
        this.bookRegex = bookRegex
        this.chapterRegex = chapterRegex
        this.verseRegex = verseRegex
        this.scripturesRegex = scripturesRegex
        this.abbreviations = abbrevations
        this.EzraAbbrv = EzraAbbrv
        this.versificationDifferences = versified
        this.singleChapterBook = [
            { Jude: Array.from({ length: 25 }, (_, i) => i + 1) }, // Jude has 25 verses
            { "2 John": Array.from({ length: 13 }, (_, i) => i + 1) }, // 2 John has 13 verses
            { "3 John": Array.from({ length: 15 }, (_, i) => i + 1) }, // 3 John has 15 verses
            { Obadiah: Array.from({ length: 21 }, (_, i) => i + 1) }, // Obadiah has 21 verses
            { Philemon: Array.from({ length: 25 }, (_, i) => i + 1) }, // Philemon has 25 verses
        ]
        this.chapterVerses = chapter_verses
    }

    /**
     * Scans the given text for Bible references, and stores all found references in the `found` property of the instance.
     * @param {string} text The text to scan for Bible references.
     * @return {CodexParser} This instance, for method chaining.
     */
    scan(text) {
        text = text.replace(this.EzraAbbrv, "Ezr")
        const fullNames = [...this.bible.old, ...this.bible.new] // Full Bible book names
        const abbreviations = Object.keys(this.abbreviations) // Abbreviations for Bible books

        this.found = []

        // Convert the Bible book names and text to lowercase for case-insensitive matching
        const lowercaseBibleFullNames = fullNames.map((book) => book.toLowerCase())
        const lowercaseBibleAbbreviations = abbreviations.map((abbr) => abbr.toLowerCase())
        const lowerCaseText = text.toLowerCase()

        let i = 0

        // Function to determine if a character is a valid part of a chapter or verse reference (non-word characters)
        const isValidChapterVerseChar = (char) => {
            return /[^A-Za-z]/.test(char) // Allow any non-word characters
        }

        // Function to check if a character at a given index is non-alphabetic or at the boundary of the text
        const isBoundaryOrNonAlphabetic = (index, text) => {
            return index < 0 || index >= text.length || /[^a-z]/i.test(text[index])
        }

        // Function to check if the next part of the text starts with a new Bible book (e.g., "2 Corinthians")
        const isNextBibleBook = (startIndex) => {
            const textAfterCurrentPosition = lowerCaseText.substring(startIndex).trim()

            // Check if the next part of the text matches any full Bible book name
            for (let j = 0; j < lowercaseBibleFullNames.length; j++) {
                if (textAfterCurrentPosition.startsWith(lowercaseBibleFullNames[j])) {
                    return true // Found another Bible book
                }
            }

            for (let j = 0; j < lowercaseBibleAbbreviations.length; j++) {
                if (textAfterCurrentPosition.startsWith(lowercaseBibleAbbreviations[j])) {
                    return true // Found another Bible book abbreviation
                }
            }

            return false
        }

        // Loop through the text and check for full names and abbreviations
        while (i < lowerCaseText.length) {
            let foundBook = null
            let foundIndex = -1
            let matchedLength = 0

            // Check full names first, to prioritize longer matches
            for (let j = 0; j < lowercaseBibleFullNames.length; j++) {
                const book = lowercaseBibleFullNames[j]

                // Check if the text starting at position `i` matches the Bible book
                if (lowerCaseText.startsWith(book, i)) {
                    if (book.length > matchedLength) {
                        foundBook = fullNames[j] // Store the original full name
                        foundIndex = i // Record the index where the book is found
                        matchedLength = book.length // Update the length of the match
                    }
                }
            }

            // If no full book name was found, check for abbreviations
            if (!foundBook) {
                for (let k = 0; k < lowercaseBibleAbbreviations.length; k++) {
                    const abbreviation = lowercaseBibleAbbreviations[k]
                    const abbreviationWithDot = abbreviation + "."

                    // Ensure abbreviation is not part of a larger word (check boundaries)
                    if (lowerCaseText.startsWith(abbreviationWithDot, i)) {
                        if (
                            isBoundaryOrNonAlphabetic(i - 1, lowerCaseText) &&
                            isBoundaryOrNonAlphabetic(i + abbreviationWithDot.length, lowerCaseText)
                        ) {
                            foundBook = abbreviations[k] // Store the abbreviation without the dot
                            foundIndex = i // Record the index where the abbreviation is found
                            matchedLength = abbreviationWithDot.length // Update the length of the match to include the dot
                            break // Exit once found
                        }
                    } else if (lowerCaseText.startsWith(abbreviation, i)) {
                        if (
                            isBoundaryOrNonAlphabetic(i - 1, lowerCaseText) &&
                            isBoundaryOrNonAlphabetic(i + abbreviation.length, lowerCaseText)
                        ) {
                            if (abbreviation.length > matchedLength) {
                                foundBook = abbreviations[k] // Store the abbreviation without the dot
                                foundIndex = i // Record the index where the abbreviation is found
                                matchedLength = abbreviation.length // Update the length of the match
                            }
                        }
                    }
                }
            }

            // If a book or abbreviation was found, look for chapter and verse patterns after the book
            if (foundBook !== null) {
                i += matchedLength // Skip ahead by the length of the found book
                let chapterVerse = ""

                while (i < text.length && isValidChapterVerseChar(text[i])) {
                    // Look ahead to see if the next characters form a new Bible book
                    if (isNextBibleBook(i)) {
                        // Stop adding to chapterVerse if a new Bible book is found
                        break
                    }

                    chapterVerse += text[i]
                    i++
                }

                // Trim any period from the end of the reference
                chapterVerse = chapterVerse.trim().replace(/[.,:;!?]+$/, "")

                // Replace any periods within the reference with colons for easier parsing
                const formattedReference = chapterVerse.replace(/\./g, ":")

                if (formattedReference.length > 0) {
                    this.found.push({
                        book: foundBook,
                        reference: formattedReference, // Store the formatted reference
                        index: foundIndex,
                    })
                } else {
                    this.found.push({
                        book: foundBook,
                        reference: null,
                        index: foundIndex,
                    })
                }
            } else {
                i++
            }
        }

        return this // Return this instance for method chaining
    }

    parse(reference) {
        this.scan(reference) // Call scan to populate this.found
        this.passages = this.found.map((passage) => {
            const book = this.bookify(passage.book)
            console.log(book)

            const parsedPassage = {
                book: book,
                chapter: Number,
                verse: Array,
                to: Object,
                type: String,
                testament: this.bible.old.find((bible) => bible === book) ? "old" : "new",
            }

            return parsedPassage
        })
        console.log(this.chapterVerses)
        return this // Return this instance
    }

    versification() {
        for (let i = 0; i < this.passages.length; i++) {
            const passage = this.passages[i]
            const hasVersification = this.versificationDifferences[passage.book]
            for (let j = 0; j < passage.passages.length; j++) {
                const subPassage = passage.passages[j]
                if (hasVersification) {
                    if (this.versificationDifferences[passage.book][subPassage.chapter + ":" + subPassage.verse])
                        subPassage.versification =
                            this.versificationDifferences[passage.book][subPassage.chapter + ":" + subPassage.verse]
                }
            }
        }
    }

    /**
     * Populate a Set of passages from entities.start.v to entities.end.v,
     * and then add any additional verses from the verses array.
     *
     * @param {Object} entities - Entities object from the bible-passage-reference-parser
     * @param {Array} verses - Array of verse numbers to add to the set of passages
     * @return {Array} Array of passage objects
     */
    populate(entities, verses) {}

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
        let bookified = Object.keys(this.abbreviations).find((abbr) => {
            return abbr.toLowerCase() === book.toLowerCase()
        })
        bookified = this.abbreviations[bookified]
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
     * Converts a passage object into a scripturize object with human-readable name, chapter and verses and a hash.
     *
     * @param {object} passage - The passage object to scripturize.
     * @return {object} The object with the human-readable name, chapter and verses and a hash.
     */
    scripturize(passage) {
        const { book, chapter, verses, to } = passage
        const colon = verses.length !== 0 ? ":" : ""
        const parts = [book, chapter, colon, verses]
        if (to) {
            parts.push("-", to.chapter, ":", to.verses)
        }
        const full = parts
            .join(" ")
            .replace(/\s+:\s+/g, ":")
            .replace(/\s[-–—]\s/, "-")
            .trim()
        const hash = full.toLowerCase().replace(/ /g, "_").replace(/:/g, ".").replace(/-/g, ".").replace(/,/g, ".")
        return {
            passage: full,
            cv: chapter + colon + verses,
            hash,
        }
    }
}

module.exports = CodexParser
