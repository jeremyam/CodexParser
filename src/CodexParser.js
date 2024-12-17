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
                            type =
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
                type: passage.type, // Set type based on reference
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
                            parsedPassage.type =
                                endChapter !== startChapter ? "multi_chapter_verse_range" : "chapter_verse_range" // Set type to chapter range
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
        if (!this.chapterVerses[book][chapter]) return

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
        const { book, chapter, verses, type, to } = parsedPassage

        this._setVersion(parsedPassage) // Set version data if needed

        if (type === "single_chapter") {
            // Handle entire chapter references
            if (this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
                this.chapterVerses[book][chapter].forEach((verse) => {
                    passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                })
            }
        } else if (type === "comma_separated_verses") {
            // Handle explicitly mentioned verses (e.g., 3:1,3,6)
            if (this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
                verses.forEach((verse) => {
                    passages.push({ book, chapter: Number(chapter), verse: Number(verse) })
                })
            }
        } else if (type === "chapter_range") {
            // Handle ranges of chapters (e.g., 3-5)
            for (let currentChapter = chapter; currentChapter <= to.chapter; currentChapter++) {
                if (this.chapterVerses[book] && this.chapterVerses[book][currentChapter]) {
                    this.chapterVerses[book][currentChapter].forEach((verse) => {
                        passages.push({ book, chapter: currentChapter, verse: Number(verse) })
                    })
                }
            }
        } else if (type === "multi_chapter_verse_range") {
            // Handle multi-chapter verse ranges (e.g., 3:1-5:6)

            const startChapter = chapter
            const startVerse = verses[0]
            const endChapter = to.chapter
            const endVerse = to.verses[to.verses.length - 1]

            for (let currentChapter = startChapter; currentChapter <= endChapter; currentChapter++) {
                const chapterVerses = this.chapterVerses[book][currentChapter]
                if (!chapterVerses) continue

                // Determine start and end verses for each chapter
                const chapterStartVerse = currentChapter === startChapter ? startVerse : 1
                const chapterEndVerse =
                    currentChapter === endChapter ? endVerse : chapterVerses[chapterVerses.length - 1]

                for (let verse = chapterStartVerse; verse <= chapterEndVerse; verse++) {
                    passages.push({ book, chapter: currentChapter, verse })
                }
            }
        } else if (type === "chapter_verse" || type === "chapter_verse_range") {
            // Handle single chapter:verse or chapter:verse ranges (e.g., 3:1 or 3:1-5)
            if (this.chapterVerses[book] && this.chapterVerses[book][chapter]) {
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
        } else if (type === "single_chapter_book_verse_range") {
            // Handle ranges in single-chapter books (e.g., Jude 5-7)
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
        // Helper to format a single chapter:verse combination
        const formatChapterVerse = (chapter, verseStart, verseEnd = null) => {
            if (!chapter) return ""
            if (!verseStart) return `${chapter}`
            return verseEnd ? `${chapter}:${verseStart}-${verseEnd}` : `${chapter}:${verseStart}`
        }

        // Initialize combined passage
        let combined = `${passage.book}`

        if (passage.type === "multi_chapter_verse_range") {
            // Multi-chapter verse range handling: first verse of first chapter to last verse of last chapter
            if (passage.to) {
                combined += ` ${formatChapterVerse(passage.chapter, passage.verses[0])}` // Start chapter:verse
                combined += `-${formatChapterVerse(
                    passage.to.chapter,
                    passage.to.verses[passage.to.verses.length - 1]
                )}` // End chapter:last verse
            }
        } else if (passage.type === "chapter_verse_range") {
            // Single-chapter verse range
            combined += ` ${formatChapterVerse(
                passage.chapter,
                passage.verses[0],
                passage.verses[passage.verses.length - 1]
            )}`
        } else if (passage.type === "comma_separated_verses") {
            // Comma-separated verses
            combined += ` ${passage.chapter}:${passage.verses.join(",")}`
        } else if (passage.type === "chapter_range") {
            // Chapter range
            combined += ` ${passage.startChapter}-${passage.endChapter}`
        } else {
            // Single chapter or single verse
            combined += ` ${formatChapterVerse(passage.chapter, passage.verses[0])}`
        }

        // Generate chapter:verse for current and "to" objects
        const cv = passage.to
            ? `${formatChapterVerse(passage.chapter, passage.verses[0])}-${formatChapterVerse(
                  passage.to.chapter,
                  passage.to.verses[passage.to.verses.length - 1]
              )}`
            : formatChapterVerse(passage.chapter, passage.verses[0])

        // Generate a hash for the passage
        const hash = `${passage.book.toLowerCase()}_${cv.replace(/:/g, "_").replace(/-/g, "_")}`

        return {
            passage: combined, // Reconstructed passage
            cv: cv, // Chapter:verse range
            hash: hash, // Unique hash
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
        // Only check if passages are from the same book)
        const sameBook = [...new Set(passages.map((p) => p.book))]
        if (sameBook.length > 1) {
            throw new Error("Passages are not from the same book.")
        }

        const newPassages = []

        passages.forEach((passageSet) => {
            passageSet.passages.forEach((passage) => {
                if (passage.versification) {
                    newPassages.push(passage.book + " " + passage.versification[this.version])
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
