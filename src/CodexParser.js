/**
 * CodexParser.js
 * A class for scanning and parsing scripture references from text, supporting various formats
 * (e.g., single verses, ranges, multi-chapter references) with validation and version-specific
 * versification. Handles book names, abbreviations, and SBL-style formatting.
 */

const versified = require("./versified")
const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbreviations = require("./abbr")
const sblAbbreviations = require("./abbr/sbl")
const dump = require("./functions").dump
const dd = require("./functions").dd
const sch = require("./functions").sch
const chapter_verses = require("./chapterVerseCombine")

/**
 * Class for parsing and validating scripture references.
 * @class
 */
class CodexParser {
    /**
     * Initializes the parser with default properties and data.
     */
    constructor(config = {}) {
        this.found = [] // Array to store detected references
        this.passages = [] // Array to store parsed passages
        this.bible = bible // Bible data (Old/New Testament books)
        this.bookRegex = bookRegex // Regex for book names
        this.chapterRegex = chapterRegex // Regex for chapters
        this.verseRegex = verseRegex // Regex for verses
        this.scripturesRegex = scripturesRegex // Regex for full references
        this.abbreviations = abbreviations // Book abbreviation mappings
        this.sblAbbreviations = sblAbbreviations // SBL-style abbreviation mappings
        this.versificationDifferences = versified // Version-specific verse differences
        this.singleChapterBook = [
            // Books with a single chapter and their verse counts
            sch("Jude", 25),
            sch("2 John", 13),
            sch("3 John", 15),
            sch("Obadiah", 21),
            sch("Philemon", 25),
        ]
        this.chapterVerses = chapter_verses // Chapter-verse mappings
        this.error = false // Error flag
        this.version = null // Bible version (e.g., lxx, mt, eng)
        // Reference type constants
        this.SINGLE_CHAPTER = "single_chapter"
        this.CHAPTER_VERSE = "chapter_verse"
        this.CHAPTER_VERSE_RANGE = "chapter_verse_range"
        this.COMMA_SEPARATED = "comma_separated_verses"
        this.CHAPTER_RANGE = "chapter_range"
        this.MULTI_CHAPTER_RANGE = "multi_chapter_verse_range"
        this.config = {
            booksOnly: config.booksOnly ?? false,
            invalid_sequence_strategy: config.invalid_sequence_strategy ?? "include",
            invalid_passage_strategy: config.invalid_passage_strategy ?? "include",
        }
    }

    /**
     * Sets configuration options for the parser.
     * @param {Object} config - Configuration options.
     * @param {boolean} [config.booksOnly=false] - Whether to capture book names without references.
     * @returns {CodexParser} The parser instance for method chaining.
     */
    options(config) {
        this.config = {
            booksOnly: config.booksOnly ?? false,
            invalid_sequence_strategy: config.invalid_sequence_strategy ?? this.config.invalid_sequence_strategy,
            invalid_passage_strategy: config.invalid_passage_strategy ?? this.config.invalid_passage_strategy,
        }
        return this
    }

    /**
     * Retrieves available verses for a given book and chapter.
     * @param {string} book - The book name (e.g., "Genesis").
     * @param {number} chapter - The chapter number.
     * @returns {number[]} Array of valid verse numbers.
     */
    getChapterVerses(book, chapter) {
        const singleChapterBook = this.singleChapterBook.find((b) => Object.keys(b)[0] === book)
        return singleChapterBook ? singleChapterBook[book][chapter] || [] : this.chapterVerses[book]?.[chapter] || []
    }

