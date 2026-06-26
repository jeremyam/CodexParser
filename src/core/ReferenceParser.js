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
     * Parses a versification value string into one or more {chapter, verse, suffix?} entries.
     * Accepts:
     *   - "ch:v"       → [{chapter, verse}]
     *   - "ch:v1-v2"   → expanded to one entry per verse in range
     *   - "ch:v[a-z]"  → [{chapter, verse, suffix}]
     * Returns [] for unparseable input.
     */
    static expandVersificationValue(value) {
        if (typeof value !== "string" || !value.includes(":")) return []
        const [chPart, vPart] = value.split(":")
        const chapter = Number(chPart)
        if (!Number.isFinite(chapter)) return []

        // Range form "v1-v2" (no letter suffixes inside ranges)
        if (vPart.includes("-")) {
            const [a, b] = vPart.split("-").map((s) => Number(s.trim()))
            if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return []
            const out = []
            for (let v = a; v <= b; v++) out.push({ chapter, verse: v })
            return out
        }

        // Letter-suffix form "19b"
        const match = vPart.match(/^(\d+)([a-zA-Z]+)?$/)
        if (!match) return []
        const verse = Number(match[1])
        if (!Number.isFinite(verse)) return []
        const entry = { chapter, verse }
        if (match[2]) entry.suffix = match[2]
        return [entry]
    }

    /**
     * Parses found references into structured passage objects
     * @param {Array} foundReferences - Array of found references from scanner
     * @param {string} currentVersion - Current Bible version
     * @returns {Array} Array of parsed passage objects
     */
    parse(foundReferences, currentVersion = null) {
        return this.#splitChapterSwitchingRefs(foundReferences).map((reference) => {
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
                edition: this.#config.edition || "auto",
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

            // For single-chapter books (Jude, Philemon, Obadiah, 2-3 John) a bare number
            // is a verse, not a chapter ("Jude 4" = Jude 1:4). Let those fall through to
            // #parseReferenceParts → #parseSingleChapterBook, which interprets "1" as the
            // whole book and any other number as a verse. Non-single-chapter books keep
            // treating a bare number as a chapter via #handleEmptyReference.
            const isSingleChapterBook = PassageUtils.SINGLE_CHAPTER_BOOKS.some((b) => Object.keys(b)[0] === book)
            const isBareNumber = /^\d+$/.test(cleanReference)

            // Handle book-only or empty references
            if (!cleanReference && this.#config.booksOnly) {
                parsedPassage.type = ReferenceParser.REFERENCE_TYPES.BOOK_ONLY
            } else if (
                (!cleanReference || cleanReference.match(/^\d+\s*[:;]?\s*$/)) &&
                !(isSingleChapterBook && isBareNumber)
            ) {
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
     * Splits a chapter-switching comma reference (e.g. "Daniel 8:16-18,9:21,23,10:8-10")
     * into one reference per chapter group, so each is parsed by the single-chapter path.
     * Single-chapter comma lists ("9:21,23") and bare-verse lists ("1:1,2,3") are left as-is.
     * @private
     */
    #splitChapterSwitchingRefs(foundReferences) {
        const out = []
        for (const reference of foundReferences) {
            const groups = this.#chapterGroups(reference.reference)
            if (!groups) {
                out.push(reference)
            } else {
                for (const groupRef of groups) {
                    // Force the general parse path; #parseReferenceParts re-derives the real type.
                    out.push({
                        ...reference,
                        reference: groupRef,
                        type: ReferenceParser.REFERENCE_TYPES.CHAPTER_VERSE_RANGE,
                    })
                }
            }
        }
        return out
    }

    /**
     * Groups a post-book reference string by chapter. Returns one ref string per chapter group
     * (e.g. ["8:16-18", "9:21,23", "10:8-10"]) only when the list actually switches chapters;
     * returns null otherwise (no comma, single chapter, or a leading bare verse).
     * @private
     */
    #chapterGroups(reference) {
        if (typeof reference !== "string" || !reference.includes(",")) return null
        const parts = reference
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        const groups = []
        let current = null
        for (const part of parts) {
            const match = part.match(/^(\d+)\s*[:.]/)
            if (match) {
                const chapter = match[1]
                if (!current || current.chapter !== chapter) {
                    current = { chapter, parts: [] }
                    groups.push(current)
                }
                current.parts.push(part)
            } else {
                if (!current) return null // leading bare verse — leave to normal parsing
                current.parts.push(part)
            }
        }
        if (groups.length < 2) return null
        return groups.map((g) => g.parts.join(","))
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
        const computeConverted = (srcPassage, targetAbbr, options = {}) => {
            const versionObj = VersionHandler.getVersionObject(targetAbbr)
            const cloned = JSON.parse(JSON.stringify(srcPassage))
            cloned.version = versionObj

            // Resolve which LXX edition to consult. "rahlfs" prefers
            // versification.lxxRahlfs when present; "auto" (default) uses the
            // canonical lxx field, which by convention holds Göttingen where
            // attested and Rahlfs elsewhere (see src/data/lxx-editions.js).
            const edition =
                options.edition != null
                    ? String(options.edition).toLowerCase()
                    : srcPassage.edition || "auto"

            const resolveTargetKey = (versification) => {
                if (targetAbbr === "lxx" && edition === "rahlfs" && versification.lxxRahlfs !== undefined) {
                    return "lxxRahlfs"
                }
                return targetAbbr
            }

            // Remap chapters/verses according to versification, if present.
            // Versification values may be strict "ch:v", a range "ch:v1-v2",
            // a letter-suffixed verse "ch:v[a-z]", or "" / null when the verse
            // does not exist in the target version. We expand ranges and split
            // missing verses into cloned.missingPassages so summary fields
            // never contain NaN.
            const remapped = []
            const missing = []
            cloned.passages.forEach((sub) => {
                if (!sub.versification) {
                    remapped.push(sub)
                    return
                }
                const key = resolveTargetKey(sub.versification)
                if (!(key in sub.versification)) {
                    remapped.push(sub)
                    return
                }
                const target = sub.versification[key]
                if (target == null || target === "") {
                    missing.push({ ...sub, missingIn: targetAbbr })
                    return
                }
                const expanded = ReferenceParser.expandVersificationValue(target)
                if (expanded.length === 0) {
                    remapped.push(sub)
                    return
                }
                expanded.forEach((entry, idx) => {
                    const next = idx === 0 ? sub : JSON.parse(JSON.stringify(sub))
                    next.chapter = entry.chapter
                    next.verse = entry.verse
                    if (entry.suffix) next.verseSuffix = entry.suffix
                    remapped.push(next)
                })
            })
            cloned.passages = remapped
            if (missing.length > 0) cloned.missingPassages = missing

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

            const chapterEntries = {}
            cloned.passages.forEach((p) => {
                if (!chapterEntries[p.chapter]) chapterEntries[p.chapter] = []
                chapterEntries[p.chapter].push({ verse: p.verse, suffix: p.verseSuffix || "" })
            })

            const sortedChs = Object.keys(chapterEntries)
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

            const formatChapterVerses = (entries) => {
                const usable = entries.filter((e) => e.verse > 0)
                if (usable.length === 0) return []
                const sorted = [...usable].sort(
                    (a, b) => a.verse - b.verse || a.suffix.localeCompare(b.suffix)
                )
                if (sorted.some((e) => e.suffix)) {
                    // Letter-suffixed verses (Esther additions, Isa 63:19b, Dan 3:24a):
                    // do not range-merge - emit each as "<verse><suffix>" individually.
                    const seen = new Set()
                    const out = []
                    for (const e of sorted) {
                        const tag = `${e.verse}${e.suffix}`
                        if (seen.has(tag)) continue
                        seen.add(tag)
                        out.push(tag)
                    }
                    return out
                }
                return mergeRanges([...new Set(sorted.map((e) => e.verse))])
            }

            sortedChs.forEach((ch) => {
                const formatted = formatChapterVerses(chapterEntries[ch])
                if (formatted.length > 0) {
                    chapterStrs.push(`${ch}:${formatted.join(",")}`)
                }
            })

            if (chapterStrs.length === 0) {
                return cloned // no verses, return as-is
            }

            const firstCh = sortedChs[0]
            const lastCh = sortedChs[sortedChs.length - 1]
            cloned.chapter = firstCh

            const formattedFirst = formatChapterVerses(chapterEntries[firstCh] || [])
            cloned.verses = formattedFirst

            if (firstCh !== lastCh) {
                cloned.type = ReferenceParser.REFERENCE_TYPES.MULTI_CHAPTER_RANGE
                cloned.to = {
                    book: cloned.book,
                    chapter: lastCh,
                    verses: formatChapterVerses(chapterEntries[lastCh] || []),
                }
                cloned.original = `${cloned.book} ${chapterStrs.join("; ")}`
            } else {
                const hasRangeOrMultiple =
                    formattedFirst.length > 1 ||
                    (formattedFirst.length === 1 && formattedFirst[0].includes("-"))
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

        passage.getVersion = function (targetVersion, options = {}) {
            const targetAbbr = targetVersion.toLowerCase() === "bhs" ? "mt" : targetVersion.toLowerCase()
            return computeConverted(this, targetAbbr, options)
        }
        passage.getLXX = function (options = {}) {
            return this.getVersion("lxx", options)
        }
        passage.getLXXRahlfs = function () {
            return this.getVersion("lxx", { edition: "rahlfs" })
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
        passage.convertVersion = function (targetVersion, options = {}) {
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
            return computeConverted(this, targetAbbr, options)
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
