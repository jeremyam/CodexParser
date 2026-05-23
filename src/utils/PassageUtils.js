/**
 * PassageUtils.js
 * Utility functions for working with passages
 */

const chapter_verses = require("./chapterVerseCombine")
const { sch } = require("./functions")

/**
 * Utility functions for passage manipulation
 */
class PassageUtils {
    static SINGLE_CHAPTER_BOOKS = [
        sch("Jude", 25),
        sch("2 John", 13),
        sch("3 John", 15),
        sch("Obadiah", 21),
        sch("Philemon", 25),
    ]

    /**
     * Gets available verses for a given book and chapter
     * @param {string} book - The book name
     * @param {number} chapter - The chapter number
     * @returns {number[]} Array of valid verse numbers
     */
    static getChapterVerses(book, chapter) {
        const singleChapterBook = PassageUtils.SINGLE_CHAPTER_BOOKS.find((b) => Object.keys(b)[0] === book)
        return singleChapterBook ? singleChapterBook[book]?.[chapter] || [] : chapter_verses[book]?.[chapter] || []
    }

    /**
     * Expands verse references into individual verse objects
     * @param {string} book - The book name
     * @param {number} chapter - The chapter number
     * @param {Array<string|number>} verses - Array of verses or ranges
     * @returns {Object[]} Array of verse objects
     */
    static expandVerses(book, chapter, verses) {
        const passages = []
        const chapterVerses = PassageUtils.getChapterVerses(book, chapter)

        verses.forEach((verse) => {
            if (typeof verse === "string" && verse.includes("-")) {
                const [start, end] = verse.split("-").map(Number)
                for (let i = start; i <= end && i <= chapterVerses[chapterVerses.length - 1]; i++) {
                    passages.push({ book, chapter, verse: i })
                }
            } else if (typeof verse === "string") {
                const match = verse.trim().match(/^(\d+)([a-eA-E])?$/)
                if (match) {
                    const verseNum = Number(match[1])
                    if (verseNum > 0) {
                        const entry = { book, chapter, verse: verseNum }
                        if (match[2]) entry.verseSuffix = match[2].toLowerCase()
                        passages.push(entry)
                    }
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
     * Merges verses into ranges or comma-separated lists
     * @param {number[]} verses - Array of verse numbers
     * @returns {string[]} Array of verse strings
     */
    static mergeRanges(verses) {
        const sortedVerses = [...new Set(verses)].sort((a, b) => a - b)
        const merged = []
        let start = sortedVerses[0]
        let end = sortedVerses[0]

        for (let i = 1; i < sortedVerses.length; i++) {
            if (sortedVerses[i] === end + 1) {
                end = sortedVerses[i]
            } else {
                merged.push(start === end ? `${start}` : `${start}-${end}`)
                start = sortedVerses[i]
                end = sortedVerses[i]
            }
        }

        merged.push(start === end ? `${start}` : `${start}-${end}`)
        return merged
    }

    /**
     * Generates a range of numbers
     * @param {number} start - Start number
     * @param {number} end - End number
     * @returns {number[]} Array of numbers
     */
    static generateRange(start, end) {
        const range = []
        for (let i = start; i <= end; i++) {
            range.push(i)
        }
        return range
    }

    /**
     * Formats a chapter and verse into a reference string
     * @param {number} chapter - Chapter number
     * @param {Array} verses - Array of verses
     * @returns {string} Formatted reference
     */
    static formatChapterVerse(chapter, verses) {
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
}

module.exports = PassageUtils