    /**
     * Scans text for scripture references and stores them in `this.found`.
     * @param {string} text - The text to scan.
     * @returns {CodexParser} The parser instance for method chaining.
     */
    scan(text) {
        const fullNames = [...this.bible.old, ...this.bible.new]
        const abbreviations = Object.keys(this.abbreviations)
        this.found = []
        // Minimal normalization: fix periods before numbers, remove trailing periods
        let normalizedText = text.replace(/\.(?=\d)/g, ":").replace(/(\b[A-Za-z]+)\.(?=\s|$)/g, "$1")
        console.log(`Input text: ${text}`)
        console.log(`Normalized text: ${normalizedText}`)
        const lowercaseBibleFullNames = fullNames.map((book) => book.toLowerCase())
        const lowercaseBibleAbbreviations = abbreviations.map((abbr) => abbr.toLowerCase())
        const lowerCaseText = normalizedText.toLowerCase()
        let i = 0

        const isValidChapterVerseChar = (char) => /[\d:,\-;\s]/.test(char)
        const isNextBibleBook = (startIndex) => {
            const textAfterCurrentPosition = lowerCaseText.substring(startIndex).trim()
            return (
                lowercaseBibleFullNames.some((book) => textAfterCurrentPosition.startsWith(book)) ||
                lowercaseBibleAbbreviations.some((abbr) => textAfterCurrentPosition.startsWith(abbr))
            )
        }
        const detectSuffix = (startIndex) => {
            const suffixMatch = normalizedText.substring(startIndex).match(/\b(LXX|MT)\b/i)
            return suffixMatch ? { suffix: suffixMatch[0].toUpperCase(), length: suffixMatch[0].length } : null
        }

        while (i < lowerCaseText.length) {
            let foundBook = null
            let bookStartIndex = -1
            let matchedLength = 0

            // Skip whitespace and special characters before checking for book
            while (i < lowerCaseText.length && /[\s—-]/.test(lowerCaseText[i])) {
                i++
            }
            if (i >= lowerCaseText.length) break

            console.log(`Scanning at index ${i}: ${lowerCaseText.slice(i, i + 10)}...`)

            for (let j = 0; j < lowercaseBibleFullNames.length; j++) {
                const book = lowercaseBibleFullNames[j]
                if (lowerCaseText.startsWith(book, i) && book.length > matchedLength) {
                    foundBook = fullNames[j]
                    bookStartIndex = i
                    matchedLength = book.length
                }
            }

            if (!foundBook) {
                for (let k = 0; k < lowercaseBibleAbbreviations.length; k++) {
                    const abbreviation = lowercaseBibleAbbreviations[k]
                    if (lowerCaseText.startsWith(abbreviation, i) && abbreviation.length > matchedLength) {
                        foundBook = this.abbreviations[abbreviations[k]]
                        bookStartIndex = i
                        matchedLength = abbreviation.length
                    }
                }
            }

            if (foundBook) {
                console.log(`Found book: ${foundBook} at index ${bookStartIndex}, length ${matchedLength}`)
                i += matchedLength
                let chapterVerse = ""
                const references = []
                let refStartIndex = bookStartIndex // Start of reference (including book) in normalizedText
                let originalRefStartIndex = bookStartIndex // Start in original text

                while (i < normalizedText.length && isValidChapterVerseChar(normalizedText[i])) {
                    if (isNextBibleBook(i)) {
                        console.log(`Next book detected at index ${i}, stopping reference parsing`)
                        break
                    }
                    if (normalizedText[i] === ";") {
                        const formattedReference = chapterVerse.trim()
                        if (formattedReference) {
                            const refEndIndex = i
                            references.push({
                                ref: formattedReference,
                                start: refStartIndex,
                                end: refEndIndex,
                            })
                            console.log(
                                `Reference found: ${formattedReference}, normalized indices ${refStartIndex}-${refEndIndex}`
                            )
                        }
                        chapterVerse = ""
                        refStartIndex = i + 1
                        const semicolonIndex = text.indexOf(";", originalRefStartIndex)
                        originalRefStartIndex = semicolonIndex !== -1 ? semicolonIndex + 1 : refStartIndex
                        i++
                        continue
                    }
                    chapterVerse += normalizedText[i]
                    i++
                }

                if (chapterVerse.trim().length > 0) {
                    const formattedReference = chapterVerse.trim()
                    if (formattedReference) {
                        const refEndIndex = i
                        references.push({
                            ref: formattedReference,
                            start: refStartIndex,
                            end: refEndIndex,
                        })
                        console.log(
                            `Final reference found: ${formattedReference}, normalized indices ${refStartIndex}-${refEndIndex}`
                        )
                    }
                }

                // Align indices with original text
                const originalBookText = text.slice(bookStartIndex, bookStartIndex + matchedLength)
                const originalBookStartIndex =
                    text.indexOf(originalBookText, bookStartIndex) !== -1
                        ? text.indexOf(originalBookText, bookStartIndex)
                        : bookStartIndex
                console.log(`Original book text: ${originalBookText}, original start index: ${originalBookStartIndex}`)

                references.forEach(({ ref, start, end }, refIndex) => {
                    let type
                    if (ref.includes(":")) {
                        if (ref.includes("-")) {
                            const [start, end] = ref.split("-")
                            const startParts = start.split(":")
                            const endParts = end.split(":")
                            type =
                                startParts.length > 1 &&
                                endParts.length > 1 &&
                                startParts[0].trim() !== endParts[0].trim()
                                    ? "multi_chapter_verse_range"
                                    : "chapter_verse_range"
                        } else if (ref.includes(",")) {
                            type = "comma_separated_verses"
                        } else {
                            type = "chapter_verse"
                        }
                    } else if (ref.includes("-")) {
                        type = "chapter_range"
                    } else {
                        type = "single_chapter"
                    }

                    // Construct full reference text for original text
                    const fullRefText =
                        start === bookStartIndex
                            ? `${originalBookText} ${ref.replace(":", ".")}`
                            : ref.replace(":", ".")
                    const suffixData = detectSuffix(end)
                    const suffix = suffixData ? suffixData.suffix : null
                    let refEndIndex = end
                    if (suffixData) {
                        refEndIndex += suffixData.length
                        i += suffixData.length // Skip suffix
                    }

                    // Map to original text
                    let originalStartIndex = originalBookStartIndex
                    if (start > bookStartIndex) {
                        // For subsequent references, adjust search to include book
                        const searchText = `${originalBookText} ${ref.replace(":", ".")}`
                        originalStartIndex =
                            text.indexOf(searchText, originalRefStartIndex - matchedLength) !== -1
                                ? text.indexOf(searchText, originalRefStartIndex - matchedLength)
                                : originalRefStartIndex
                    } else {
                        originalStartIndex =
                            text.indexOf(fullRefText, originalRefStartIndex) !== -1
                                ? text.indexOf(fullRefText, originalRefStartIndex)
                                : originalRefStartIndex
                    }

                    let originalEndIndex = originalStartIndex + fullRefText.length
                    let originalText = text.slice(originalStartIndex, originalEndIndex)

                    // Adjust for suffix in original text
                    if (suffixData) {
                        originalEndIndex += suffixData.length
                        originalText = text.slice(originalStartIndex, originalEndIndex)
                    }

                    // Trim trailing whitespace from originalText
                    while (originalEndIndex > originalStartIndex && /[\s]/.test(text[originalEndIndex - 1])) {
                        originalEndIndex--
                        originalText = text.slice(originalStartIndex, originalEndIndex)
                    }

                    console.log(
                        `Reference ${
                            refIndex + 1
                        }: ${originalText}, original indices ${originalStartIndex}-${originalEndIndex}, type: ${type}, suffix: ${
                            suffix || "none"
                        }, search text: ${fullRefText}`
                    )

                    this.found.push({
                        book: foundBook,
                        reference: ref,
                        startIndex: originalStartIndex,
                        endIndex: originalEndIndex,
                        version: suffix || null,
                        type,
                        originalText: originalText,
                    })
                })
            } else {
                i++
            }
        }

        console.log(`Found references: ${JSON.stringify(this.found, null, 2)}`)
        return this
    }

