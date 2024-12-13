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
        this.version = null
    }

    /**
     * Scans the given text for Bible references and stores all found references in the `found` property of the instance.
     *
     * @param {string} text - The text to scan for Bible references.
     * @return {CodexParser} - Returns the instance itself, enabling method chaining.
     */
    scan(text) {
        // Combine Old and New Testament book names into a single array
        const fullNames = [...this.bible.old, ...this.bible.new]

        // Retrieve all abbreviation keys from the abbreviations object
        const abbreviations = Object.keys(this.abbreviations)

        // Initialize the `found` array to store the results
        this.found = []

        // Convert Bible book names, abbreviations, and input text to lowercase for case-insensitive matching
        const lowercaseBibleFullNames = fullNames.map((book) => book.toLowerCase())
        const lowercaseBibleAbbreviations = abbreviations.map((abbr) => abbr.toLowerCase())
        const lowerCaseText = text.toLowerCase()

        let i = 0 // Index pointer to iterate through the input text

        /**
         * Helper function to check if a character is part of a chapter or verse reference.
         * Non-word characters (anything not A-Z or a-z) are considered valid.
         */
        const isValidChapterVerseChar = (char) => /[^A-Za-z]/.test(char)

        /**
         * Helper function to determine if the text starting at a given index contains
         * the name of a new Bible book.
         */
        const isNextBibleBook = (startIndex) => {
            const textAfterCurrentPosition = lowerCaseText.substring(startIndex).trim()

            // Check for full Bible book names
            for (const book of lowercaseBibleFullNames) {
                if (textAfterCurrentPosition.startsWith(book)) return true
            }

            // Check for Bible book abbreviations
            for (const abbr of lowercaseBibleAbbreviations) {
                if (textAfterCurrentPosition.startsWith(abbr)) return true
            }

            return false // No match found
        }

        /**
         * Helper function to detect suffixes like "LXX" or "MT" in the text after a given index.
         * These suffixes are case-insensitive and indicate the version of the Bible reference.
         */
        const detectSuffix = (startIndex) => {
            const suffixMatch = text.substring(startIndex).match(/\b(LXX|MT)\b/i)
            return suffixMatch ? suffixMatch[0].toUpperCase() : null
        }

        // Iterate through the input text to detect and process Bible references
        while (i < lowerCaseText.length) {
            let foundBook = null // Placeholder for the detected book name
            let foundIndex = -1 // Index in the text where the book name starts
            let matchedLength = 0 // Length of the matched book name or abbreviation

            // Search for full Bible book names in the text
            for (let j = 0; j < lowercaseBibleFullNames.length; j++) {
                const book = lowercaseBibleFullNames[j]
                if (lowerCaseText.startsWith(book, i) && book.length > matchedLength) {
                    foundBook = fullNames[j] // Store the original book name (case-sensitive)
                    foundIndex = i
                    matchedLength = book.length // Update the match length
                }
            }

            // If no full book name is found, search for abbreviations
            if (!foundBook) {
                for (let k = 0; k < lowercaseBibleAbbreviations.length; k++) {
                    const abbreviation = lowercaseBibleAbbreviations[k]
                    if (lowerCaseText.startsWith(abbreviation, i)) {
                        foundBook = abbreviations[k]
                        foundIndex = i
                        matchedLength = abbreviation.length
                    }
                }
            }

            // If a Bible book is found
            if (foundBook) {
                i += matchedLength // Move the index pointer forward by the length of the book name
                let chapterVerse = "" // Placeholder for chapter and verse data
                const references = [] // Array to store multiple chapter/verse references for the same book

                // Extract chapter and verse references
                while (i < text.length && isValidChapterVerseChar(text[i])) {
                    if (isNextBibleBook(i)) break // Stop if a new Bible book is detected

                    // Handle semicolon-separated references (indicates a new reference)
                    if (text[i] === ";") {
                        const formattedReference = chapterVerse
                            .trim()
                            .replace(/\./g, ":")
                            .replace(/[^a-zA-Z0-9]+$/, "")
                        if (formattedReference) references.push(formattedReference)
                        chapterVerse = "" // Reset for the next reference
                        i++
                        continue
                    }

                    chapterVerse += text[i]
                    i++
                }

                // Process the last detected chapter/verse reference
                if (chapterVerse.trim().length > 0) {
                    const formattedReference = chapterVerse
                        .trim()
                        .replace(/\./g, ":")
                        .replace(/[^a-zA-Z0-9]+$/, "")
                    if (formattedReference) references.push(formattedReference)
                }

                // Detect any suffix (e.g., "LXX" or "MT") after the chapter/verse reference
                const suffix = detectSuffix(i)

                // Add each reference as a separate object to the `found` array with type recognition
                references.forEach((ref) => {
                    let type

                    if (ref.includes(":")) {
                        if (ref.includes("-")) {
                            const [start, end] = ref.split("-")
                            const startParts = start.split(":")
                            const endParts = end.split(":")

                            if (startParts.length > 1 && endParts.length > 1 && startParts[0] !== endParts[0]) {
                                type = "multi_chapter_verse_range" // Example: "8:23-9:1"
                            } else {
                                type = "chapter_verse_range" // Example: "8:23-25"
                            }
                        } else if (ref.includes(",")) {
                            type = "comma_separated_verses" // Example: "8:23,24"
                        } else {
                            type = "chapter_verse" // Example: "8:23"
                        }
                    } else if (ref.includes("-")) {
                        type = "chapter_range" // Example: "8-9"
                    } else {
                        type = "single_chapter" // Example: "8"
                    }

                    this.found.push({
                        book: foundBook,
                        reference: ref,
                        index: foundIndex,
                        version: suffix || null,
                        type,
                    })
                })
            } else {
                i++ // Move to the next character if no book is found
            }
        }

        return this // Return the current instance for method chaining
    }

    bibleVersion(version) {
        const lowerVersion = version.toLowerCase()
        this.version =
            lowerVersion === "lxx" || lowerVersion === "eng" || lowerVersion === "bhs" || lowerVersion === "mt"
                ? lowerVersion
                : null
        return this
    }

    /**
     * Parses a given reference and returns an object with the parsed passage,
     * including book, chapter, verse, type, testament, index, and version.
     *
     * @param {string} reference - The reference to parse.
     * @returns {object} An object with the parsed passage.
     */
    parse(reference) {
        this.scan(reference)

        this.passages = this.found.map((passage) => {
            const book = this.bookify(passage.book)
            const testament = this.bible.old.includes(book) ? "old" : "new"

            const parsedPassage = {
                original: `${passage.book} ${passage.reference}`,
                book,
                chapter: null,
                verses: [],
                type: passage.type,
                testament,
                index: passage.index,
                version: this._handleVersion(passage.version, testament),
            }
            const parts = passage.reference.split(",")
            const isSingleChapter = this.singleChapterBook.some((singleChapterBook) => singleChapterBook[book])

            parts.forEach((part) => {
                part = part.trim()
                const separator = part.includes(":") ? ":" : "."

                if (part.includes("-")) {
                    if (!isSingleChapter) {
                        if (part.includes(":")) {
                            let [start, end] = part.split("-")
                            const [startChapter, startVerse] = start.includes(separator)
                                ? start.split(separator).map(Number)
                                : [parsedPassage.chapter, Number(start)]
                            const [endChapter, endVerse] = end.includes(separator)
                                ? end.split(separator).map(Number)
                                : [startChapter, Number(end)]

                            parsedPassage.chapter = startChapter

                            if (startChapter !== endChapter) {
                                parsedPassage.to = {
                                    book,
                                    chapter: endChapter,
                                    verses: [endVerse],
                                }
                                parsedPassage.verses.push(startVerse)
                            } else {
                                parsedPassage.verses.push(...this._generateRange(startVerse, endVerse))
                            }
                        } else {
                            const [start, end] = part.split("-")
                            parsedPassage.chapter = Number(start)
                            parsedPassage.to = {
                                book,
                                chapter: Number(end),
                                verses: [],
                            }
                        }
                    } else {
                        part = part.replace(/\d+:/gim, "")
                        const [singleChapterStartVerse, singleChapterEndVerse] = part.split("-")
                        parsedPassage.chapter = 1
                        parsedPassage.verses = [`${singleChapterStartVerse}-${singleChapterEndVerse}`]
                        parsedPassage.type = "single_chapter_book_verse_range"
                    }
                } else if (part.includes(separator)) {
                    const [chapterPart, versePart] = part.split(separator).map(Number)
                    parsedPassage.chapter = chapterPart
                    if (versePart) parsedPassage.verses.push(versePart)
                } else {
                    if (!isSingleChapter) {
                        const number = Number(part)
                        if (!parsedPassage.verses.length) {
                            parsedPassage.chapter = number
                        }
                        parsedPassage.verses.push(Number(part))
                    } else {
                        parsedPassage.chapter = 1
                        parsedPassage.verses.push(Number(part))
                    }
                }
            })

            parsedPassage.passages = this.populate(parsedPassage)
            parsedPassage.scripture = this.scripturize(parsedPassage)
            parsedPassage.valid = this._isValid(parsedPassage, passage.reference)
            this._setVersion(parsedPassage)
            return parsedPassage
        })
        this.versification()
        return this
    }
    /**
     * Generates an array of numbers representing a range from start to end, inclusive.
     */
    _generateRange(start, end) {
        const range = []
        for (let i = start; i <= end; i++) {
            range.push(i)
        }
        return range
    }

    _searchVersificationDifferences(passage) {
        const { book, chapter, version } = passage

        // Loop through each key-value pair in the dictionary
        for (const [key, value] of Object.entries(this.versificationDifferences[book])) {
            // Check if the key starts with the desired chapter
            if (value[version.abbreviation].startsWith(`${chapter}:`)) {
                // Ensure the version exists in the value object
                if (value[version.abbreviation]) {
                    // Extract the verse number from the value
                    const verse = value[version.abbreviation].split(":")[1]
                    this.chapterVerses[book][chapter].push(Number(verse))
                }
            }
        }
        this.chapterVerses[book][chapter] = Array.from(this.chapterVerses[book][chapter])
        return this.chapterVerses // Return the array of verses
    }

    _setVersion(passage) {
        this.version = passage.version ? passage.version.abbreviation : "eng"

        if (this.version !== "eng") {
            this._searchVersificationDifferences(passage)
        }
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
    /**
     * Populate all verses from a parsed passage, including all verses in ranges or chapters.
     *
     * @param {Object} parsedPassage - The parsed passage object containing book, chapter, and verses information.
     * @return {Array} An array of passage objects with individual verses.
     */
    populate(parsedPassage) {
        const passages = []
        const { book, chapter, verses, type } = parsedPassage
        if (type === "single_chapter") {
            // Handle single chapter references
            if (this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
                this.chapterVerses[book][chapter].forEach((verse) => {
                    passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                })
            }
        } else if (type === "comma_separated_verses") {
            // Handle only the explicitly mentioned verses
            if (verses && this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
                verses.forEach((verse) => {
                    passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                })
            }
        } else if (type === "chapter_range") {
            const { to } = parsedPassage

            for (let i = chapter; i <= to.chapter; i++) {
                const verses = this.chapterVerses[book][i]
                for (let j = verses[0]; j < verses.length; j++) {
                    passages.push({
                        book,
                        chapter: i,
                        verse: j,
                    })
                }
            }
        } else if (type === "multi_chapter_verse_range") {
            const { to } = parsedPassage
            // Create an array of reference objects for the start and end of the range
            const refs = [
                {
                    chapter: Number(parsedPassage.chapter),
                    verse: Number(parsedPassage.verses[0]),
                },
                {
                    chapter: Number(to.chapter),
                    verse: Number(to.verses[to.verses.length - 1]),
                },
            ]

            const startChapter = refs[0].chapter
            const startVerse = refs[0].verse
            const endChapter = refs[refs.length - 1].chapter
            const endVerse = refs[refs.length - 1].verse

            // Loop through the range of chapters
            for (let chapter = startChapter; chapter <= endChapter; chapter++) {
                // Determine the starting verse for the current chapter
                const chapterStartVerse = chapter === startChapter ? startVerse : 1
                // Determine the ending verse for the current chapter
                const chapterEndVerse = chapter === endChapter ? endVerse : this.chapterVerses[book][chapter].length

                // Get the array of verses for the current chapter
                const verses = this.chapterVerses[book][chapter].slice(chapterStartVerse - 1, chapterEndVerse)

                // Loop through the verses in the current chapter
                for (let j = 0; j < verses.length; j++) {
                    const currentVerse = chapterStartVerse + j

                    // Add the verse to the passages array
                    passages.push({
                        book,
                        chapter,
                        verse: currentVerse,
                    })
                }
            }
        } else if (type === "chapter_verse" || type === "chapter_verse_range") {
            // Handle chapter:verse or chapter:verse-range references
            if (verses && this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
                verses.forEach((verse) => {
                    if (typeof verse === "string" && verse.includes("-")) {
                        const [start, end] = verse.split("-").map(Number)
                        for (let i = start; i <= end; i++) {
                            passages.push({ book, chapter: Number(chapter), verse: i })
                        }
                    } else {
                        passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                    }
                })
            }
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
        // Return the array of passages and add a custom first() method to it
        const passagesArray = [...this.passages] // Clone the array to avoid mutation

        // Add first() method directly to the array
        passagesArray.first = function () {
            return this.length > 0 ? this[0] : null
        }

        return passagesArray
    }

    // New first() method that can be chained after getPassages()
    first() {
        return this.passages.length > 0 ? this.passages[0] : null
    }

    /**
     * Converts a passage object into a scripturize object with human-readable name, chapter and verses and a hash.
     *
     * @param {object} passage - The passage object to scripturize.
     * @return {object} The object with the human-readable name, chapter and verses and a hash.
     */
    scripturize(passage) {
        const { book, chapter, passages, to } = passage

        // Extract verses from the passages array
        const verses = passages.map((p) => ({ chapter: p.chapter, verse: p.verse }))
        let formattedVerses = ""

        if (to && to.chapter && to.chapter !== chapter) {
            // Handle multi-chapter range
            const startChapter = chapter
            const startVerses = verses.filter((v) => v.chapter === startChapter).map((v) => v.verse)

            const endChapter = to.chapter
            const endVerses = verses.filter((v) => v.chapter === endChapter).map((v) => v.verse)

            const startFormatted =
                startVerses.length > 1 ? `${startVerses[0]}-${startVerses[startVerses.length - 1]}` : startVerses[0]

            const endFormatted =
                endVerses.length > 1 ? `${endVerses[0]}-${endVerses[endVerses.length - 1]}` : endVerses[0]

            formattedVerses = `${startChapter}:${startFormatted}-${endChapter}:${endFormatted}`
        } else {
            // Handle single-chapter range
            const startVerses = verses.map((v) => v.verse)

            if (startVerses.length === 1) {
                formattedVerses = startVerses[0].toString()
            } else {
                // Group consecutive verses into ranges
                let ranges = []
                let tempRange = [startVerses[0]]

                for (let i = 1; i < startVerses.length; i++) {
                    if (startVerses[i] === startVerses[i - 1] + 1) {
                        tempRange.push(startVerses[i])
                    } else {
                        ranges.push(tempRange)
                        tempRange = [startVerses[i]]
                    }
                }
                ranges.push(tempRange)

                formattedVerses = ranges
                    .map((range) => (range.length > 1 ? `${range[0]}-${range[range.length - 1]}` : range[0]))
                    .join(",")
            }

            formattedVerses = `${chapter}:${formattedVerses}`
        }

        // Format the final passage
        const full = `${book} ${formattedVerses}`.trim()
        const hash = full.toLowerCase().replace(/ /g, "_").replace(/:/g, ".").replace(/-/g, ".").replace(/,/g, ".")

        return {
            passage: full,
            cv: formattedVerses,
            hash,
        }
    }

    /**
     * Combine multiple passages into one. The method checks for duplicates, merges overlapping or adjacent ranges,
     * and builds the original and scripture properties.
     * **This method will always combine based on English versification. LXX and MT versifications will be reflected in the combined passage.passages.versification.**
     * This method will fail if the passages are not to the same book and chapter.
     * TODO: Add support for MT and LXX
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
        const newObject = { ...passages[0] } // Start with the first passage

        const chapters = {} // Store verses by chapters
        const uniquePassages = new Set() // Track unique passages to prevent duplicates

        // Add initial passages to the unique set to avoid duplication
        newObject.passages.forEach((p) => {
            const passageKey = `${p.book}-${p.chapter}-${p.verse}`
            uniquePassages.add(passageKey)
        })

        // Iterate through all the passages and group verses by chapter
        passages.forEach((passage) => {
            if (!chapters[passage.chapter]) {
                chapters[passage.chapter] = new Set() // Use Set to avoid duplicates
            }

            // Add verses to their corresponding chapter
            passage.passages.forEach((p) => {
                chapters[p.chapter].add(p.verse)

                // Create a unique key for each passage (book-chapter-verse)
                const passageKey = `${p.book}-${p.chapter}-${p.verse}`

                // Add to the passages array if it hasn't been added yet
                if (!uniquePassages.has(passageKey)) {
                    newObject.passages.push(p) // Add the passage
                    uniquePassages.add(passageKey) // Mark it as added
                }
            })
        })

        // Sort the newObject.passages array by chapter first, then by verse
        newObject.passages.sort((a, b) => {
            if (a.chapter !== b.chapter) {
                return a.chapter - b.chapter // Sort by chapter
            }
            return a.verse - b.verse // Sort by verse within the same chapter
        })

        // Prepare to build the final result
        const chapterStrings = []
        let firstChapter = null
        let lastChapter = null

        for (const chapter in chapters) {
            const verses = Array.from(chapters[chapter]).sort((a, b) => a - b)
            const mergedVerses = this.mergeRanges(verses) // Merge adjacent verses into ranges
            chapterStrings.push(`${chapter}:${mergedVerses.join(",")}`)

            // Track the first and last chapters for the 'to' key
            if (!firstChapter) firstChapter = Number(chapter) // Ensure chapter is a number
            lastChapter = Number(chapter) // Always update to the current chapter as a number

            // Update the newObject.verses with the merged ranges for the current chapter
            if (Number(chapter) === firstChapter) {
                newObject.verses = mergedVerses
            }
        }

        // Build the final combined object with `to` key for multi-chapter passages
        newObject.original = `${newObject.book} ${firstChapter}:${newObject.verses.join(",")}`

        if (firstChapter !== lastChapter) {
            newObject.to = {
                book: newObject.book,
                chapter: lastChapter,
                verses: this.mergeRanges(Array.from(chapters[lastChapter])), // Ensure merged range
            }
        }

        // Build the scripture string with combined chapters (without spaces after commas)
        const chapterString = chapterStrings.join(",") // No space after comma
        newObject.scripture = {
            passage: `${newObject.book} ${chapterString}`,
            cv: chapterString,
            hash: `${newObject.book.toLowerCase()}_${chapterString.replace(/:/g, ".").replace(/,/g, ".")}`,
        }

        return newObject
    }
    mergeRanges(verses) {
        const sortedVerses = [...new Set(verses)].sort((a, b) => a - b)
        const merged = []
        let start = sortedVerses[0]
        let end = sortedVerses[0]

        for (let i = 1; i < sortedVerses.length; i++) {
            if (sortedVerses[i] === end + 1) {
                end = sortedVerses[i]
            } else {
                // Push the current range if it's more than 2 consecutive numbers, otherwise separate by commas
                if (start === end) {
                    merged.push(`${start}`)
                } else if (end === start + 1) {
                    merged.push(`${start},${end}`)
                } else {
                    merged.push(`${start}-${end}`)
                }
                start = sortedVerses[i]
                end = sortedVerses[i]
            }
        }

        // Push the final range or pair
        if (start === end) {
            merged.push(`${start}`)
        } else if (end === start + 1) {
            merged.push(`${start},${end}`)
        } else {
            merged.push(`${start}-${end}`)
        }

        return merged
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
        if (this.version) {
            version = this.version
        }
        if (!version) {
            version = "eng"
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
