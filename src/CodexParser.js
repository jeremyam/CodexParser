const versified = require("./versified")
const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbrevations = require("./abbr")
const dump = require("./functions").dump
const dd = require("./functions").dd
const sch = require("./functions").sch
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
            sch("Jude", 25),
            sch("2 John", 13),
            sch("3 John", 15),
            sch("Obadiah", 21),
            sch("Philemon", 25),
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

        // Preprocess input text: normalize separators while preserving abbreviations
        let normalizedText = text
            .replace(/\.(?=\d)/g, ":") // Convert periods before numbers into colons (e.g., 12.15 -> 12:15)
            .replace(/(\b[A-Za-z]+)\.(?=\s|$)/g, "$1") // Remove periods after abbreviations (e.g., Jd. -> Jd)
            .replace(/\s+/g, " ") // Normalize multiple spaces to a single space

        // Convert Bible book names, abbreviations, and input text to lowercase for case-insensitive matching
        const lowercaseBibleFullNames = fullNames.map((book) => book.toLowerCase())
        const lowercaseBibleAbbreviations = abbreviations.map((abbr) => abbr.toLowerCase())
        const lowerCaseText = normalizedText.toLowerCase()

        let i = 0

        const isValidChapterVerseChar = (char) => /[^A-Za-z]/.test(char)

        const isNextBibleBook = (startIndex) => {
            const textAfterCurrentPosition = lowerCaseText.substring(startIndex).trim()
            return (
                lowercaseBibleFullNames.some((book) => textAfterCurrentPosition.startsWith(book)) ||
                lowercaseBibleAbbreviations.some((abbr) => textAfterCurrentPosition.startsWith(abbr))
            )
        }

        const detectSuffix = (startIndex) => {
            const suffixMatch = normalizedText.substring(startIndex).match(/\b(LXX|MT)\b/i)
            return suffixMatch ? suffixMatch[0].toUpperCase() : null
        }

        while (i < lowerCaseText.length) {
            let foundBook = null
            let foundIndex = -1
            let matchedLength = 0

            for (let j = 0; j < lowercaseBibleFullNames.length; j++) {
                const book = lowercaseBibleFullNames[j]
                if (lowerCaseText.startsWith(book, i) && book.length > matchedLength) {
                    foundBook = fullNames[j]
                    foundIndex = i
                    matchedLength = book.length
                }
            }

            if (!foundBook) {
                for (let k = 0; k < lowercaseBibleAbbreviations.length; k++) {
                    const abbreviation = lowercaseBibleAbbreviations[k]
                    if (lowerCaseText.startsWith(abbreviation, i) && abbreviation.length > matchedLength) {
                        foundBook = this.abbreviations[abbreviations[k]]
                        foundIndex = i
                        matchedLength = abbreviation.length
                    }
                }
            }

            if (foundBook) {
                i += matchedLength
                let chapterVerse = ""
                const references = []

                while (i < normalizedText.length && isValidChapterVerseChar(normalizedText[i])) {
                    if (isNextBibleBook(i)) break

                    if (normalizedText[i] === ";") {
                        const formattedReference = chapterVerse.trim().replace(/[^a-zA-Z0-9]+$/, "")
                        if (formattedReference) references.push(formattedReference)
                        chapterVerse = ""
                        i++
                        continue
                    }

                    chapterVerse += normalizedText[i]
                    i++
                }

                if (chapterVerse.trim().length > 0) {
                    const formattedReference = chapterVerse.trim().replace(/[^a-zA-Z0-9]+$/, "")
                    if (formattedReference) references.push(formattedReference)
                }

                const suffix = detectSuffix(i)

                references.forEach((ref) => {
                    let type
                    if (ref.includes(":")) {
                        if (ref.includes("-")) {
                            const [start, end] = ref.split("-")
                            const startParts = start.split(":")
                            const endParts = end.split(":")

                            // Determine type based on the chapter (startParts[0] and endParts[0])
                            type =
                                startParts.length > 1 &&
                                endParts.length > 1 &&
                                startParts[0].trim() !== endParts[0].trim()
                                    ? "multi_chapter_verse_range" // Chapters differ
                                    : "chapter_verse_range" // Same chapter
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

                    this.found.push({
                        book: foundBook,
                        reference: ref,
                        index: foundIndex,
                        version: suffix || null,
                        type,
                    })
                })
            } else {
                i++
            }
        }

        return this
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
        this.scan(reference) // Populate this.found

        this.passages = this.found.map((passage) => {
            const book = this.bookify(passage.book)
            const testament = this.bible.old.includes(book) ? "old" : "new"
            const singleChapterBook = this.singleChapterBook.find((b) => Object.keys(b)[0] === book)
            const parsedPassage = {
                original: passage.book + " " + passage.reference,
                book: book,
                chapter: null,
                verses: [],
                type: passage.type,
                testament: testament,
                index: passage.index,
                version: this._handleVersion(passage.version, testament),
            }

            // Split reference into parts (e.g., "2 John 1", "2 John 2", "2 John 1:1-3,5")
            const parts = passage.reference.split(",")

            parts.forEach((part, partIndex) => {
                part = part.trim()

                if (part.includes(":")) {
                    // Explicit chapter:verse (e.g., "1:1-3")
                    const [chapterPart, versePart] = part.split(":")
                    if (partIndex === 0) {
                        parsedPassage.chapter = Number(chapterPart) // Set chapter only on first part
                    }

                    if (versePart.includes("-")) {
                        parsedPassage.verses.push(versePart) // Add range (e.g., "1-3")
                    } else {
                        parsedPassage.verses.push(Number(versePart)) // Add single verse
                    }
                    parsedPassage.type = versePart.includes("-") ? "chapter_verse_range" : "chapter_verse"
                } else if (singleChapterBook) {
                    // Handle single-chapter books
                    const verseCount = singleChapterBook[book][1].length
                    if (part === "1" && parts.length === 1 && partIndex === 0) {
                        // "2 John 1" means the whole chapter
                        parsedPassage.chapter = 1
                        parsedPassage.type = "single_chapter"
                        parsedPassage.verses = [`1-${verseCount}`] // e.g., "1-13"
                    } else if (part.includes("-")) {
                        // "2 John 3-5" → "2 John 1:3-5"
                        parsedPassage.chapter = 1
                        parsedPassage.verses.push(part) // e.g., "3-5"
                        parsedPassage.type = "chapter_verse_range"
                    } else {
                        // "2 John 2" → "2 John 1:2"
                        const num = Number(part)
                        if (num > 1 || (num === 1 && parts.length > 1)) {
                            parsedPassage.chapter = 1
                            parsedPassage.verses.push(num) // Treat as verse number
                            parsedPassage.type = "chapter_verse"
                        }
                    }
                } else if (part.includes("-") && !parsedPassage.chapter) {
                    // Range without chapter for multi-chapter books (e.g., "Isaiah 3-5")
                    const [start, end] = part.split("-").map(Number)
                    parsedPassage.chapter = start
                    parsedPassage.verses = [
                        `${this.chapterVerses[book][start][0]}-${this.chapterVerses[book][start].slice(-1)[0]}`,
                    ]
                    parsedPassage.to = {
                        book,
                        chapter: end,
                        verses: [`${this.chapterVerses[book][end][0]}-${this.chapterVerses[book][end].slice(-1)[0]}`],
                    }
                    parsedPassage.type = "chapter_range"
                } else if (part.includes("-")) {
                    // Verse range in current chapter (e.g., "8-9" after "40:3-5")
                    parsedPassage.verses.push(part)
                    parsedPassage.type = "chapter_verse_range"
                } else {
                    // Single number (chapter or verse) for multi-chapter books
                    if (partIndex === 0 && !parsedPassage.chapter) {
                        parsedPassage.chapter = Number(part)
                        parsedPassage.type = "single_chapter"
                    } else {
                        parsedPassage.verses.push(Number(part))
                        parsedPassage.type = "comma_separated_verses"
                    }
                }
            })

            // Populate passages and scripture after processing all parts
            parsedPassage.passages = this.populate(parsedPassage)
            parsedPassage.scripture = this.scripturize(parsedPassage)
            parsedPassage.valid = this._isValid(parsedPassage, passage.reference)

            // Handle multi-chapter range if applicable
            if (
                parsedPassage.type === "multi_chapter_verse_range" &&
                parts.some((p) => p.includes(":") && p.split(":")[0] !== String(parsedPassage.chapter))
            ) {
                const lastPart = parts[parts.length - 1]
                const [endChapter, endVerse] = lastPart.split(":")
                parsedPassage.to = {
                    book: book,
                    chapter: Number(endChapter),
                    verses: endVerse.includes("-") ? [endVerse] : [Number(endVerse)],
                }
            } else {
                delete parsedPassage.to // Remove erroneous 'to' property
            }

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

    _searchVersificationDifferences(book, chapter, version) {
        version = version.toLowerCase()
        if (!this.chapterVerses[book][chapter]) return
        if (!this.versificationDifferences[book]) return
        // Loop through each key-value pair in the dictionary
        for (const [key, value] of Object.entries(this.versificationDifferences[book])) {
            // Check if the key starts with the desired chapter
            if (value[version].startsWith(`${chapter}:`)) {
                // Ensure the version exists in the value object
                if (value[version]) {
                    // Extract the verse number from the value
                    const verse = value[version].split(":")[1]
                    this.chapterVerses[book][chapter].push(Number(verse))
                }
            }
        }
        this.chapterVerses[book][chapter] = Array.from(this.chapterVerses[book][chapter])
        return this.chapterVerses // Return the array of verses
    }

    _setVersion(book, chapter, version) {
        this.version = version ? version : "eng"

        if (this.version !== "eng") {
            this._searchVersificationDifferences(book, chapter, version)
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
     * Populate all verses from a parsed passage, including all verses in ranges or chapters.
     *
     * @param {Object} parsedPassage - The parsed passage object containing book, chapter, and verses information.
     * @return {Array} An array of passage objects with individual verses.
     */
    populate(parsedPassage) {
        const passages = []
        const { book, chapter, verses, type, to } = parsedPassage
        const version = parsedPassage.version ? parsedPassage.version.abbreviation : "eng"
        this._setVersion(book, chapter, version) // Set version data if needed

        const singleChapterBook = this.singleChapterBook.find((b) => Object.keys(b)[0] === book)

        if (type === "single_chapter") {
            // Handle entire chapter references (e.g., "Isaiah 40" or "2 John 1")
            if (singleChapterBook) {
                // Single-chapter book: populate all verses from singleChapterBook
                const verseCount = singleChapterBook[book][1].length
                for (let verse = 1; verse <= verseCount; verse++) {
                    passages.push({ book, chapter: 1, verse })
                }
            } else if (this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
                // Multi-chapter book: populate all verses in the chapter
                this.chapterVerses[book][chapter].forEach((verse) => {
                    passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                })
            }
        } else if (type === "comma_separated_verses" || type === "chapter_verse_range") {
            // Handle comma-separated verses or single-chapter verse ranges (e.g., "Isaiah 40:3-5,8-9" or "2 John 1:1-3")
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
        } else if (type === "chapter_range") {
            // Handle ranges of chapters (e.g., "Isaiah 3-5")
            for (let currentChapter = chapter; currentChapter <= to.chapter; currentChapter++) {
                if (this.chapterVerses[book] && this.chapterVerses[book][currentChapter]) {
                    this.chapterVerses[book][currentChapter].forEach((verse) => {
                        passages.push({ book, chapter: Number(currentChapter), verse: Number(verse) })
                    })
                }
            }
        } else if (type === "multi_chapter_verse_range") {
            // Handle multi-chapter verse ranges (e.g., "Isaiah 3:1-5:6")
            const startChapter = chapter
            const startVerse = verses[0].includes("-") ? Number(verses[0].split("-")[0]) : Number(verses[0])
            const endChapter = to.chapter
            const endVerse = to.verses[0].includes("-") ? Number(to.verses[0].split("-")[1]) : Number(to.verses[0])

            for (let currentChapter = startChapter; currentChapter <= endChapter; currentChapter++) {
                const chapterVerses = this.chapterVerses[book][currentChapter]
                if (!chapterVerses) continue

                const chapterStartVerse = currentChapter === startChapter ? startVerse : chapterVerses[0]
                const chapterEndVerse =
                    currentChapter === endChapter ? endVerse : chapterVerses[chapterVerses.length - 1]

                for (let verse = chapterStartVerse; verse <= chapterEndVerse; verse++) {
                    passages.push({ book, chapter: currentChapter, verse })
                }
            }
        } else if (type === "chapter_verse") {
            // Handle single chapter:verse references (e.g., "2 John 1:1")
            verses.forEach((verse) => {
                passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
            })
        } else if (type === "single_chapter_book_verse_range") {
            // Handle ranges in single-chapter books (e.g., "Jude 5-7")
            const [startVerse, endVerse] = verses[0].split("-").map(Number)
            for (let i = startVerse; i <= endVerse; i++) {
                passages.push({ book, chapter: 1, verse: i })
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
        // Helper function to format a single chapter:verse combination
        const formatChapterVerse = (chapter, verses) => {
            if (!chapter || !verses || verses.length === 0) return ""
            if (verses.length === 1) {
                return `${chapter}:${verses[0]}`
            }

            // Check if verses are continuous (e.g., [1, 2, 3, 4, 5] -> "1-5")
            const isRange = verses.every((v, i, arr) => i === 0 || v === arr[i - 1] + 1)

            if (isRange) {
                return `${chapter}:${verses[0]}-${verses[verses.length - 1]}`
            }

            // Comma-separated (e.g., [1, 3, 5] -> "1,3,5")
            return `${chapter}:${verses.join(",")}`
        }

        // Start constructing the passage string
        let combined = `${passage.book}`

        if (passage.type === "multi_chapter_verse_range" && passage.to) {
            // Multi-chapter verse range

            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}-${formatChapterVerse(
                passage.to.chapter,
                passage.to.verses
            )}`
        } else if (passage.type === "chapter_verse_range") {
            // Single-chapter verse range
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}`
        } else if (passage.type === "comma_separated_verses") {
            // Comma-separated verses
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}`
        } else if (passage.type === "chapter_range" && passage.to) {
            // Chapter range
            combined += ` ${passage.chapter}-${passage.to.chapter}`
        } else {
            // Single chapter or single verse
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses)}`
        }

        // Generate the chapter:verse (cv) string
        const cv = passage.to
            ? `${formatChapterVerse(passage.chapter, passage.verses)}-${formatChapterVerse(
                  passage.to.chapter,
                  passage.to.verses
              )}`
            : formatChapterVerse(passage.chapter, passage.verses)

        // Generate the hash
        const hash = `${passage.book.toLowerCase()}_${cv.replace(/:/g, ".").replace(/-/g, ".")}`

        // Return the final scripture object
        return {
            passage: combined,
            cv: cv,
            hash: hash,
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
        if (!passages || passages.length === 0) {
            throw new Error("No passages provided to join.")
        }

        // Ensure all passages are from the same book
        const uniqueBooks = [...new Set(passages.map((p) => p.book))]
        if (uniqueBooks.length > 1) {
            throw new Error("Passages must be from the same book to join.")
        }

        // Start with the base object
        const combined = {
            ...passages[0],
            verses: [],
            passages: [],
            to: null,
            scripture: {},
            type: null,
        }

        const chapterVerses = {}
        let firstChapter = null
        let lastChapter = null

        // Collect all verses and passages, grouped by chapter
        passages.forEach((passage) => {
            passage.passages.forEach((p) => {
                if (!chapterVerses[p.chapter]) {
                    chapterVerses[p.chapter] = new Set()
                }
                chapterVerses[p.chapter].add(p.verse)
                combined.passages.push(p) // Add individual passage
            })

            // Track first and last chapters
            const chapters = passage.passages.map((p) => p.chapter)
            if (!firstChapter || Math.min(...chapters) < firstChapter) {
                firstChapter = Math.min(...chapters)
            }
            if (!lastChapter || Math.max(...chapters) > lastChapter) {
                lastChapter = Math.max(...chapters)
            }
        })

        // Ensure unique and sorted passages
        combined.passages = Array.from(new Set(combined.passages.map(JSON.stringify))).map(JSON.parse)

        // Process chapter and verse data
        const chapterStrings = []
        const sortedChapters = Object.keys(chapterVerses)
            .map(Number)
            .sort((a, b) => a - b)

        sortedChapters.forEach((chapter) => {
            const verses = Array.from(chapterVerses[chapter]).sort((a, b) => a - b)
            const mergedVerses = this.mergeRanges(verses)
            chapterStrings.push(`${chapter}:${mergedVerses.join(",")}`)
            if (chapter === firstChapter) {
                combined.verses = mergedVerses // First chapter's verses
            }
        })

        // Handle multi-chapter ranges
        if (firstChapter !== lastChapter) {
            combined.type = "multi_chapter_verse_range"
            combined.to = {
                book: combined.book,
                chapter: lastChapter,
                verses: this.mergeRanges(Array.from(chapterVerses[lastChapter])),
            }
            combined.original = `${combined.book} ${firstChapter}:${combined.verses.join(
                ","
            )}; ${lastChapter}:${combined.to.verses.join(",")}`
        } else {
            // Single-chapter range or comma-separated
            if (combined.verses.length > 1) {
                combined.type = "chapter_verse_range"
            } else {
                combined.type = "chapter_verse"
            }
            combined.original = `${combined.book} ${firstChapter}:${combined.verses.join(",")}`
        }

        // Build the scripture property
        const chapterString = chapterStrings.join(";")
        combined.scripture = {
            passage: `${combined.book} ${chapterString}`,
            cv: chapterString,
            hash: `${combined.book.toLowerCase()}_${chapterString.replace(/:/g, ".").replace(/,|;/g, ".")}`,
        }
        if (combined.to === null) {
            delete combined.to
        }
        return combined
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
                // Push range or single verse
                if (start === end) {
                    merged.push(`${start}`)
                } else {
                    merged.push(`${start}-${end}`)
                }
                start = sortedVerses[i]
                end = sortedVerses[i]
            }
        }

        // Push the final range or single verse
        if (start === end) {
            merged.push(`${start}`)
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

    /**
     * Validates a parsed passage to ensure the chapter and verses exist.
     *
     * @param {Object} passage - The parsed passage object to validate.
     * @param {string} reference - The original reference string for error messaging.
     * @return {boolean|Object} True if valid, or an error object if invalid.
     */
    _isValid(passage, reference) {
        const singleChapterBook = this.singleChapterBook.find((b) => Object.keys(b)[0] === passage.book)

        // Check if verses exist at all
        if (!passage.verses || passage.verses.length === 0) {
            if (passage.type !== "single_chapter") {
                return {
                    error: true,
                    code: 101,
                    message: {
                        chapter_exists: false,
                        content: "Possible invalid chapter: " + reference,
                    },
                }
            }
        }

        // Handle single-chapter books
        if (singleChapterBook) {
            const verseCount = singleChapterBook[passage.book][1].length

            if (passage.chapter !== 1) {
                return {
                    error: true,
                    code: 103,
                    message: {
                        chapter_exists: false,
                        content: `Chapter ${passage.chapter} does not exist in ${passage.book}`,
                    },
                }
            }

            if (passage.type === "single_chapter") {
                // For "2 John 1", validate the full range
                const [range] = passage.verses // e.g., "1-13"
                if (range) {
                    const [start, end] = range.split("-").map(Number)
                    if (start < 1 || end > verseCount) {
                        return {
                            error: true,
                            code: 104,
                            message: {
                                verse_exists: false,
                                content: `Verse range ${start}-${end} exceeds available verses (1-${verseCount}) in ${passage.book} 1`,
                            },
                        }
                    }
                }
                return true // If no specific verses or range matches, it’s valid
            }

            // For specific verses in single-chapter books (e.g., "2 John 1:1-3")
            for (let i = 0; i < passage.verses.length; i++) {
                const verseRange = String(passage.verses[i])
                let versesToCheck = verseRange.includes("-") ? verseRange.split("-").map(Number) : [Number(verseRange)]

                if (versesToCheck.length === 2) {
                    const [start, end] = versesToCheck
                    versesToCheck = Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
                }

                for (const verse of versesToCheck) {
                    if (verse < 1 || verse > verseCount) {
                        return {
                            error: true,
                            code: 104,
                            message: {
                                verse_exists: false,
                                content: `Verse number ${verse} does not exist in ${passage.book} 1`,
                            },
                        }
                    }
                }
            }
            return true
        }

        // Handle multi-chapter books
        if (!this.chapterVerses[passage.book] || !this.chapterVerses[passage.book][passage.chapter]) {
            return {
                error: true,
                code: 102,
                message: {
                    chapter_exists: false,
                    content: `Chapter ${passage.chapter} does not exist in ${passage.book}`,
                },
            }
        }

        if (passage.type === "single_chapter") {
            return true // For multi-chapter books, whole chapter is valid if it exists
        }

        for (let i = 0; i < passage.verses.length; i++) {
            const passageVerses = String(passage.verses[i])
            let verses = passageVerses.includes("-") ? passageVerses.split("-").map(Number) : [Number(passageVerses)]

            if (verses.length === 2) {
                // Expand the range if there are two numbers
                verses = Array.from({ length: verses[1] - verses[0] + 1 }, (_, index) => verses[0] + index)
            }

            for (const verse of verses) {
                const isValidVerse =
                    this.chapterVerses[passage.book] &&
                    this.chapterVerses[passage.book][passage.chapter] &&
                    this.chapterVerses[passage.book][passage.chapter].includes(verse)

                if (!isValidVerse) {
                    return {
                        error: true,
                        code: 104,
                        message: {
                            verse_exists: false,
                            content: `Verse number ${verse} does not exist in ${passage.book} ${passage.chapter}`,
                        },
                    }
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