    /**
     * Sets the Bible version for parsing.
     * @param {string} version - The version (e.g., "lxx", "mt", "eng").
     * @returns {CodexParser} The parser instance.
     */
    bibleVersion(version) {
        const lowerVersion = version.toLowerCase()
        this.version =
            lowerVersion === "lxx" || lowerVersion === "eng" || lowerVersion === "bhs" || lowerVersion === "mt"
                ? lowerVersion
                : null
        return this
    }

    /**
     * Parses a scripture reference into structured passage objects.
     * @param {string} reference - The reference to parse (e.g., "John 3:16").
     * @returns {CodexParser} The parser instance.
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
                startIndex: passage.startIndex,
                endIndex: passage.endIndex,
                originalText: passage.originalText,
                version: this._handleVersion(passage.version, testament),
                passages: [],
                scripture: null,
                valid: true,
                start: null,
                end: null,
                abbr: null,
            }

            // Clean reference for parsing
            let cleanReference = passage.reference.replace(/\s*(LXX|MT)$/i, "").trim()
            if (cleanReference.endsWith(",")) {
                cleanReference = cleanReference.slice(0, -1).trim()
            }

            // Handle book-only or empty references
            if (!cleanReference && this.config.booksOnly) {
                parsedPassage.type = "book_only"
            } else if (!cleanReference || cleanReference.match(/^\d+\s*[:;]?\s*$/)) {
                const chapterMatch = cleanReference.match(/\d+/) || ["1"]
                const chapter = Number(chapterMatch[0])
                parsedPassage.chapter = chapter
                parsedPassage.type = this.SINGLE_CHAPTER
                const chapterVerses = this.getChapterVerses(book, chapter)
                if (chapterVerses.length) {
                    const startVerse = chapterVerses[0]
                    const endVerse = chapterVerses[chapterVerses.length - 1]
                    parsedPassage.verses = [`${startVerse}-${endVerse}`]
                }
            } else {
                this.parseReferenceParts(parsedPassage, cleanReference)
            }

            parsedPassage.passages = this.populate(parsedPassage)
            parsedPassage.scripture = this.scripturize(parsedPassage)
            parsedPassage.valid = this._isValid(parsedPassage, cleanReference)

            // Set abbr property using SBL-style abbreviations
            const sblEntry = Object.entries(this.sblAbbreviations).find(
                ([key]) => key.toLowerCase() === book.toLowerCase()
            )
            if (sblEntry) {
                const { value, abbr } = sblEntry[1]
                const ref = passage.reference.replace(/\s*(LXX|MT)$/i, "").trim()
                parsedPassage.abbr = abbr
                    ? `${value}. ${ref}${passage.version ? " " + passage.version : ""}`
                    : `${value} ${ref}${passage.version ? " " + passage.version : ""}`
            } else {
                parsedPassage.abbr = parsedPassage.original
            }

            if (parsedPassage.type === this.MULTI_CHAPTER_RANGE) {
                this.handleMultiChapterRange(parsedPassage, cleanReference)
            } else {
                delete parsedPassage.to
            }

            // Calculate start and end based on passages array
            if (parsedPassage.passages.length > 0) {
                const sortedPassages = parsedPassage.passages.slice().sort((a, b) => {
                    if (a.chapter !== b.chapter) return a.chapter - b.chapter
                    return a.verse - b.verse
                })
                const firstPassage = sortedPassages[0]
                const lastPassage = sortedPassages[sortedPassages.length - 1]
                parsedPassage.start = {
                    book: firstPassage.book,
                    chapter: firstPassage.chapter,
                    verse: firstPassage.verse,
                }
                parsedPassage.end = {
                    book: lastPassage.book,
                    chapter: lastPassage.chapter,
                    verse: lastPassage.verse,
                }
            }

            if (!parsedPassage.version) {
                parsedPassage.version = {
                    name: "English",
                    value: "ENG",
                    abbreviation: "eng",
                }
            }

            return parsedPassage
        })

        this.versification()
        return this
    }

    /**
     * Parses reference parts into chapter and verse components.
     * @param {Object} passage - The passage object to populate.
     * @param {string} reference - The reference string.
     * @private
     */
    parseReferenceParts(passage, reference) {
        const singleChapterBook = this.singleChapterBook.find((b) => Object.keys(b)[0] === passage.book)
        const parts = reference
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part)

