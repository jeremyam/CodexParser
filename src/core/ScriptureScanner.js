/**
 * ScriptureScanner.js
 * Handles scanning text for scripture references
 */

const bible = require("../data/bible")
const abbreviations = require("../format/abbr")

/**
 * Scanner for finding scripture references in text
 */
class ScriptureScanner {
    #bible
    #abbreviations
    #config

    /**
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.#bible = bible
        this.#abbreviations = abbreviations
        this.#config = config
    }

    /**
     * Scans text for scripture references
     * @param {string} text - The text to scan
     * @returns {Array} Array of found references
     */
    scan(text) {
        const fullNames = [...this.#bible.old, ...this.#bible.new]
        const abbreviationKeys = Object.keys(this.#abbreviations)
        const found = []

        // Minimal normalization: fix periods before numbers, remove trailing periods
        const normalizedText = text.replace(/\.(?=\d)/g, ":").replace(/(\b[A-Za-z]+)\.(?=\s|$)/g, "$1")

        const lowercaseBibleFullNames = fullNames.map((book) => book.toLowerCase())
        const lowercaseBibleAbbreviations = abbreviationKeys.map((abbr) => abbr.toLowerCase())
        const lowerCaseText = normalizedText.toLowerCase()

        let i = 0

        while (i < lowerCaseText.length) {
            let foundBook = null
            let bookStartIndex = -1
            let matchedLength = 0

            // Skip whitespace and special characters before checking for book
            while (i < lowerCaseText.length && /[\s—-]/.test(lowerCaseText[i])) {
                i++
            }
            if (i >= lowerCaseText.length) break

            // Check for full book names
            for (let j = 0; j < lowercaseBibleFullNames.length; j++) {
                const book = lowercaseBibleFullNames[j]
                if (lowerCaseText.startsWith(book, i) && book.length > matchedLength) {
                    foundBook = fullNames[j]
                    bookStartIndex = i
                    matchedLength = book.length
                }
            }

            // Check for abbreviations
            if (!foundBook) {
                for (let k = 0; k < lowercaseBibleAbbreviations.length; k++) {
                    const abbreviation = lowercaseBibleAbbreviations[k]
                    if (lowerCaseText.startsWith(abbreviation, i) && abbreviation.length > matchedLength) {
                        foundBook = this.#abbreviations[abbreviationKeys[k]]
                        bookStartIndex = i
                        matchedLength = abbreviation.length
                    }
                }
            }

            if (foundBook) {
                i += matchedLength
                let chapterVerse = ""
                const references = []
                let refStartIndex = bookStartIndex
                let originalRefStartIndex = bookStartIndex

                while (i < normalizedText.length && this.#isValidChapterVerseChar(normalizedText[i])) {
                    if (this.#isNextBibleBook(i, lowerCaseText, lowercaseBibleFullNames, lowercaseBibleAbbreviations)) {
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
                    }
                }

                // Align indices with original text
                const originalBookText = text.slice(bookStartIndex, bookStartIndex + matchedLength)
                const originalBookStartIndex =
                    text.indexOf(originalBookText, bookStartIndex) !== -1
                        ? text.indexOf(originalBookText, bookStartIndex)
                        : bookStartIndex

                references.forEach(({ ref, start, end }) => {
                    const type = this.#determineReferenceType(ref)
                    const fullRefText = `${originalBookText} ${ref.replace(":", ".")}`
                    const suffixData = this.#detectSuffix(normalizedText, end)
                    const suffix = suffixData ? suffixData.suffix : null
                    let refEndIndex = end

                    if (suffixData) {
                        refEndIndex += suffixData.length
                        i += suffixData.length
                    }

                    // Map to original text
                    let originalStartIndex =
                        text.indexOf(fullRefText, originalRefStartIndex) !== -1
                            ? text.indexOf(fullRefText, originalRefStartIndex)
                            : originalBookStartIndex

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

                    found.push({
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

        return found
    }

    /**
     * Checks if character is valid for chapter/verse references
     * @private
     */
    #isValidChapterVerseChar(char) {
        return /[\d:,\-;\s]/.test(char)
    }

    /**
     * Checks if the next position starts another Bible book
     * @private
     */
    #isNextBibleBook(startIndex, lowerCaseText, lowercaseBibleFullNames, lowercaseBibleAbbreviations) {
        const textAfterCurrentPosition = lowerCaseText.substring(startIndex).trim()
        return (
            lowercaseBibleFullNames.some((book) => textAfterCurrentPosition.startsWith(book)) ||
            lowercaseBibleAbbreviations.some((abbr) => textAfterCurrentPosition.startsWith(abbr))
        )
    }

    /**
     * Detects version suffix (LXX, MT)
     * @private
     */
    #detectSuffix(text, startIndex) {
        const suffixMatch = text.substring(startIndex).match(/\b(LXX|MT)\b/i)
        return suffixMatch ? { suffix: suffixMatch[0].toUpperCase(), length: suffixMatch[0].length } : null
    }

    /**
     * Determines the type of scripture reference
     * @private
     */
    #determineReferenceType(ref) {
        if (ref.includes(":")) {
            if (ref.includes("-")) {
                const [start, end] = ref.split("-")
                const startParts = start.split(":")
                const endParts = end.split(":")
                return startParts.length > 1 && endParts.length > 1 && startParts[0].trim() !== endParts[0].trim()
                    ? "multi_chapter_verse_range"
                    : "chapter_verse_range"
            } else if (ref.includes(",")) {
                return "comma_separated_verses"
            } else {
                return "chapter_verse"
            }
        } else if (ref.includes("-")) {
            return "chapter_range"
        } else {
            return "single_chapter"
        }
    }
}

module.exports = ScriptureScanner
