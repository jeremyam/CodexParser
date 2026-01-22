/**
 * ReferenceParser.js
 * Parses scripture references into structured passage objects
 */

const bible = require("../data/bible")
const abbreviations = require("../format/abbr")
const sblAbbreviations = require("../data/abbr/sbl")
const PassageUtils = require("../utils/PassageUtils")
const PassageValidator = require("./PassageValidator")
const VersionHandler = require("./VersionHandler")
const { formatOsis, formatOsisNumeric } = require("../format/osis")

/**
 * Parses scripture references
 */
class ReferenceParser {
    static REFERENCE_TYPES = {
        SINGLE_CHAPTER: "single_chapter",
        CHAPTER_VERSE: "chapter_verse",
        CHAPTER_VERSE_RANGE: "chapter_verse_range",
        COMMA_SEPARATED: "comma_separated_verses",
        CHAPTER_RANGE: "chapter_range",
        MULTI_CHAPTER_RANGE: "multi_chapter_verse_range",
        BOOK_ONLY: "book_only",
    }

    #config

    constructor(config = {}) {
        this.#config = config
    }

    /**
     * Parses found references into structured passage objects
     * @param {Array} foundReferences - Array of found references from scanner
     * @param {string} currentVersion - Current Bible version
     * @returns {Array} Array of parsed passage objects
     */
    parse(foundReferences, currentVersion = null) {
        return foundReferences.map((reference) => {
            const book = this.#normalizeBookName(reference.book)
            const testament = bible.old.includes(book) ? "old" : "new"

            const parsedPassage = {
                original: `${reference.book} ${reference.reference}`,
                book,
                chapter: null,
                verses: [],
                type: reference.type,
                testament,
                startIndex: reference.startIndex,
                endIndex: reference.endIndex,
                originalText: reference.originalText,
                version: VersionHandler.getVersion(reference.version || currentVersion, testament),
                passages: [],
                scripture: null,
                valid: true,
                start: null,
                end: null,
                abbr: null,
            }

            // Clean reference for parsing
            let cleanReference = reference.reference.replace(/\s*(LXX|MT)$/i, "").trim()
            if (cleanReference.endsWith(",")) {
                cleanReference = cleanReference.slice(0, -1).trim()
            }

            // Handle book-only or empty references
            if (!cleanReference && this.#config.booksOnly) {
                parsedPassage.type = ReferenceParser.REFERENCE_TYPES.BOOK_ONLY
            } else if (!cleanReference || cleanReference.match(/^\d+\s*[:;]?\s*$/)) {
                this.#handleEmptyReference(parsedPassage, cleanReference)
            } else if (reference.type === ReferenceParser.REFERENCE_TYPES.COMMA_SEPARATED) {
                this.#handleCommaSeparated(parsedPassage, cleanReference)
            } else {
                this.#parseReferenceParts(parsedPassage, cleanReference)
            }

            // Populate passages and scripture
            parsedPassage.passages = this.#populatePassage(parsedPassage)
            parsedPassage.scripture = this.#formatScripture(parsedPassage)
            parsedPassage.valid = PassageValidator.validate(parsedPassage, cleanReference)
            // Set abbreviation
            this.#setAbbreviation(parsedPassage, reference.reference)

            // Handle multi-chapter range
            if (parsedPassage.type === ReferenceParser.REFERENCE_TYPES.MULTI_CHAPTER_RANGE) {
                this.#handleMultiChapterRange(parsedPassage, cleanReference)
            } else {
                delete parsedPassage.to
            }

            // Calculate start and end
            this.#calculateStartEnd(parsedPassage)

            // Attach per-passage version helpers for backward compatibility
            this.#attachVersionHelpers(parsedPassage)

            return parsedPassage
        })
    }

    /**
     * Normalizes book names using abbreviations or full names
     * @private
     */
    #normalizeBookName(book) {
        if (typeof book !== "string") {
            book = book[0]
        }
        book = book.toLowerCase()

