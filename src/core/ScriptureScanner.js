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
        const fullNames = [...this.#bible.old, ...this.#bible.new, ...(this.#bible.deuterocanonical || [])]
        const abbreviationKeys = Object.keys(this.#abbreviations)
        const found = []

        // Minimal normalization: fix periods before numbers, neutralize trailing
        // periods after book abbreviations.  Both substitutions are
        // LENGTH-PRESERVING (1 char -> 1 char) so indices into normalizedText
        // map 1:1 onto the original `text`, keeping startIndex/endIndex exact.
        const normalizedText = text
            .replace(/\.(?=\d)/g, ":")
            .replace(/(\b[A-Za-z]+)\.(?=\s|$)/g, "$1 ")
            .replace(/[–—]/g, "-")

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

            // A book starts a word: "ge 12" inside "page 12" is not Genesis. A digit
            // may precede, since a numbered book can run on ("2Sam 1:1").
            if (i > 0 && /[\p{L}\p{M}]/u.test(lowerCaseText[i - 1])) {
                i++
                continue
            }

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

                while (
                    i < normalizedText.length &&
                    this.#isValidChapterVerseChar(normalizedText[i], normalizedText[i - 1], normalizedText, i)
                ) {
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

                let tagEnd = i
                references.forEach(({ ref, start, end }) => {
                    const type = this.#determineReferenceType(ref)
                    const suffixData = this.#detectSuffix(normalizedText, end)
                    const suffix = suffixData ? suffixData.suffix : null

                    // Normalization is length-preserving, so the tracked scan
                    // indices map 1:1 onto the original text. Use them directly
                    // instead of the old indexOf remapping (which drifted and
                    // truncated references that followed punctuation).
                    let originalStartIndex = start
                    // An earlier reference in a list shares the tag ("Ps 1:1; 2:2 LXX")
                    // but ends at its own semicolon, not at the tag.
                    const ownTag = suffixData && !/\S/.test(normalizedText.slice(end, end + suffixData.gap))
                    let originalEndIndex = ownTag ? end + suffixData.gap + suffixData.length : end
                    if (suffixData) tagEnd = Math.max(tagEnd, end + suffixData.gap + suffixData.length)

                    // Trim leading separators/whitespace (e.g. after "(", ";", ".")
                    while (
                        originalStartIndex < originalEndIndex &&
                        /[\s.,;:()[\]—-]/.test(text[originalStartIndex])
                    ) {
                        originalStartIndex++
                    }
                    // Trim trailing whitespace/punctuation
                    while (
                        originalEndIndex > originalStartIndex &&
                        /[\s.,;]/.test(text[originalEndIndex - 1])
                    ) {
                        originalEndIndex--
                    }

                    const originalText = text.slice(originalStartIndex, originalEndIndex)

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
                i = tagEnd
            } else {
                i++
            }
        }

        return found
    }

    /**
     * Checks if character is valid for chapter/verse references.
     * Letter suffixes (a-e) only count when they directly follow a digit, so
     * "6:1a" continues the token but "6:1 Amos" still breaks at "A".
     * NA-style sequens markers keep the token going too: "s" after a digit
     * ("25s") or after another "s" ("25ss").
     * Rahlfs letters his long additions past "e" (3 Kingdoms 2:46a-l, 12:24a-z),
     * but a bare "f" after a verse is also the German "and following" ("22:2f."),
     * so the letters f-z (never "s", the sequens) count only in a reference
     * that carries an LXX tag, and only as a single letter.
     * @private
     */
    #isValidChapterVerseChar(char, prevChar, text, index) {
        if (/[\d:,\-;\s]/.test(char)) return true
        if (/[a-eA-E]/.test(char) && prevChar && /\d/.test(prevChar)) return true
        if (/[f-rt-zF-RT-Z]/.test(char) && prevChar && /\d/.test(prevChar) && text) {
            const rest = text.slice(index + 1)
            if (/^[a-zA-Z.]/.test(rest)) return false
            return /^[\d:,\-;\sa-z]*LXX\b/i.test(rest)
        }
        if (/[sS]/.test(char) && prevChar && /[\dsS]/.test(prevChar)) return true
        return false
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
     * Detects a version suffix (LXX-Th, LXX, MT) on the reference ending at
     * startIndex. LXX-Th is tried first so the Theodotion tag is not read as a
     * bare LXX. The tag must belong to this reference: only the rest of its own
     * list may come between them ("Ps 1:1; 2:2 LXX"). A number after it makes it
     * a book, not a tag ("Mt 5:3"). gap is the distance from startIndex to the tag.
     * @private
     */
    #detectSuffix(text, startIndex) {
        const suffixMatch = /^([\d:,;\-\s]*)(LXX-Th|LXX|MT)\b(?!\s*\d)/i.exec(text.substring(startIndex))
        if (!suffixMatch) return null
        return { suffix: suffixMatch[2].toUpperCase(), gap: suffixMatch[1].length, length: suffixMatch[2].length }
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
