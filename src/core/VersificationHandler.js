/**
 * VersificationHandler.js
 * Handles versification differences between Bible versions
 */

const versified = require("../data/versified")
const PassageUtils = require("../utils/PassageUtils")
const ReferenceParser = require("./ReferenceParser")

/**
 * Handles versification differences
 */
class VersificationHandler {
    #versificationDifferences
    #chapterVerses

    constructor() {
        this.#versificationDifferences = versified
        // We need to make a copy to avoid mutating the original
        this.#chapterVerses = {}
    }

    /**
     * Searches for versification differences for a book and chapter
     * @param {string} book - The book name
     * @param {number} chapter - The chapter number
     * @param {string} version - The Bible version
     * @returns {Object|undefined} Updated chapter verses or undefined
     */
    searchVersificationDifferences(book, chapter, version) {
        version = version.toLowerCase()

        // Handle single-chapter book "Obadiah"
        if (book === "Obadiah") {
            const singleChapterBook = PassageUtils.SINGLE_CHAPTER_BOOKS.find((b) => Object.keys(b)[0] === "Obadiah")
            if (!singleChapterBook || !singleChapterBook[book][chapter]) {
                return // No data for Obadiah or chapter
            }
            if (!this.#versificationDifferences[book]) {
                return // No versification differences for Obadiah
            }

            // Process versification differences
            for (const [key, value] of Object.entries(this.#versificationDifferences[book])) {
                if (value[version]?.startsWith(`${chapter}:`)) {
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
        const chapterVerses = PassageUtils.getChapterVerses(book, chapter)
        if (!chapterVerses.length) {
            return
        }
        if (!this.#versificationDifferences[book]) {
            return
        }

        // Create a mutable copy
        if (!this.#chapterVerses[book]) {
            this.#chapterVerses[book] = {}
        }
        if (!this.#chapterVerses[book][chapter]) {
            this.#chapterVerses[book][chapter] = [...chapterVerses]
        }

        for (const [key, value] of Object.entries(this.#versificationDifferences[book])) {
            if (value[version]?.startsWith(`${chapter}:`)) {
                if (value[version]) {
                    const verse = value[version].split(":")[1]
                    this.#chapterVerses[book][chapter].push(Number(verse))
                }
            }
        }

        this.#chapterVerses[book][chapter] = Array.from(new Set(this.#chapterVerses[book][chapter]))
        return this.#chapterVerses
    }

    /**
     * True when a versification-table value (exact "ch:v", comma list "ch:v1,v2",
     * or range "ch:v1-v2") covers this native chapter/verse.
     * @private
     */
    #nativeCovers(native, chapter, verse, suffix) {
        if (native == null || native === "") return false
        const want = suffix ? `${chapter}:${verse}${suffix}` : `${chapter}:${verse}`
        if (native === want) return true
        const expanded = ReferenceParser.expandVersificationValue(native)
        const ch = Number(chapter)
        const v = Number(verse)
        const s = suffix || ""
        return expanded.some((e) => e.chapter === ch && e.verse === v && (e.suffix || "") === s)
    }

    /**
     * Applies versification differences to parsed passages
     * @param {Array} passages - Array of passage objects
     * @returns {Array} Updated passages with versification info
     */
    applyVersification(passages) {
        passages.forEach((passage) => {
            const hasVersification = this.#versificationDifferences[passage.book]

            passage.passages.forEach((subPassage) => {
                const verseRef = subPassage.verseSuffix
                    ? `${subPassage.chapter}:${subPassage.verse}${subPassage.verseSuffix}`
                    : `${subPassage.chapter}:${subPassage.verse}`

                if (hasVersification) {
                    if (this.#versificationDifferences[passage.book][verseRef]) {
                        subPassage.versification = this.#versificationDifferences[passage.book][verseRef]
                    }
                }

                if (passage.version) {
                    const versionAbbreviation = passage.version.abbreviation
                    const versionType =
                        versionAbbreviation === "lxx" ? "lxx" : versionAbbreviation === "mt" ? "mt" : null

                    if (versionType) {
                        for (const versification in this.#versificationDifferences[passage.book]) {
                            const native =
                                this.#versificationDifferences[passage.book][versification][versionType]
                            if (this.#nativeCovers(native, subPassage.chapter, subPassage.verse, subPassage.verseSuffix)) {
                                subPassage.versification = this.#versificationDifferences[passage.book][versification]
                                break
                            }
                        }
                    }
                }
            })
        })

        return passages
    }

    /**
     * Gets versification for a specific passage
     * @param {string} book - Book name
     * @param {number} chapter - Chapter number
     * @param {number} verse - Verse number
     * @returns {Object|null} Versification object or null
     */
    getVersification(book, chapter, verse) {
        if (!this.#versificationDifferences[book]) {
            return null
        }

        const key = `${chapter}:${verse}`
        return this.#versificationDifferences[book][key] || null
    }
}

module.exports = VersificationHandler