        parts.forEach((part, index) => {
            const isFirstPart = index === 0

            // Handle multi-chapter ranges (e.g., "2:1-3:19")
            if (part.includes("-") && part.includes(":")) {
                const [start, end] = part.split("-").map((s) => s.trim())
                const startParts = start.split(/[:.]/).map((s) => s.trim())
                const endParts = end.split(/[:.]/).map((s) => s.trim())
                if (startParts.length > 1 && endParts.length > 1 && startParts[0] !== endParts[0]) {
                    passage.type = this.MULTI_CHAPTER_RANGE
                    passage.chapter = Number(startParts[0])
                    passage.verses = [startParts[1] || "1"]
                    passage.to = {
                        book: passage.book,
                        chapter: Number(endParts[0]),
                        verses: [endParts[1] || "1"],
                    }
                    return
                }
            }

            // Handle chapter-only references (e.g., "3")
            if (!part.includes(":") && !part.includes("-") && !singleChapterBook) {
                const chapter = Number(part.replace(/[^0-9]/g, ""))
                if (chapter > 0) {
                    passage.chapter = chapter
                    passage.type = this.SINGLE_CHAPTER
                    const chapterVerses = this.getChapterVerses(passage.book, chapter)
                    if (chapterVerses.length) {
                        const startVerse = chapterVerses[0]
                        const endVerse = chapterVerses[chapterVerses.length - 1]
                        passage.verses = [`${startVerse}-${endVerse}`]
                    }
                    return
                }
            }

            if (part.includes(":")) {
                this.parseChapterVerse(passage, part, isFirstPart)
            } else if (singleChapterBook) {
                this.parseSingleChapterBook(passage, part, isFirstPart && parts.length === 1)
            } else if (part.includes("-")) {
                this.parseRange(passage, part, isFirstPart)
            } else {
                this.parseSingleNumber(passage, part, isFirstPart)
            }
        })
    }

    /**
     * Parses chapter-verse references (e.g., "3:16").
     * @param {Object} passage - The passage object.
     * @param {string} part - The reference part.
     * @param {boolean} isFirstPart - Whether this is the first part.
     * @private
     */
    parseChapterVerse(passage, part, isFirstPart) {
        const [chapter, verse] = part.split(/[:.]/).map((s) => s.trim())
        if (isFirstPart) passage.chapter = Number(chapter)
        passage.type = verse.includes("-")
            ? this.CHAPTER_VERSE_RANGE
            : verse.includes(",")
            ? this.COMMA_SEPARATED
            : this.CHAPTER_VERSE
        if (verse.includes(",")) {
            passage.verses.push(...verse.split(",").map((v) => v.trim()))
        } else {
            passage.verses.push(verse)
        }
    }

    /**
     * Parses references for single-chapter books (e.g., "Jude 5").
     * @param {Object} passage - The passage object.
     * @param {string} part - The reference part.
     * @param {boolean} isWholeChapter - Whether the reference is for the whole chapter.
     * @private
     */
    parseSingleChapterBook(passage, part, isWholeChapter) {
        const verseCount = this.getChapterVerses(passage.book, 1).length
        if (part === "1" && isWholeChapter) {
            passage.chapter = 1
            passage.type = this.SINGLE_CHAPTER
            passage.verses = [`1-${verseCount}`]
        } else if (part.includes("-")) {
            passage.chapter = 1
            passage.verses.push(part)
            passage.type = this.CHAPTER_VERSE_RANGE
        } else if (part.includes(",")) {
            passage.chapter = 1
            passage.verses.push(...part.split(",").map((v) => v.trim()))
            passage.type = this.COMMA_SEPARATED
        } else {
            const num = Number(part)
            if (num > 0) {
                passage.chapter = 1
                passage.verses.push(num)
                passage.type = this.CHAPTER_VERSE
            }
        }
    }

    /**
     * Parses range references (e.g., "1-3").
     * @param {Object} passage - The passage object.
     * @param {string} part - The reference part.
     * @param {boolean} isFirstPart - Whether this is the first part.
     * @private
     */
    parseRange(passage, part, isFirstPart) {
        if (!passage.chapter && isFirstPart) {
            const [start, end] = part.split("-").map(Number)
            passage.chapter = start
            const startVerses = this.getChapterVerses(passage.book, start)
            passage.verses = [`${startVerses[0]}-${startVerses[startVerses.length - 1]}`]
            passage.to = {
                book: passage.book,
                chapter: end,
                verses: [
                    `${this.getChapterVerses(passage.book, end)[0]}-${
                        this.getChapterVerses(passage.book, end).slice(-1)[0]
                    }`,
                ],
            }
            passage.type = this.CHAPTER_RANGE
        } else {
            passage.verses.push(part)
            passage.type = this.CHAPTER_VERSE_RANGE
        }
    }

    /**
     * Parses single number references (e.g., "3" for chapter or verse).
     * @param {Object} passage - The passage object.
     * @param {string} part - The reference part.
     * @param {boolean} isFirstPart - Whether this is the first part.
     * @private
     */
    parseSingleNumber(passage, part, isFirstPart) {
        if (isFirstPart && !passage.chapter) {
            passage.chapter = Number(part)
            passage.type = this.SINGLE_CHAPTER
            const chapterVerses = this.getChapterVerses(passage.book, passage.chapter)
            if (chapterVerses.length) {
                passage.verses = [`${chapterVerses[0]}-${chapterVerses[chapterVerses.length - 1]}`]
            }
        } else {
            passage.verses.push(Number(part))
            passage.type = this.COMMA_SEPARATED
        }
    }

    /**
     * Handles multi-chapter range references (e.g., "3:16-4:5").
     * @param {Object} passage - The passage object.
     * @param {string} reference - The full reference string.
     * @private
     */
    handleMultiChapterRange(passage, reference) {
        const parts = reference.split(",")
        const lastPart = parts[parts.length - 1].trim()
        const [endChapter, endVerse] = lastPart.split(/[:.]/).map((s) => s.trim())
        if (endChapter !== String(passage.chapter)) {
            passage.to = {
                book: passage.book,
                chapter: Number(endChapter),
                verses: endVerse ? [endVerse] : ["1"],
            }
        }
    }

    /**
     * Generates a range of numbers.
     * @param {number} start - Start number.
     * @param {number} end - End number.
     * @returns {number[]} Array of numbers.
     * @private
     */
    _generateRange(start, end) {
        const range = []
        for (let i = start; i <= end; i++) {
            range.push(i)
        }
        return range
    }

    /**
     * Searches for versification differences for a book and chapter.
     * @param {string} book - The book name.
     * @param {number} chapter - The chapter number.
     * @param {string} version - The Bible version.
     * @returns {Object|undefined} Updated chapter verses or undefined.
     * @private
     */
    _searchVersificationDifferences(book, chapter, version) {
        version = version.toLowerCase()

        // Handle single-chapter book "Obadiah"
        if (book === "Obadiah") {
            const singleChapterBook = this.singleChapterBook.find((b) => Object.keys(b)[0] === "Obadiah")
            if (!singleChapterBook || !singleChapterBook[book][chapter]) {
                return // No data for Obadiah or chapter
            }
            if (!this.versificationDifferences[book]) {
                return // No versification differences for Obadiah
            }
            // Process versification differences
            for (const [key, value] of Object.entries(this.versificationDifferences[book])) {
                if (value[version].startsWith(`${chapter}:`)) {
                    if (value[version]) {
                        const verse = value[version].split(":")[1]
                        singleChapterBook[book][chapter].push(Number(verse))
                    }
                }
            }
            singleChapterBook[book][chapter] = Array.from(new Set(singleChapterBook[book][chapter]))
            return singleChapterBook[book]
        }

        // Handle all other books using chapterVerses
        if (!this.chapterVerses[book][chapter]) {
            return
        }
        if (!this.versificationDifferences[book]) {
            return
        }
        for (const [key, value] of Object.entries(this.versificationDifferences[book])) {
            if (value[version].startsWith(`${chapter}:`)) {
                if (value[version]) {
                    const verse = value[version].split(":")[1]
                    this.chapterVerses[book][chapter].push(Number(verse))
                }
            }
        }
        this.chapterVerses[book][chapter] = Array.from(new Set(this.chapterVerses[book][chapter]))
        return this.chapterVerses
    }

    /**
     * Sets the Bible version and applies versification differences.
     * @param {string} book - The book name.
     * @param {number} chapter - The chapter number.
     * @param {string} version - The Bible version.
     * @private
     */
    _setVersion(book, chapter, version) {
        this.version = version ? version : "eng"
        if (this.version !== "eng") {
            this._searchVersificationDifferences(book, chapter, version)
        }
    }

    /**
     * Applies versification differences to parsed passages.
     */
    versification() {
        this.passages.forEach((passage) => {
            const hasVersification = this.versificationDifferences[passage.book]
            passage.passages.forEach((subPassage) => {
                if (hasVersification) {
                    const key = `${subPassage.chapter}:${subPassage.verse}`
                    if (this.versificationDifferences[passage.book][key]) {
                        subPassage.versification = this.versificationDifferences[passage.book][key]
                    }
                }
                if (passage.version) {
                    const versionAbbreviation = passage.version.abbreviation
                    const versionType =
                        versionAbbreviation === "lxx" ? "lxx" : versionAbbreviation === "mt" ? "mt" : null
                    if (versionType) {
                        const versionReference = `${subPassage.chapter}:${subPassage.verse}`
                        for (const versification in this.versificationDifferences[passage.book]) {
                            if (
                                this.versificationDifferences[passage.book][versification][versionType] ===
                                versionReference
                            ) {
                                subPassage.versification = this.versificationDifferences[passage.book][versification]
                                break
                            }
                        }
                    }
                }
            })
        })
    }

    /**
     * Populates passage with expanded verse objects.
     * @param {Object} passage - The passage object.
     * @returns {Object[]} Array of verse objects.
     */
    populate(passage) {
        const { book, chapter, verses, type, to } = passage
        const version = passage.version?.abbreviation || "eng"
        this._setVersion(book, chapter, version)

        if (type === this.SINGLE_CHAPTER) {
            const chapterVerses = this.getChapterVerses(book, chapter)
            return this.expandVerses(book, chapter, [`${chapterVerses[0]}-${chapterVerses[chapterVerses.length - 1]}`])
        }

        if (type === this.CHAPTER_VERSE || type === this.COMMA_SEPARATED || type === this.CHAPTER_VERSE_RANGE) {
            return this.expandVerses(book, chapter, verses)
        }

        if (type === this.CHAPTER_RANGE) {
            const passages = []
            if (to && to.chapter) {
                for (let ch = chapter; ch <= to.chapter; ch++) {
                    const chapterVerses = this.getChapterVerses(book, ch)
                    passages.push(
                        ...this.expandVerses(book, ch, [
                            `${chapterVerses[0]}-${chapterVerses[chapterVerses.length - 1]}`,
                        ])
                    )
                }
            }
            return passages
        }

        if (type === this.MULTI_CHAPTER_RANGE) {
            const passages = []
            const startVerse = verses[0]?.includes("-") ? Number(verses[0].split("-")[0]) : Number(verses[0]) || 1
            const endVerse = to?.verses?.[0]?.includes("-")
                ? Number(to.verses[0].split("-")[1])
                : Number(to?.verses?.[0]) || 1
            const endChapter = to?.chapter || chapter

            for (let ch = chapter; ch <= endChapter; ch++) {
                const chapterVerses = this.getChapterVerses(book, ch)
                const from = ch === chapter ? startVerse : chapterVerses[0]
                const toVerse = ch === endChapter ? endVerse : chapterVerses[chapterVerses.length - 1]
                passages.push(...this.expandVerses(book, ch, [`${from}-${toVerse}`]))
            }
            return passages
        }

        return []
    }

    /**
     * Expands verse references into individual verse objects.
     * @param {string} book - The book name.
     * @param {number} chapter - The chapter number.
     * @param {Array<string|number>} verses - Array of verses or ranges.
     * @returns {Object[]} Array of verse objects.
     */
    expandVerses(book, chapter, verses) {
        const passages = []
        const chapterVerses = this.getChapterVerses(book, chapter)

        verses.forEach((verse) => {
            if (typeof verse === "string" && verse.includes("-")) {
                const [start, end] = verse.split("-").map(Number)
                for (let i = start; i <= end && i <= chapterVerses[chapterVerses.length - 1]; i++) {
                    passages.push({ book, chapter, verse: i })
                }
            } else {
                const verseNum = Number(verse)
                if (!isNaN(verseNum) && verseNum > 0) {
                    passages.push({ book, chapter, verse: verseNum })
                }
            }
        })
        return passages
    }

    /**
     * Normalizes book names using abbreviations or full names.
     * @param {string|Array} book - The book name or array.
     * @returns {string} Normalized book name.
     */
    bookify(book) {
        if (typeof book !== "string") {
            book = book[0]
        }
        book = book.toLowerCase()
        let bookified = this.abbreviations[Object.keys(this.abbreviations).find((abbr) => abbr.toLowerCase() === book)]
        if (bookified) {
            return bookified
        }
        bookified =
            this.bible.new.find((b) => b.toLowerCase() === book) || this.bible.old.find((b) => b.toLowerCase() === book)
        return bookified || book
    }

    /**
     * Returns parsed passages with utility methods.
     * @returns {Object[]} Array of passages with methods.
     */
    getPassages() {
        const passagesArray = [...this.passages]

        passagesArray.first = function () {
            return this.length > 0 ? this[0] : null
        }

        passagesArray.oldTestament = function () {
            return this.filter((passage) => passage.testament === "old")
        }

        passagesArray.newTestament = function () {
            return this.filter((passage) => passage.testament === "new")
        }

        passagesArray.combine = function (options = {}) {
            const { book = true, chapter = true } = options

            if (!book) {
                return [...this]
            }

            const parser = new CodexParser()
            const groupedByBook = new Map()

            this.forEach((passage) => {
                const bookKey = passage.book
                if (!groupedByBook.has(bookKey)) {
                    groupedByBook.set(bookKey, [])
                }
                groupedByBook.get(bookKey).push(passage)
            })

            const combinedPassages = []

            for (const [book, bookPassages] of groupedByBook) {
                if (chapter) {
                    const groupedByChapter = new Map()
                    bookPassages.forEach((passage) => {
                        const chapterKey = `${passage.book}-${passage.chapter}`
                        if (!groupedByChapter.has(chapterKey)) {
                            groupedByChapter.set(chapterKey, [])
                        }
                        groupedByChapter.get(chapterKey).push(passage)
                    })

                    for (const passages of groupedByChapter.values()) {
                        if (passages.length === 1) {
                            combinedPassages.push({ ...passages[0] })
                        } else {
                            const combined = parser.combine(passages)
                            combinedPassages.push(combined)
                        }
                    }
                } else {
                    const combined = parser.combine(bookPassages)
                    combinedPassages.push(combined)
                }
            }

            return combinedPassages
        }

        return passagesArray
    }

    /**
     * Returns the first parsed passage.
     * @returns {Object|null} The first passage or null.
     */
    first() {
        return this.passages.length > 0 ? this.passages[0] : null
    }

    /**
     * Formats a passage into a human-readable reference.
     * @param {Object} passage - The passage object.
     * @returns {Object} Formatted passage data.
     */
    scripturize(passage) {
        const formatChapterVerse = (chapter, verses) => {
            if (!chapter || !verses || verses.length === 0) return ""
            if (verses.length === 1) {
                return `${chapter}:${verses[0]}`
            }
            const isRange = verses.every((v, i, arr) => i === 0 || Number(v) === Number(arr[i - 1]) + 1)
            if (isRange) {
                return `${chapter}:${verses[0]}-${verses[verses.length - 1]}`
            }
            return `${chapter}:${verses.join(",")}`
        }

        let combined = `${passage.book}`
        if (passage.type === "multi_chapter_verse_range" && passage.to) {
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}-${formatChapterVerse(
                passage.to.chapter,
                passage.to.verses
            )}`
        } else if (passage.type === "chapter_verse_range" || passage.type === "comma_separated_verses") {
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}`
        } else if (passage.type === "chapter_range" && passage.to) {
            combined += ` ${passage.chapter}-${passage.to.chapter}`
        } else {
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}`
        }

        const cv = passage.to
            ? `${formatChapterVerse(passage.chapter, passage.verses)}-${formatChapterVerse(
                  passage.to.chapter,
                  passage.to.verses
              )}`
            : formatChapterVerse(passage.chapter, passage.verses)

        const hash = `${passage.book.toLowerCase()}_${cv.replace(/:/g, ".").replace(/-/g, ".")}`

        return {
            passage: combined,
            cv: cv,
            hash: hash,
        }
    }

    /**
     * Combines multiple passages into a single reference.
     * @param {Object[]} [passages=this.passages] - Array of passages to combine.
     * @returns {Object} Combined passage object.
     */
    combine(passages = this.passages) {
        if (!passages || passages.length === 0) {
            throw new Error("No passages provided to join.")
        }

        const uniqueBooks = [...new Set(passages.map((p) => p.book))]
        if (uniqueBooks.length > 1) {
            throw new Error("Passages must be from the same book to join.")
        }

        const combined = {
            ...passages[0],
            verses: [],
            passages: [],
            to: null,
            scripture: {},
            type: null,
            start: null,
            end: null,
        }

        const chapterVerses = {}
        let firstChapter = null
        let lastChapter = null
        let firstVerse = null
        let lastVerse = null

        passages.forEach((passage) => {
            passage.passages.forEach((p) => {
                if (!chapterVerses[p.chapter]) {
                    chapterVerses[p.chapter] = new Set()
                }
                chapterVerses[p.chapter].add(p.verse)
                combined.passages.push(p)

                if (firstChapter === null || p.chapter < firstChapter) {
                    firstChapter = p.chapter
                    firstVerse = p.verse
                } else if (p.chapter === firstChapter && (firstVerse === null || p.verse < firstVerse)) {
                    firstVerse = p.verse
                }
                if (lastChapter === null || p.chapter > lastChapter) {
                    lastChapter = p.chapter
                    lastVerse = p.verse
                } else if (p.chapter === lastChapter && (lastVerse === null || p.verse > lastVerse)) {
                    lastVerse = p.verse
                }
            })
        })

        combined.passages = Array.from(new Set(combined.passages.map(JSON.stringify))).map(JSON.parse)

        const chapterStrings = []
        const sortedChapters = Object.keys(chapterVerses)
            .map(Number)
            .sort((a, b) => a - b)

        sortedChapters.forEach((chapter) => {
            const verses = Array.from(chapterVerses[chapter])
                .map(Number)
                .filter((verse) => verse > 0)
                .sort((a, b) => a - b)
            if (verses.length > 0) {
                const mergedVerses = this.mergeRanges(verses)
                chapterStrings.push(`${chapter}:${mergedVerses.join(",")}`)
                if (chapter === firstChapter) {
                    combined.verses = mergedVerses
                }
            }
        })

        if (chapterStrings.length === 0) {
            throw new Error("No valid verses found in passages.")
        }

        if (firstChapter !== lastChapter) {
            combined.type = this.MULTI_CHAPTER_RANGE
            combined.to = {
                book: combined.book,
                chapter: lastChapter,
                verses: this.mergeRanges(Array.from(chapterVerses[lastChapter]).filter((verse) => verse > 0)),
            }
            combined.original = `${combined.book} ${chapterStrings.join("; ")}`
        } else {
            combined.type = combined.verses.length > 1 ? this.CHAPTER_VERSE_RANGE : this.CHAPTER_VERSE
            combined.original = `${combined.book} ${chapterStrings[0]}`
        }

        const chapterString = chapterStrings.join(";")
        combined.scripture = {
            passage: `${combined.book} ${chapterString}`,
            cv: chapterString,
            hash: `${combined.book.toLowerCase()}_${chapterString.replace(/:/g, ".").replace(/[,;]/g, ".")}`,
        }

        combined.start = {
            book: combined.book,
            chapter: firstChapter,
            verse:
                firstVerse > 0
                    ? firstVerse
                    : Math.min(...Array.from(chapterVerses[firstChapter]).filter((verse) => verse > 0)),
        }
        combined.end = {
            book: combined.book,
            chapter: lastChapter,
            verse:
                lastVerse > 0
                    ? lastVerse
                    : Math.max(...Array.from(chapterVerses[lastChapter]).filter((verse) => verse > 0)),
        }

        combined.reference = function () {
            return this.scripture.passage
        }

        if (combined.to === null) {
            delete combined.to
        }

        return combined
    }

    /**
     * Merges verses into ranges or comma-separated lists.
     * @param {number[]} verses - Array of verse numbers.
     * @returns {string[]} Array of verse strings.
     */
    mergeRanges(verses) {
        const sortedVerses = [...new Set(verses)].sort((a, b) => a - b)
        const merged = []
        let start = sortedVerses[0]
        let end = sortedVerses[0]

        for (let i = 1; i < sortedVerses.length; i++) {
            if (sortedVerses[i] === end + 1) {
                end = sortedVerses[i]
            } else {
                if (start === end) {
                    merged.push(`${start}`)
                } else {
                    merged.push(`${start}-${end}`)
                }
                start = sortedVerses[i]
                end = sortedVerses[i]
            }
        }

        if (start === end) {
            merged.push(`${start}`)
        } else {
            merged.push(`${start}-${end}`)
        }

        return merged
    }

    /**
     * Generates a table of contents for the Bible.
     * @param {string} [version="ESV"] - The Bible version.
     * @returns {Object} TOC with book-chapter-verse mappings.
     */
    getToc(version = "ESV") {
        const toc = {}
        this.bible.old.forEach((book) => {
            if (this.chapterVerses[book]) {
                toc[book] = this.chapterVerses[book]
            }
        })
        this.bible.new.forEach((book) => {
            if (this.chapterVerses[book]) {
                toc[book] = this.chapterVerses[book]
            }
        })
        this.singleChapterBook.forEach((item) => {
            Object.keys(item).forEach((book) => {
                if (!toc[book]) {
                    toc[book] = item[book]
                }
            })
        })
        const orderedToc = {}
        const canonicalOrder = [...this.bible.old, ...this.bible.new]
        canonicalOrder.forEach((book) => {
            if (toc[book]) {
                orderedToc[book] = toc[book]
            }
        })
        return orderedToc
    }

    /**
     * Validates a passage for correctness.
     * @param {Object} passage - The passage object.
     * @param {string} reference - The original reference.
     * @returns {boolean|Object} True if valid, error object if invalid.
     * @private
     */
    _isValid(passage, reference) {
        const { book, chapter, verses, type } = passage

        if (!verses.length && type !== this.SINGLE_CHAPTER) {
            return this.validationError(101, `Possible invalid chapter: ${reference}`)
        }

        const chapterVerses = this.getChapterVerses(book, chapter)
        if (!chapterVerses.length) {
            return this.validationError(102, `Chapter ${chapter} does not exist in ${book}`)
        }

        if (type === this.SINGLE_CHAPTER) {
            const [range] = verses
            if (range) {
                const [start, end] = range.split("-").map(Number)
                if (start < 1 || end > chapterVerses[chapterVerses.length - 1]) {
                    return this.validationError(
                        104,
                        `Verse range ${start}-${end} exceeds available verses (1-${
                            chapterVerses[chapterVerses.length - 1]
                        }) in ${book} ${chapter}`
                    )
                }
            }
            return true
        }

        return this.validateVerses(book, chapter, verses, reference)
    }

    /**
     * Validates verse numbers for a chapter.
     * @param {string} book - The book name.
     * @param {number} chapter - The chapter number.
     * @param {Array<string|number>} verses - Array of verses or ranges.
     * @param {string} reference - The original reference.
     * @returns {boolean|Object} True if valid, error object if invalid.
     * @private
     */
    validateVerses(book, chapter, verses, reference) {
        const chapterVerses = this.getChapterVerses(book, chapter)
        for (const verse of verses) {
            const verseRange = String(verse)
            const verseNumbers = verseRange.includes("-")
                ? Array.from(
                      { length: Number(verseRange.split("-")[1]) - Number(verseRange.split("-")[0]) + 1 },
                      (_, i) => Number(verseRange.split("-")[0]) + i
                  )
                : [Number(verseRange)]

            for (const v of verseNumbers) {
                if (isNaN(v) || v <= 0 || !chapterVerses.includes(v)) {
                    return this.validationError(104, `Verse number ${v} does not exist in ${book} ${chapter}`)
                }
            }
        }
        return true
    }

    /**
     * Creates an error object for validation failures.
     * @param {number} code - Error code.
     * @param {string} message - Error message.
     * @returns {Object} Error object.
     * @private
     */
    validationError(code, message) {
        return {
            error: true,
            code,
            message: { verse_exists: code === 104, chapter_exists: code !== 104, content: message },
        }
    }

    /**
     * Determines the Bible version for a passage.
     * @param {string} version - The version (e.g., "lxx").
     * @param {string} testament - The testament ("old" or "new").
     * @returns {Object} Version object.
     * @private
     */
    _handleVersion(version, testament) {
        const effectiveVersion = this.version || version || "eng"
        const lowerVersion = effectiveVersion.toLowerCase()

        if (lowerVersion === "lxx" && testament === "old") {
            return { name: "Septuagint", value: "LXX", abbreviation: "lxx" }
        }
        if (lowerVersion === "mt" && testament === "old") {
            return { name: "Masoretic Text", value: "MT", abbreviation: "mt" }
        }
        return { name: "English", value: "ENG", abbreviation: "eng" }
    }

    /**
     * Replaces scripture references in text with formatted references.
     * @param {string} text - The original text.
     * @param {boolean} useAbbreviations - Whether to use abbreviated book names.
     * @returns {string} Text with replaced references.
     */
    replace(text, useAbbreviations = true) {
        if (!this.passages.length) {
            return text
        }

        let result = text
        for (let i = this.passages.length - 1; i >= 0; i--) {
            const passage = this.passages[i]
            const { originalText, abbr, original } = passage
            const newReference = useAbbreviations ? abbr : original

            const regex = new RegExp(`${originalText.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")}`, "g")

            const matches = [...result.matchAll(regex)]
            if (matches.length > 0) {
                for (let j = matches.length - 1; j >= 0; j--) {
                    const match = matches[j]
                    const startIndex = match.index
                    const endIndex = startIndex + match[0].length
                    const leadingSpace = match[1] || ""
                    const hasOpeningParen = match[2] === "("
                    const hasClosingParen = match[3] === ")"
                    const trailingSpace = match[4] || " "
                    const replacement =
                        hasOpeningParen && hasClosingParen
                            ? `${leadingSpace}(${newReference})${trailingSpace}`
                            : `${leadingSpace}${newReference}${trailingSpace}`
                    result = result.slice(0, startIndex) + replacement + result.slice(endIndex)
                }
            }
        }

        return result
    }

    /**
     * Checks if all references in the passages array are from the same book.
     * @returns {boolean} True if all passages are from the same book, false otherwise.
     */
    same() {
        if (this.passages.length <= 1) {
            return true
        }

        const firstBook = this.passages[0].book.toLowerCase()
        return this.passages.every((passage) => passage.book.toLowerCase() === firstBook)
    }
}

module.exports = CodexParser
