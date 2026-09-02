/**
 * PassageValidator.js
 * Handles validation of scripture passages
 */

const PassageUtils = require("../utils/PassageUtils")

/**
 * Validates scripture passages
 */
class PassageValidator {
    static ERROR_CODES = {
        INVALID_CHAPTER: 101,
        CHAPTER_NOT_EXIST: 102,
        VERSE_NOT_EXIST: 104,
    }

    /**
     * Validates a passage for correctness
     * @param {Object} passage - The passage object
     * @param {string} reference - The original reference
     * @returns {boolean|Object} True if valid, error object if invalid
     */
    static validate(passage, reference) {
        const { book, chapter, verses, type } = passage

        const SINGLE_CHAPTER = "single_chapter"

        if (!verses.length && type !== SINGLE_CHAPTER) {
            return PassageValidator.#createError(
                PassageValidator.ERROR_CODES.INVALID_CHAPTER,
                `Possible invalid chapter: ${reference}`
            )
        }

        const chapterVerses = PassageUtils.getChapterVerses(book, chapter)
        if (!chapterVerses.length) {
            return PassageValidator.#createError(
                PassageValidator.ERROR_CODES.CHAPTER_NOT_EXIST,
                `Chapter ${chapter} does not exist in ${book}`
            )
        }

        if (type === SINGLE_CHAPTER) {
            const [range] = verses
            if (range) {
                const [start, end] = range.split("-").map(Number)
                if (start < 1 || end > chapterVerses[chapterVerses.length - 1]) {
                    return PassageValidator.#createError(
                        PassageValidator.ERROR_CODES.VERSE_NOT_EXIST,
                        `Verse range ${start}-${end} exceeds available verses (1-${
                            chapterVerses[chapterVerses.length - 1]
                        }) in ${book} ${chapter}`
                    )
                }
            }
            return true
        }

        return PassageValidator.#validateVerses(book, chapter, verses)
    }

    /**
     * Validates verse numbers for a chapter
     * @private
     */
    static #validateVerses(book, chapter, verses) {
        const chapterVerses = PassageUtils.getChapterVerses(book, chapter)
        for (const verse of verses) {
            const verseRange = String(verse)
            const verseNumbers = verseRange.includes("-")
                ? Array.from(
                      { length: Number(verseRange.split("-")[1]) - Number(verseRange.split("-")[0]) + 1 },
                      (_, i) => Number(verseRange.split("-")[0]) + i
                  )
                : [Number(verseRange)]

            for (const v of verseNumbers) {
                if (isNaN(v) || v < 0) {
                    return PassageValidator.#createError(
                        PassageValidator.ERROR_CODES.VERSE_NOT_EXIST,
                        `Verse number ${v} does not exist in ${book} ${chapter}`
                    )
                }
                // English ":0" is a real address for psalm superscriptions
                // attested in the versification table (MT/LXX verse 1).
                if (v === 0) {
                    if (!PassageUtils.isTitleVerse(book, chapter, v)) {
                        return PassageValidator.#createError(
                            PassageValidator.ERROR_CODES.VERSE_NOT_EXIST,
                            `Verse number ${v} does not exist in ${book} ${chapter}`
                        )
                    }
                    continue
                }
                if (!chapterVerses.includes(v)) {
                    return PassageValidator.#createError(
                        PassageValidator.ERROR_CODES.VERSE_NOT_EXIST,
                        `Verse number ${v} does not exist in ${book} ${chapter}`
                    )
                }
            }
        }
        return true
    }

    /**
     * Creates an error object for validation failures
     * @private
     */
    static #createError(code, message) {
        return {
            error: true,
            code,
            message: {
                verse_exists: code === PassageValidator.ERROR_CODES.VERSE_NOT_EXIST,
                chapter_exists: code !== PassageValidator.ERROR_CODES.VERSE_NOT_EXIST,
                content: message,
            },
        }
    }
}

module.exports = PassageValidator