        const bookified = abbreviations[Object.keys(abbreviations).find((abbr) => abbr.toLowerCase() === book)]
        if (bookified) {
            return bookified
        }

        return (
            bible.new.find((b) => b.toLowerCase() === book) || bible.old.find((b) => b.toLowerCase() === book) || book
        )
    }

    /**
     * Attaches version helper methods to a single passage object
     * @private
     */
    #attachVersionHelpers(passage) {
        const self = this
        const computeConverted = (srcPassage, targetAbbr) => {
            const versionObj = VersionHandler.getVersionObject(targetAbbr)
            const cloned = JSON.parse(JSON.stringify(srcPassage))
            cloned.version = versionObj

            // Remap chapters/verses according to versification, if present
            cloned.passages.forEach((sub) => {
                if (sub.versification && sub.versification[targetAbbr]) {
                    const [ch, v] = sub.versification[targetAbbr].split(":").map(Number)
                    sub.chapter = ch
                    sub.verse = v
                }
            })

            // Sort and recompute summary fields
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

            const mergeRanges = (verses) => {
                const sorted = [...verses].sort((a, b) => a - b)
                const merged = []
                if (sorted.length === 0) return merged
                let start = sorted[0]
                let end = sorted[0]
                for (let i = 1; i < sorted.length; i++) {
                    if (sorted[i] === end + 1) {
                        end = sorted[i]
                    } else {
                        merged.push(start === end ? `${start}` : `${start}-${end}`)
                        start = end = sorted[i]
                    }
                }
                merged.push(start === end ? `${start}` : `${start}-${end}`)
                return merged
            }

            sortedChs.forEach((ch) => {
                const vs = Array.from(chapterVersesMap[ch])
                    .filter((v) => v > 0)
                    .sort((a, b) => a - b)
                if (vs.length > 0) {
                    const merged = mergeRanges(vs)
                    chapterStrs.push(`${ch}:${merged.join(",")}`)
                }
            })

            if (chapterStrs.length === 0) {
                return cloned // no verses, return as-is
            }

            const firstCh = sortedChs[0]
            const lastCh = sortedChs[sortedChs.length - 1]
            cloned.chapter = firstCh

            const mergedFirst = mergeRanges(chapterVersesMap[firstCh] || new Set())
            cloned.verses = mergedFirst

            if (firstCh !== lastCh) {
                cloned.type = ReferenceParser.REFERENCE_TYPES.MULTI_CHAPTER_RANGE
                cloned.to = {
                    book: cloned.book,
                    chapter: lastCh,
                    verses: mergeRanges(chapterVersesMap[lastCh] || new Set()),
                }
                cloned.original = `${cloned.book} ${chapterStrs.join("; ")}`
            } else {
                const hasRangeOrMultiple =
                    mergedFirst.length > 1 || (mergedFirst.length === 1 && mergedFirst[0].includes("-"))
                cloned.type = hasRangeOrMultiple
                    ? ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE
                    : ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE
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

            // Set abbr
            const sblEntry = Object.entries(sblAbbreviations).find(
                ([key]) => key.toLowerCase() === cloned.book.toLowerCase()
            )
            const suffix = versionObj.abbreviation === "eng" ? "" : ` ${versionObj.value}`
            if (sblEntry) {
                const { value, abbr } = sblEntry[1]
                cloned.abbr = abbr
                    ? `${value}. ${cloned.scripture.cv}${suffix}`
                    : `${value} ${cloned.scripture.cv}${suffix}`
            } else {
                cloned.abbr = `${cloned.book} ${cloned.scripture.cv}${suffix}`
            }

            return cloned
        }

        passage.getVersion = function (targetVersion) {
            const targetAbbr = targetVersion.toLowerCase() === "bhs" ? "mt" : targetVersion.toLowerCase()
            return computeConverted(this, targetAbbr)
        }
        passage.getLXX = function () {
            return this.getVersion("lxx")
        }
        passage.getMT = function () {
            return this.getVersion("mt")
        }
        passage.getBHS = function () {
            return this.getVersion("mt")
        }
        passage.getEnglish = function () {
            return this.getVersion("eng")
        }
        passage.convertVersion = function (targetVersion) {
            const targetAbbr = targetVersion.toLowerCase() === "bhs" ? "mt" : targetVersion.toLowerCase()

            // Check if any passages have versification data
            const hasVersification = this.passages.some((p) => p.versification)

            if (!hasVersification) {
                // No versification exists, return a clone with updated version info only
                const cloned = JSON.parse(JSON.stringify(this))
                cloned.version = VersionHandler.getVersionObject(targetAbbr)
                return cloned
            }

            // Has versification, use the full conversion
            return computeConverted(this, targetAbbr)
        }
    }

    /**
     * Handles empty or chapter-only references
     * @private
     */
    #handleEmptyReference(passage, cleanReference) {
        const chapterMatch = cleanReference.match(/\d+/) || ["1"]
        const chapter = Number(chapterMatch[0])
        passage.chapter = chapter
        passage.type = ReferenceParser.REFERENCE_TYPES.SINGLE_CHAPTER

        const chapterVerses = PassageUtils.getChapterVerses(passage.book, chapter)
        if (chapterVerses.length) {
            const startVerse = chapterVerses[0]
            const endVerse = chapterVerses[chapterVerses.length - 1]
            passage.verses = [`${startVerse}-${endVerse}`]
        }
    }

    /**
     * Handles comma-separated verses
     * @private
     */
    #handleCommaSeparated(passage, cleanReference) {
        const [chapter, verses] = cleanReference.split(":")
        passage.chapter = Number(chapter)
        passage.verses = verses.split(",").map((v) => v.trim())
    }

    /**
     * Parses reference parts into chapter and verse components
     * @private
     */
    #parseReferenceParts(passage, reference) {
        const singleChapterBook = PassageUtils.SINGLE_CHAPTER_BOOKS.find((b) => Object.keys(b)[0] === passage.book)
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
                    passage.type = ReferenceParser.REFERENCE_TYPES.MULTI_CHAPTER_RANGE
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

            // Handle chapter-only references (only when no chapter has been established yet)
            if (!part.includes(":") && !part.includes("-") && !singleChapterBook && !passage.chapter) {
                this.#parseChapterOnly(passage, part)
            } else if (part.includes(":")) {
                this.#parseChapterVerse(passage, part, isFirstPart)
            } else if (singleChapterBook) {
                this.#parseSingleChapterBook(passage, part, isFirstPart && parts.length === 1)
            } else if (part.includes("-")) {
                this.#parseRange(passage, part, isFirstPart)
            } else {
                this.#parseSingleNumber(passage, part, isFirstPart)
            }
        })
    }

    /**
     * Parses chapter-only reference
     * @private
     */
    #parseChapterOnly(passage, part) {
        const chapter = Number(part.replace(/[^0-9]/g, ""))
        if (chapter > 0) {
            passage.chapter = chapter
            passage.type = ReferenceParser.REFERENCE_TYPES.SINGLE_CHAPTER
            const chapterVerses = PassageUtils.getChapterVerses(passage.book, chapter)
            if (chapterVerses.length) {
                const startVerse = chapterVerses[0]
                const endVerse = chapterVerses[chapterVerses.length - 1]
                passage.verses = [`${startVerse}-${endVerse}`]
            }
        }
    }

    /**
     * Parses chapter:verse references
     * @private
     */
    #parseChapterVerse(passage, part, isFirstPart) {
        const [chapter, verse] = part.split(/[:.]/).map((s) => s.trim())
        if (isFirstPart) passage.chapter = Number(chapter)

        passage.type = verse.includes("-")
            ? ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE
            : verse.includes(",")
            ? ReferenceParser.REFERENCE_TYPES.COMMA_SEPARATED
            : ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE

        if (verse.includes(",")) {
            passage.verses.push(...verse.split(",").map((v) => v.trim()))
        } else {
            passage.verses.push(verse)
        }
    }

    /**
     * Parses references for single-chapter books
     * @private
     */
    #parseSingleChapterBook(passage, part, isWholeChapter) {
        const verseCount = PassageUtils.getChapterVerses(passage.book, 1).length

        if (part === "1" && isWholeChapter) {
            passage.chapter = 1
            passage.type = ReferenceParser.REFERENCE_TYPES.SINGLE_CHAPTER
            passage.verses = [`1-${verseCount}`]
        } else if (part.includes("-")) {
            passage.chapter = 1
            passage.verses.push(part)
            passage.type = ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE
        } else if (part.includes(",")) {
            passage.chapter = 1
            passage.verses.push(...part.split(",").map((v) => v.trim()))
            passage.type = ReferenceParser.REFERENCE_TYPES.COMMA_SEPARATED
        } else {
            const num = Number(part)
            if (num > 0) {
                passage.chapter = 1
                passage.verses.push(num)
                passage.type = ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE
            }
        }
    }

    /**
     * Parses range references
     * @private
     */
    #parseRange(passage, part, isFirstPart) {
        if (!passage.chapter && isFirstPart) {
            const [start, end] = part.split("-").map(Number)
            passage.chapter = start
            const startVerses = PassageUtils.getChapterVerses(passage.book, start)
            passage.verses = [`${startVerses[0]}-${startVerses[startVerses.length - 1]}`]
            passage.to = {
                book: passage.book,
                chapter: end,
                verses: [
                    `${PassageUtils.getChapterVerses(passage.book, end)[0]}-${
                        PassageUtils.getChapterVerses(passage.book, end).slice(-1)[0]
                    }`,
                ],
            }
            passage.type = ReferenceParser.REFERENCE_TYPES.CHAPTER_RANGE
        } else {
            passage.verses.push(part)
            passage.type = ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE
        }
    }

    /**
     * Parses single number references
     * @private
     */
    #parseSingleNumber(passage, part, isFirstPart) {
        if (isFirstPart && !passage.chapter) {
            passage.chapter = Number(part)
            passage.type = ReferenceParser.REFERENCE_TYPES.SINGLE_CHAPTER
            const chapterVerses = PassageUtils.getChapterVerses(passage.book, passage.chapter)
            if (chapterVerses.length) {
                passage.verses = [`${chapterVerses[0]}-${chapterVerses[chapterVerses.length - 1]}`]
            }
        } else {
            passage.verses.push(Number(part))
            passage.type = ReferenceParser.REFERENCE_TYPES.COMMA_SEPARATED
        }
    }

    /**
     * Handles multi-chapter range references
     * @private
     */
    #handleMultiChapterRange(passage, reference) {
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
     * Populates passage with expanded verse objects
     * @private
     */
    #populatePassage(passage) {
        const { book, chapter, verses, type, to } = passage

        if (type === ReferenceParser.REFERENCE_TYPES.SINGLE_CHAPTER) {
            const chapterVerses = PassageUtils.getChapterVerses(book, chapter)
            return PassageUtils.expandVerses(book, chapter, [
                `${chapterVerses[0]}-${chapterVerses[chapterVerses.length - 1]}`,
            ])
        }

        if (
            type === ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE ||
            type === ReferenceParser.REFERENCE_TYPES.COMMA_SEPARATED ||
            type === ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE
        ) {
            return PassageUtils.expandVerses(book, chapter, verses)
        }

        if (type === ReferenceParser.REFERENCE_TYPES.CHAPTER_RANGE) {
            const passages = []
            if (to && to.chapter) {
                for (let ch = chapter; ch <= to.chapter; ch++) {
                    const chapterVerses = PassageUtils.getChapterVerses(book, ch)
                    passages.push(
                        ...PassageUtils.expandVerses(book, ch, [
                            `${chapterVerses[0]}-${chapterVerses[chapterVerses.length - 1]}`,
                        ])
                    )
                }
            }
            return passages
        }

        if (type === ReferenceParser.REFERENCE_TYPES.MULTI_CHAPTER_RANGE) {
            const passages = []
            const startVerse = verses[0]?.includes("-") ? Number(verses[0].split("-")[0]) : Number(verses[0]) || 1
            const endVerse = to?.verses?.[0]?.includes("-")
                ? Number(to.verses[0].split("-")[1])
                : Number(to?.verses?.[0]) || 1
            const endChapter = to?.chapter || chapter

            for (let ch = chapter; ch <= endChapter; ch++) {
                const chapterVerses = PassageUtils.getChapterVerses(book, ch)
                const from = ch === chapter ? startVerse : chapterVerses[0]
                const toVerse = ch === endChapter ? endVerse : chapterVerses[chapterVerses.length - 1]
                passages.push(...PassageUtils.expandVerses(book, ch, [`${from}-${toVerse}`]))
            }
            return passages
        }

        return []
    }

    /**
     * Formats a passage into a human-readable reference
     * @private
     */
    #formatScripture(passage) {
        let combined = `${passage.book}`

        if (passage.type === ReferenceParser.REFERENCE_TYPES.MULTI_CHAPTER_RANGE && passage.to) {
            combined += ` ${PassageUtils.formatChapterVerse(
                passage.chapter,
                passage.verses
            )}-${PassageUtils.formatChapterVerse(passage.to.chapter, passage.to.verses)}`
        } else if (
            passage.type === ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE ||
            passage.type === ReferenceParser.REFERENCE_TYPES.COMMA_SEPARATED
        ) {
            combined += ` ${PassageUtils.formatChapterVerse(passage.chapter, passage.verses)}`
        } else if (passage.type === ReferenceParser.REFERENCE_TYPES.CHAPTER_RANGE && passage.to) {
            combined += ` ${passage.chapter}-${passage.to.chapter}`
        } else {
            combined += ` ${PassageUtils.formatChapterVerse(passage.chapter, passage.verses)}`
        }

        const cv = passage.to
            ? `${PassageUtils.formatChapterVerse(passage.chapter, passage.verses)}-${PassageUtils.formatChapterVerse(
                  passage.to.chapter,
                  passage.to.verses
              )}`
            : PassageUtils.formatChapterVerse(passage.chapter, passage.verses)

        const hash = formatOsis(passage)

        return {
            passage: combined,
            cv: cv,
            hash: hash,
            osisNumeric: formatOsisNumeric(passage),
        }
    }

    /**
     * Sets the SBL abbreviation for a passage
     * @private
     */
    #setAbbreviation(passage, reference) {
        const sblEntry = Object.entries(sblAbbreviations).find(
            ([key]) => key.toLowerCase() === passage.book.toLowerCase()
        )

        if (sblEntry) {
            const { value, abbr } = sblEntry[1]
            const ref = reference.replace(/\s*(LXX|MT)$/i, "").trim()
            const suffix = passage.version.value !== "ENG" ? " " + passage.version.value : ""
            passage.abbr = abbr ? `${value}. ${ref}${suffix}` : `${value} ${ref}${suffix}`
        } else {
            passage.abbr = passage.original
        }
    }

    /**
     * Calculates start and end based on passages array
     * @private
     */
    #calculateStartEnd(passage) {
        if (passage.passages.length > 0) {
            const sortedPassages = passage.passages.slice().sort((a, b) => {
                if (a.chapter !== b.chapter) return a.chapter - b.chapter
                return a.verse - b.verse
            })

            const firstPassage = sortedPassages[0]
            const lastPassage = sortedPassages[sortedPassages.length - 1]

            passage.start = {
                book: firstPassage.book,
                chapter: firstPassage.chapter,
                verse: firstPassage.verse,
            }
            passage.end = {
                book: lastPassage.book,
                chapter: lastPassage.chapter,
                verse: lastPassage.verse,
            }
        }
    }
}

module.exports = ReferenceParser
