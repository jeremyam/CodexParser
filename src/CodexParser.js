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

        // Function to detect suffixes like "LXX" or "MT"
        const detectSuffix = (startIndex) => {
            const suffixMatch = text.substring(startIndex).match(/\b(LXX|MT)\b/i)
            return suffixMatch ? suffixMatch[0].toUpperCase() : null
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
                            // Look ahead to check if a number or space + number follows the abbreviation
                            const afterAbbreviation = lowerCaseText.substring(i + abbreviationWithDot.length).trim()
                            if (/^\d+/.test(afterAbbreviation)) {
                                // Check if there is a number (chapter/verse)
                                foundBook = abbreviations[k] // Store the abbreviation without the dot
                                foundIndex = i // Record the index where the abbreviation is found
                                matchedLength = abbreviationWithDot.length // Update the length of the match to include the dot
                                break // Exit once found
                            }
                        }
                    } else if (lowerCaseText.startsWith(abbreviation, i)) {
                        if (
                            isBoundaryOrNonAlphabetic(i - 1, lowerCaseText) &&
                            isBoundaryOrNonAlphabetic(i + abbreviation.length, lowerCaseText)
                        ) {
                            // Look ahead to check if a number or space + number follows the abbreviation
                            const afterAbbreviation = lowerCaseText.substring(i + abbreviation.length).trim()
                            if (/^\d+/.test(afterAbbreviation)) {
                                // Check if there is a number (chapter/verse)
                                if (abbreviation.length > matchedLength) {
                                    foundBook = abbreviations[k] // Store the abbreviation without the dot
                                    foundIndex = i // Record the index where the abbreviation is found
                                    matchedLength = abbreviation.length // Update the length of the match
                                }
                            }
                        }
                    }
                }
            }

            // If a book or abbreviation was found, look for chapter and verse patterns after the book
            if (foundBook !== null) {
                i += matchedLength // Skip ahead by the length of the found book
                let chapterVerse = ""
                const references = []

                // Loop to find all chapter and verse references in the current book
                while (i < text.length && isValidChapterVerseChar(text[i])) {
                    // Look ahead to see if the next characters form a new Bible book
                    if (isNextBibleBook(i)) {
                        break // Stop adding to chapterVerse if a new Bible book is found
                    }

                    // If we hit a semicolon, it means a new reference starts
                    //  || text[i] === " "
                    if (text[i] === ";") {
                        const formattedReference = chapterVerse
                            .trim()
                            .replace(/\./g, ":")
                            .replace(/[^a-zA-Z0-9]+$/, "")
                        if (formattedReference.length > 0) {
                            references.push(formattedReference) // Add the current reference to the list
                        }
                        chapterVerse = "" // Reset for the next reference
                        i++
                        continue
                    }

                    chapterVerse += text[i]
                    i++
                }

                // Process the last found chapter and verse (if any)
                if (chapterVerse.trim().length > 0) {
                    const formattedReference = chapterVerse
                        .trim()
                        .replace(/\./g, ":")
                        .replace(/[^a-zA-Z0-9]+$/, "")
                    if (formattedReference.length > 0) {
                        references.push(formattedReference)
                    }
                }

                // Detect if a suffix (LXX or MT) exists after the chapter/verse
                const suffix = detectSuffix(i)

                // Add each reference as a separate object
                references.forEach((ref) => {
                    this.found.push({
                        book: foundBook,
                        reference: ref,
                        index: foundIndex,
                        version: suffix || null,
                    })
                })
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
            const testament = this.bible.old.find((bible) => bible === book) ? "old" : "new"
            // Initialize the parsed passage object
            const parsedPassage = {
                original: passage.book + " " + passage.reference,
                book: book,
                chapter: null,
                verses: [], // Verse stored as an array
                type: null, // Set type based on reference
                testament: testament,
                index: passage.index,
                version: this._handleVersion(passage.version, testament),
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
                    }

                    // Handle same-chapter ranges (e.g., "27:27-29") and multi-chapter ranges (e.g., "Ex 2:1-3:4")
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
                                    verses: this.chapterVerses[book][end],
                                }
                            } else {
                                //
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
                            if (!this.chapterVerses[book][parsedPassage.chapter]) {
                                parsedPassage.valid = this._isValid(parsedPassage, passage.reference)
                            } else {
                                parsedPassage.verses = [
                                    this.chapterVerses[book][parsedPassage.chapter][0] +
                                        "-" +
                                        this.chapterVerses[book][parsedPassage.chapter][
                                            this.chapterVerses[book][parsedPassage.chapter].length - 1
                                        ],
                                ]
                                parsedPassage.type = "single_chapter"
                            }
                        }
                    }
                }
                parsedPassage.passages = this.populate(parsedPassage)
                parsedPassage.scripture = this.scripturize(parsedPassage)
            })

            parsedPassage.valid = this._isValid(parsedPassage, passage.reference)

            return parsedPassage
        })
        this.versification()
        return this // Return this instance
    }

    versification() {
        this.passages.forEach((passage) => {
            const hasVersification = this.versificationDifferences[passage.book]

            passage.passages.forEach((subPassage) => {
                // Apply general versification differences
                if (hasVersification) {
                    const key = `${subPassage.chapter}:${subPassage.verse}`
                    if (this.versificationDifferences[passage.book][key]) {
                        subPassage.versification = this.versificationDifferences[passage.book][key]
                    }
                }

                // Handle specific version adjustments for "lxx" or "mt"
                if (passage.version) {
                    const versionAbbreviation = passage.version.abbreviation
                    const versionType =
                        versionAbbreviation === "lxx" ? "lxx" : versionAbbreviation === "mt" ? "mt" : null

                    if (versionType) {
                        const versionReference = `${subPassage.chapter}:${subPassage.verse}`

                        // Look for matching versification based on the version type (lxx or mt)
                        for (const versification in this.versificationDifferences[passage.book]) {
                            if (
                                this.versificationDifferences[passage.book][versification][versionType] ===
                                versionReference
                            ) {
                                subPassage.versification = this.versificationDifferences[passage.book][versification]
                                break // Break once a match is found
                            }
                        }
                    }
                }
            })
        })
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
            if (!verses) {
                return
            }
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
        const { book, chapter, passages } = passage

        // Extract verses from the passages array
        const verses = passages.map((p) => p.verse)
        let formattedVerses = ""

        if (verses.length === 1) {
            // If there is only one verse
            formattedVerses = verses[0].toString()
        } else if (verses.length === 2 && verses[1] === verses[0] + 1) {
            // If there are exactly two verses and they are consecutive, use a comma
            formattedVerses = `${verses[0]},${verses[1]}`
        } else {
            // For more than two verses, or non-consecutive verses
            let ranges = []
            let tempRange = [verses[0]]

            for (let i = 1; i < verses.length; i++) {
                if (verses[i] === verses[i - 1] + 1) {
                    // If the verse is consecutive, add to tempRange
                    tempRange.push(verses[i])
                } else {
                    // If not consecutive, finalize tempRange
                    ranges.push(tempRange)
                    tempRange = [verses[i]]
                }
            }
            ranges.push(tempRange) // Push the last range

            // Format ranges: convert consecutive numbers to ranges, non-consecutive remain separate
            formattedVerses = ranges
                .map((range) => (range.length > 1 ? `${range[0]}-${range[range.length - 1]}` : range[0]))
                .join(",")
        }

        // Format the final passage
        const colon = formattedVerses ? ":" : ""
        const full = `${book} ${chapter}${colon}${formattedVerses}`.trim()
        const hash = full.toLowerCase().replace(/ /g, "_").replace(/:/g, ".").replace(/-/g, ".").replace(/,/g, ".")

        return {
            passage: full,
            cv: `${chapter}${colon}${formattedVerses}`,
            hash,
        }
    }

    /**
     * Combine multiple passages into one. The method checks for duplicates, merges overlapping or adjacent ranges,
     * and builds the original and scripture properties.
     * **This method will always combine based on English versification. LXX and MT versifications will be reflected in the combined passage.passages.versification.**
     * This method will fail if the passages are not to the same book and chapter.
     * @param {array} passages - An array of passage objects to combine.
     * @return {object} The combined passage object.
     */
    combine(passages) {
        // Only check if passages are from the same book
        const noDuplicates = [...new Set(passages.map((p) => p.book))]
        if (noDuplicates.length > 1) {
            throw new Error("Passages are not from the same book.")
        }

        const newPassages = []
        passages.forEach((passageSet) => {
            passageSet.passages.forEach((passage) => {
                if (passage.versification) {
                    newPassages.push(passage.book + " " + passage.versification.eng)
                } else {
                    newPassages.push(passage.book + " " + passage.chapter + ":" + passage.verse)
                }
            })
        })

        const noDuplicates2 = [...new Set(newPassages)]
        const parsed = this.parse(noDuplicates2.join(" // ")).getPassages()
        return this.join(parsed)
    }

    /**
     * Combine multiple passages into one. The method checks for duplicates, merges overlapping or adjacent ranges,
     * and builds the original and scripture properties.
     *
     * @param {array} passages - An array of passage objects to combine.
     * @return {object} The combined passage object.
     */
    join(passages) {
        const newObject = { ...passages[0] }

        for (let i = 1; i < passages.length; i++) {
            // Combine passages, but check for duplicates
            passages[i].passages.forEach((passage) => {
                // Add passage only if it's not already in newObject.passages
                const isDuplicate = newObject.passages.some(
                    (p) => p.book === passage.book && p.chapter === passage.chapter && p.verse === passage.verse
                )
                if (!isDuplicate) {
                    newObject.passages = newObject.passages.concat(passage)
                }
            })
            const verses = passages[i].verses
            for (let j = 0; j < verses.length; j++) {
                const verse = verses[j]
                newObject.verses = newObject.verses.concat(verse)
            }
        }

        // Remove lone numbers that are part of a range
        newObject.verses = newObject.verses.filter((v, i, arr) => {
            if (!v.includes("-")) {
                const num = parseInt(v, 10)
                return !arr.some((item) => {
                    if (item.includes("-")) {
                        const [start, end] = item.split("-").map(Number)
                        return num >= start && num <= end
                    }
                    return false
                })
            }
            return true // Keep ranges
        })

        // Convert to a Set to remove duplicates
        newObject.verses = [...new Set(newObject.verses)]

        // Helper function to merge overlapping or adjacent ranges
        const mergeRanges = (verses) => {
            const rangeObjects = verses.map((v) => {
                if (v.includes("-")) {
                    const [start, end] = v.split("-").map(Number)
                    return { start, end }
                } else {
                    const num = Number(v)
                    return { start: num, end: num }
                }
            })

            // Sort the ranges by starting number
            rangeObjects.sort((a, b) => a.start - b.start)

            const merged = []
            let currentRange = rangeObjects[0]

            for (let i = 1; i < rangeObjects.length; i++) {
                const nextRange = rangeObjects[i]

                if (currentRange.end >= nextRange.start - 1) {
                    // Overlapping or adjacent, merge the ranges
                    currentRange.end = Math.max(currentRange.end, nextRange.end)
                } else {
                    // No overlap, push the current range and start a new one
                    merged.push(currentRange)
                    currentRange = nextRange
                }
            }

            // Push the last range
            merged.push(currentRange)

            // Convert merged ranges back to strings
            return merged.map(({ start, end }) => (start === end ? `${start}` : `${start}-${end}`))
        }

        // Merge and sort the ranges
        newObject.verses = mergeRanges(newObject.verses)

        // Build the original and scripture properties
        newObject.original = newObject.book + " " + newObject.chapter + ":" + newObject.verses.join(",")
        newObject.scripture = {
            passage: newObject.book + " " + newObject.chapter + ":" + newObject.verses.join(","),
            cv: newObject.chapter + ":" + newObject.verses.join(","),
            hash: newObject.book + "_" + newObject.chapter + "." + newObject.verses.join("."),
        }
        newObject.scripture.hash = newObject.scripture.hash.toLowerCase()

        return newObject
    }

    getToc(version = "ESV") {
        // Initialize the table of contents (toc)
        const toc = {}

        // Add Old Testament books and their chapters/verses to toc
        this.bible.old.forEach((book) => {
            if (this.chapterVerses[book]) {
                toc[book] = this.chapterVerses[book]
            }
        })

        // Add New Testament books and their chapters/verses to toc
        this.bible.new.forEach((book) => {
            if (this.chapterVerses[book]) {
                toc[book] = this.chapterVerses[book]
            }
        })

        // Merge in single-chapter books if not already in toc
        this.singleChapterBook.forEach((item) => {
            Object.keys(item).forEach((book) => {
                if (!toc[book]) {
                    toc[book] = item[book]
                }
            })
        })

        // Sort the keys of toc by canonical order
        const orderedToc = {}
        const canonicalOrder = [...this.bible.old, ...this.bible.new]
        canonicalOrder.forEach((book) => {
            if (toc[book]) {
                orderedToc[book] = toc[book]
            }
        })

        return orderedToc
    }

    _isValid(passage, reference) {
        const singleChapterBook = this.singleChapterBook.find((bible) => bible[passage.book])
        if (!passage.verses) {
            return {
                error: true,
                code: 101,
                message: {
                    chapter_exists: false,
                    content: "Possible invalid chapter: " + reference,
                },
            }
        }
        if (!singleChapterBook) {
            if (!this.chapterVerses[passage.book][passage.chapter]) {
                return {
                    error: true,
                    code: 102,
                    message: {
                        chapter_exists: false,
                        content: `Chapter ${passage.chapter} does not exist in ${passage.book}`,
                    },
                }
            }
        } else {
            if (!singleChapterBook[passage.book][passage.chapter]) {
                return {
                    error: true,
                    code: 103,
                    message: {
                        chapter_exists: false,
                        content: `Chapter ${passage.chapter} does not exist in ${passage.book}`,
                    },
                }
            }
        }
        return true
    }
    _handleVersion(version, testament) {
        if (!version) {
            return null
        }
        if (version.toLowerCase() === "lxx" && testament.toLowerCase() === "old") {
            return {
                name: "Septuagint",
                value: "LXX",
                abbreviation: "lxx",
            }
        }

        if (version.toLowerCase() === "mt" && testament.toLowerCase() === "old") {
            return {
                name: "Masoretic Text",
                value: "MT",
                abbreviation: "mt",
            }
        }
    }
}

module.exports = CodexParser
