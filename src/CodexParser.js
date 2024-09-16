const versified = require("./versified")
const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbrevations = require("./abbr")
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
        this.versificationDifferences = versified
        this.singleChapterBook = [
            {
                Jude: {
                    1: Array.from({ length: 25 }, (_, i) => i + 1),
                }, // Jude has 25 verses
            },
            {
                "2 John": {
                    1: Array.from({ length: 13 }, (_, i) => i + 1),
                }, // 2 John has 13 verses
            },
            {
                "3 John": {
                    1: Array.from({ length: 15 }, (_, i) => i + 1),
                }, // 3 John has 15 verses
            },
            {
                Obadiah: {
                    1: Array.from({ length: 21 }, (_, i) => i + 1),
                }, // Obadiah has 21 verses
            },
            {
                Philemon: {
                    1: Array.from({ length: 25 }, (_, i) => i + 1),
                }, // Philemon has 25 verses
            },
        ]
        this.chapterVerses = chapter_verses
        this.error = false
    }

    /**
     * Scans the given text for Bible references, and stores all found references in the `found` property of the instance.
     * @param {string} text The text to scan for Bible references.
     * @return {CodexParser} This instance, for method chaining.
     */
    scan(text) {
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

            // Initialize the parsed passage object
            const parsedPassage = {
                original: passage.book + " " + passage.reference,
                hashed: book.toLowerCase().replace(/\s+/, "_") + "." + passage.reference.replace(/[:\.]/g, "."), // Handle both : and .
                book: book,
                chapter: null,
                verses: [], // Verse stored as an array
                type: null, // Set type based on reference
                testament: this.bible.old.find((bible) => bible === book) ? "old" : "new",
                index: passage.index,
            }

            // Split reference by commas to handle multiple ranges or verses (e.g., "Ge 27:27-29,39-41")
            let parts = passage.reference.split(",")

            // Check for single chapter books
            const singleChapterBook = this.singleChapterBook.find((bible) => bible[book])

            parts.forEach((part) => {
                part = part.trim() // Clean up spaces
                // Detect whether it uses ":" or "." for chapter:verse separation
                const separator = part.includes(":") ? ":" : "."

                if (part.includes("-")) {
                    // Handle ranges (e.g., "27:27-29" or "39-41")

                    let [start, end] = part.split("-")
                    // Handle the starting part
                    let [startChapter, startVerse] = start.includes(separator)
                        ? start.split(separator)
                        : [parsedPassage.chapter, start] // Default to same chapter if no chapter is provided

                    parsedPassage.chapter = Number(startChapter) // Set the chapter
                    // Checks to see if we are in a multi chapter verse range, if so, include only relevant verses from the this.chapterVerse to
                    // the end of the chapter.
                    if (start.includes(separator) && end.includes(separator)) {
                        parsedPassage.verses = this.chapterVerses[book][startChapter].slice(
                            this.chapterVerses[book][startChapter].indexOf(Number(startVerse))
                        )
                    } else {
                        parsedPassage.verses.push(startVerse.trim())
                    }

                    // Handle same-chapter ranges (e.g., "27:27-29") and multi-chapter ranges (e.g., "Ex 2:1-3:4")
                    //TODO:  Need to check for a multi chapter verse range and if fill out the verses before the verse of
                    // The second chapter.
                    if (end.includes(separator)) {
                        let [endChapter, endVerse] = end.split(separator)
                        if (Number(endChapter) !== Number(startChapter)) {
                            // Cross-chapter range, set 'to' property
                            parsedPassage.to = {
                                book: book,
                                chapter: Number(endChapter), // End chapter
                            }
                            if (endVerse > 1) {
                                parsedPassage.to.verses = this.chapterVerses[book][Number(endChapter)].slice(
                                    0,
                                    this.chapterVerses[book][Number(endChapter)].indexOf(Number(endVerse)) + 1
                                )
                            }
                            parsedPassage.type = "chapter_verse_range" // Set type to chapter range
                        } else {
                            // Same-chapter range, just add to the verse array
                            parsedPassage.verses.push(`${startVerse}-${endVerse}`)
                        }
                    } else {
                        // Single-chapter range (e.g., "27:27-29" or "39-41")
                        if (!singleChapterBook) {
                            if (!startChapter) {
                                // Then we have a chapter range with no verses
                                parsedPassage.chapter = start
                                parsedPassage.verses = this.chapterVerses[book][start]
                                parsedPassage.to = {
                                    book: book,
                                    chapter: Number(end),
                                    verse: this.chapterVerses[book][end],
                                }
                            } else {
                                parsedPassage.verses.push(`${startVerse}-${end}`)
                            }
                        } else {
                            parsedPassage.chapter = 1
                            parsedPassage.verses.push(`${startVerse}-${end}`)
                        }
                    }
                } else {
                    // Handle individual chapter:verse references (e.g., "27:27")

                    let [chapterPart, versePart] = part.includes(separator)
                        ? part.split(separator)
                        : [parsedPassage.chapter, part]
                    if (singleChapterBook) {
                        if (!chapterPart) {
                            parsedPassage.chapter = 1
                            parsedPassage.verses.push(versePart) // Add single verse to array
                        } else {
                            parsedPassage.chapter = Number(chapterPart)
                            parsedPassage.verses.push(versePart) // Add single verse to array
                        }
                    } else {
                        // Need to check if chapterPart is undefined
                        // If it's undefined, then versePart actually is the chapter and we need to populate the
                        // verses from this.chapterVerses

                        if (chapterPart) {
                            parsedPassage.chapter = Number(chapterPart)
                            parsedPassage.verses.push(versePart) // Add single verse to array
                        } else {
                            parsedPassage.chapter = Number(versePart)
                            parsedPassage.verses = this.chapterVerses[book][parsedPassage.chapter]
                        }
                    }
                }
                parsedPassage.passages = this.populate(parsedPassage)
            })

            return parsedPassage
        })
        this.versification()
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
    populate(parsedPassage) {
        const passages = []

        // Helper function to process a parsed passage's verses
        const processVerses = (chapter, verses, book) => {
            verses.forEach((verse) => {
                if (isNaN(verse)) {
                    const [start, end] = verse.split("-").map(Number) // Handle ranges
                    for (let i = start; i <= end; i++) {
                        passages.push({ book, chapter: Number(chapter), verse: i })
                    }
                } else {
                    passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                }
            })
        }

        // Process main passage
        processVerses(parsedPassage.chapter, parsedPassage.verses, parsedPassage.book)

        // Process 'to' object if it exists (for cross-chapter ranges)
        if (parsedPassage.to) {
            processVerses(parsedPassage.to.chapter, parsedPassage.to.verses, parsedPassage.to.book)
        }

        return passages
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
