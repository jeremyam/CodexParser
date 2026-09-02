/**
 * PassageCollection.js
 * Array-like collection with utility methods for passages
 */

const PassageUtils = require("../utils/PassageUtils")
const VersionHandler = require("./VersionHandler")
const sblAbbreviations = require("../data/abbr/sbl")
const { formatOsis, formatOsisNumeric } = require("../format/osis")

/**
 * Collection of passages with utility methods
 */
class PassageCollection extends Array {
    /**
     * Gets the first passage
     * @returns {Object|null} First passage or null
     */
    first() {
        return this.length > 0 ? this[0] : null
    }

    /**
     * Filters passages from Old Testament
     * @returns {PassageCollection} Filtered collection
     */
    oldTestament() {
        const filtered = this.filter((passage) => passage.testament === "old")
        return PassageCollection.from(filtered)
    }

    /**
     * Filters passages from New Testament
     * @returns {PassageCollection} Filtered collection
     */
    newTestament() {
        const filtered = this.filter((passage) => passage.testament === "new")
        return PassageCollection.from(filtered)
    }

    /**
     * Combines passages by book and/or chapter
     * @param {Object} options - Combination options
     * @param {boolean} options.book - Group by book
     * @param {boolean} options.chapter - Group by chapter
     * @returns {PassageCollection} Combined passages
     */
    combine(options = {}) {
        const { book = true, chapter = true } = options

        if (!book) {
            return PassageCollection.from(this)
        }

        const groupedByBook = new Map()

        this.forEach((passage) => {
            const bookKey = passage.book
            if (!groupedByBook.has(bookKey)) {
                groupedByBook.set(bookKey, [])
            }
            groupedByBook.get(bookKey).push(passage)
        })

        const combinedPassages = []

        for (const [bookName, bookPassages] of groupedByBook) {
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
                        const combined = PassageCollection.combinePassages(passages)
                        combinedPassages.push(combined)
                    }
                }
            } else {
                const combined = PassageCollection.combinePassages(bookPassages)
                combinedPassages.push(combined)
            }
        }

        return PassageCollection.from(combinedPassages)
    }

    /**
     * Converts passages to a different version
     * @param {string} targetVersion - Target version (eng, lxx, mt, bhs)
     * @returns {PassageCollection} Converted passages
     */
    getVersion(targetVersion) {
        const targetAbbr = targetVersion.toLowerCase() === "bhs" ? "mt" : targetVersion.toLowerCase()
        const versionObj = VersionHandler.getVersionObject(targetAbbr)

        const converted = this.map((passage) => {
            const cloned = JSON.parse(JSON.stringify(passage))
            cloned.version = versionObj

            cloned.passages.forEach((sub) => {
                if (sub.versification && sub.versification[targetAbbr]) {
                    const [ch, v] = sub.versification[targetAbbr].split(":").map(Number)
                    sub.chapter = ch
                    sub.verse = v
                }
            })

            // Recompute summary fields
            PassageCollection.#recomputePassageFields(cloned, versionObj)

            return cloned
        })

        return PassageCollection.from(converted)
    }

    /**
     * Converts passages to LXX version (shorthand for getVersion('lxx'))
     * @returns {PassageCollection} Converted passages
     */
    getLXX() {
        return this.getVersion("lxx")
    }

    /**
     * Converts passages to MT/BHS version (shorthand for getVersion('mt'))
     * @returns {PassageCollection} Converted passages
     */
    getMT() {
        return this.getVersion("mt")
    }

    /**
     * Converts passages to BHS version (alias for getMT())
     * @returns {PassageCollection} Converted passages
     */
    getBHS() {
        return this.getVersion("mt")
    }

    /**
     * Converts passages to English version (shorthand for getVersion('eng'))
     * @returns {PassageCollection} Converted passages
     */
    getEnglish() {
        return this.getVersion("eng")
    }

    /**
     * Combines multiple passages into one
     * @static
     */
    static combinePassages(passages) {
        if (!passages || passages.length === 0) {
            throw new Error("No passages provided to combine.")
        }

        const uniqueBooks = [...new Set(passages.map((p) => p.book))]
        if (uniqueBooks.length > 1) {
            throw new Error("Passages must be from the same book to combine.")
        }

        const versions = new Set(passages.map((p) => p.version.abbreviation))
        if (versions.size > 1) {
            throw new Error("Cannot combine passages from different versions.")
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
                const chapter = p.chapter
                const verse = p.verse
                if (!chapterVerses[chapter]) {
                    chapterVerses[chapter] = new Set()
                }
                chapterVerses[chapter].add(verse)
                combined.passages.push({
                    book: p.book,
                    chapter: p.chapter,
                    verse: p.verse,
                    versification: p.versification,
                })

                if (firstChapter === null || chapter < firstChapter) {
                    firstChapter = chapter
                    firstVerse = verse
                } else if (chapter === firstChapter && (firstVerse === null || verse < firstVerse)) {
                    firstVerse = verse
                }
                if (lastChapter === null || chapter > lastChapter) {
                    lastChapter = chapter
                    lastVerse = verse
                } else if (chapter === lastChapter && (lastVerse === null || verse > lastVerse)) {
                    lastVerse = verse
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
                .filter((verse) => Number.isFinite(verse) && verse >= 0)
                .sort((a, b) => a - b)
            if (verses.length > 0) {
                const mergedVerses = PassageUtils.mergeRanges(verses)
                chapterStrings.push(`${chapter}:${mergedVerses.join(",")}`)
                if (chapter === firstChapter) {
                    combined.verses = mergedVerses
                }
            }
        })

        const missingPassages = passages.flatMap((p) => p.missingPassages || [])
        if (missingPassages.length) {
            combined.missingPassages = missingPassages
        }

        if (chapterStrings.length === 0) {
            // All verses are target-version minuses (e.g. Prov 16:1 LXX).
            if (missingPassages.length) {
                combined.verses = []
                combined.scripture = {
                    passage: combined.book,
                    cv: "",
                    hash: "",
                    osisNumeric: "",
                }
                combined.version = passages[0].version
                PassageCollection.#setAbbreviation(combined)
                if (combined.to === null) delete combined.to
                return combined
            }
            throw new Error("No valid verses found in passages.")
        }

        combined.chapter = firstChapter

        if (firstChapter !== lastChapter) {
            combined.type = "multi_chapter_verse_range"
            combined.to = {
                book: combined.book,
                chapter: lastChapter,
                verses: PassageUtils.mergeRanges(
                    Array.from(chapterVerses[lastChapter])
                        .filter((verse) => Number.isFinite(verse) && verse >= 0)
                        .sort((a, b) => a - b)
                ),
            }
            combined.original = `${combined.book} ${chapterStrings.join("; ")}`
        } else {
            const hasRangeOrMultiple =
                combined.verses.length > 1 ||
                (combined.verses.length === 1 && String(combined.verses[0]).includes("-"))
            combined.type = hasRangeOrMultiple ? "chapter_verse_range" : "chapter_verse"
            combined.original = `${combined.book} ${chapterStrings[0]}`
        }

        const chapterString = chapterStrings.join(";")
        combined.scripture = {
            passage: `${combined.book} ${chapterString}`,
            cv: chapterString,
            hash: formatOsis(combined),
            osisNumeric: formatOsisNumeric(combined),
        }

        combined.start = {
            book: combined.book,
            chapter: firstChapter,
            verse: Number.isFinite(firstVerse)
                ? firstVerse
                : Math.min(
                      ...Array.from(chapterVerses[firstChapter]).filter((verse) => Number.isFinite(verse) && verse >= 0)
                  ),
        }
        combined.end = {
            book: combined.book,
            chapter: lastChapter,
            verse: Number.isFinite(lastVerse)
                ? lastVerse
                : Math.max(
                      ...Array.from(chapterVerses[lastChapter]).filter((verse) => Number.isFinite(verse) && verse >= 0)
                  ),
        }

        if (combined.to === null) {
            delete combined.to
        }

        combined.version = passages[0].version

        // Set abbr with version suffix
        PassageCollection.#setAbbreviation(combined)

        return combined
    }

    /**
     * Recomputes passage fields after version change
     * @private
     */
    static #recomputePassageFields(cloned, versionObj) {
        cloned.passages.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)

        if (cloned.passages.length > 0) {
            cloned.start = {
                book: cloned.book,
                chapter: cloned.passages[0].chapter,
                verse: cloned.passages[0].verse,
            }
            cloned.end = {
                book: cloned.book,
                chapter: cloned.passages[cloned.passages.length - 1].chapter,
                verse: cloned.passages[cloned.passages.length - 1].verse,
            }
        }

        const chapterVersesMap = {}
        cloned.passages.forEach((p) => {
            if (!chapterVersesMap[p.chapter]) chapterVersesMap[p.chapter] = new Set()
            chapterVersesMap[p.chapter].add(p.verse)
        })

        const sortedChs = Object.keys(chapterVersesMap)
            .map(Number)
            .sort((a, b) => a - b)
        const chapterStrs = []

        sortedChs.forEach((ch) => {
            const vs = Array.from(chapterVersesMap[ch])
                .filter((v) => v > 0)
                .sort((a, b) => a - b)
            if (vs.length > 0) {
                const merged = PassageUtils.mergeRanges(vs)
                chapterStrs.push(`${ch}:${merged.join(",")}`)
            }
        })

        if (chapterStrs.length === 0) {
            return cloned
        }

        const firstCh = sortedChs[0]
        const lastCh = sortedChs[sortedChs.length - 1]
        cloned.chapter = firstCh

        const mergedFirst = PassageUtils.mergeRanges([...chapterVersesMap[firstCh]])
        cloned.verses = mergedFirst

        if (firstCh !== lastCh) {
            cloned.type = "multi_chapter_verse_range"
            cloned.to = {
                book: cloned.book,
                chapter: lastCh,
                verses: PassageUtils.mergeRanges([...chapterVersesMap[lastCh]]),
            }
            cloned.original = `${cloned.book} ${chapterStrs.join("; ")}`
        } else {
            const hasRangeOrMultiple =
                mergedFirst.length > 1 || (mergedFirst.length === 1 && mergedFirst[0].includes("-"))
            cloned.type = hasRangeOrMultiple ? "chapter_verse_range" : "chapter_verse"
            if (cloned.to) delete cloned.to
            cloned.original = `${cloned.book} ${chapterStrs[0]}`
        }

        const chString = chapterStrs.join("; ")
        cloned.scripture = {
            passage: `${cloned.book} ${chString}`,
            cv: chString,
            hash: formatOsis(cloned),
            osisNumeric: formatOsisNumeric(cloned),
        }

        PassageCollection.#setAbbreviation(cloned)
    }

    /**
     * Sets abbreviation for passage
     * @private
     */
    static #setAbbreviation(passage) {
        const sblEntry = Object.entries(sblAbbreviations).find(
            ([key]) => key.toLowerCase() === passage.book.toLowerCase()
        )
        const suffix = passage.version.abbreviation === "eng" ? "" : ` ${passage.version.value}`

        if (sblEntry) {
            const { value, abbr } = sblEntry[1]
            passage.abbr = abbr
                ? `${value}. ${passage.scripture.cv}${suffix}`
                : `${value} ${passage.scripture.cv}${suffix}`
        } else {
            passage.abbr = `${passage.book} ${passage.scripture.cv}${suffix}`
        }
    }
}

module.exports = PassageCollection
