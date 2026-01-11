/**
 * CodexParser.js
 * A modern ES6+ class for scanning and parsing scripture references from text.
 * Supports various formats (single verses, ranges, multi-chapter references) with
 * validation and version-specific versification.
 */

const bible = require("../data/bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("../utils/regex")
const ScriptureScanner = require("./ScriptureScanner")
const ReferenceParser = require("./ReferenceParser")
const VersificationHandler = require("./VersificationHandler")
const PassageCollection = require("./PassageCollection")
const PassageUtils = require("../utils/PassageUtils")
const VersionHandler = require("./VersionHandler")
const chapter_verses = require("../utils/chapterVerseCombine")
const abbreviations = require("../format/abbr")

/**
 * Main class for parsing and validating scripture references
 * @class
 */
class CodexParser {
    // Private fields using ES6+ syntax
    #scanner
    #parser
    #versificationHandler
    #config
    #version
    #found
    #passages

    /**
     * Initializes the parser with configuration
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.#config = {
            booksOnly: config.booksOnly ?? false,
            invalid_sequence_strategy: config.invalid_sequence_strategy ?? "include",
            invalid_passage_strategy: config.invalid_passage_strategy ?? "include",
        }

        this.#scanner = new ScriptureScanner(this.#config)
        this.#parser = new ReferenceParser(this.#config)
        this.#versificationHandler = new VersificationHandler()
        this.#version = null
        this.#found = []
        this.#passages = []

        // Legacy public properties for backward compatibility
        this.bible = bible
        this.bookRegex = bookRegex
        this.chapterRegex = chapterRegex
        this.verseRegex = verseRegex
        this.scripturesRegex = scripturesRegex
        this.chapterVerses = chapter_verses
        this.abbreviations = abbreviations
        this.error = false

        // Legacy constants
        this.SINGLE_CHAPTER = "single_chapter"
        this.CHAPTER_VERSE = "chapter_verse"
        this.CHAPTER_VERSE_RANGE = "chapter_verse_range"
        this.COMMA_SEPARATED = "comma_separated_verses"
        this.CHAPTER_RANGE = "chapter_range"
        this.MULTI_CHAPTER_RANGE = "multi_chapter_verse_range"
    }

    /**
     * Gets the found references (legacy getter)
     */
    get found() {
        return this.#found
    }

    /**
     * Sets the found references (legacy setter)
     */
    set found(value) {
        this.#found = value
    }

    /**
     * Gets the parsed passages (legacy getter)
     */
    get passages() {
        return this.#passages
    }

    /**
     * Sets the parsed passages (legacy setter)
     */
    set passages(value) {
        this.#passages = value
    }

    /**
     * Gets the current version (legacy getter)
     */
    get version() {
        return this.#version
    }

    /**
     * Sets the current version (legacy setter)
     */
    set version(value) {
        this.#version = value
    }

    /**
     * Gets the current config (legacy getter)
     */
    get config() {
        return this.#config
    }

    /**
     * Sets the current config (legacy setter)
     */
    set config(value) {
        this.#config = value
    }

    /**
     * Sets configuration options for the parser
     * @param {Object} config - Configuration options
     * @param {boolean} [config.booksOnly=false] - Whether to capture book names without references
     * @returns {CodexParser} The parser instance for method chaining
     */
    options(config) {
        this.#config = {
            booksOnly: config.booksOnly ?? this.#config.booksOnly,
            invalid_sequence_strategy: config.invalid_sequence_strategy ?? this.#config.invalid_sequence_strategy,
            invalid_passage_strategy: config.invalid_passage_strategy ?? this.#config.invalid_passage_strategy,
        }

        // Update scanner and parser configs
        this.#scanner = new ScriptureScanner(this.#config)
        this.#parser = new ReferenceParser(this.#config)

        return this
    }

    /**
     * Retrieves available verses for a given book and chapter (legacy method)
     * @param {string} book - The book name
     * @param {number} chapter - The chapter number
     * @returns {number[]} Array of valid verse numbers
     */
    getChapterVerses(book, chapter) {
        return PassageUtils.getChapterVerses(book, chapter)
    }

    /**
     * Scans text for scripture references
     * @param {string} text - The text to scan
     * @returns {CodexParser} The parser instance for method chaining
     */
    scan(text) {
        this.#found = this.#scanner.scan(text)
        return this
    }

    /**
     * Sets the Bible version for parsing
     * @param {string} version - The version (e.g., "lxx", "mt", "eng")
     * @returns {CodexParser} The parser instance
     */
    bibleVersion(version) {
        this.#version = VersionHandler.normalizeVersion(version)
        return this
    }

    /**
     * Parses a scripture reference into structured passage objects
     * @param {string} reference - The reference to parse (e.g., "John 3:16")
     * @returns {CodexParser} The parser instance
     */
    parse(reference) {
        this.scan(reference)
        this.#passages = this.#parser.parse(this.#found, this.#version)
        this.#passages = this.#versificationHandler.applyVersification(this.#passages)
        return this
    }

    /**
     * Returns parsed passages with utility methods
     * @returns {PassageCollection} Collection of passages with utility methods
     */
    getPassages() {
        return PassageCollection.from(this.#passages)
    }

    /**
     * Returns the first parsed passage
     * @returns {Object|null} The first passage or null
     */
    first() {
        return this.#passages.length > 0 ? this.#passages[0] : null
    }

    /**
     * Normalizes book names using abbreviations or full names (legacy method)
     * @param {string|Array} book - The book name or array
     * @returns {string} Normalized book name
     */
    bookify(book) {
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
     * Combines multiple passages into a single reference
     * @param {Object[]} [passages=this.passages] - Array of passages to combine
     * @returns {Object} Combined passage object
     */
    combine(passages = this.#passages) {
        return PassageCollection.combinePassages(passages)
    }

    /**
     * Merges verses into ranges or comma-separated lists (legacy method)
     * @param {number[]} verses - Array of verse numbers
     * @returns {string[]} Array of verse strings
     */
    mergeRanges(verses) {
        return PassageUtils.mergeRanges(verses)
    }

    /**
     * Generates a table of contents for the Bible
     * @param {string} [version="ESV"] - The Bible version
     * @returns {Object} TOC with book-chapter-verse mappings
     */
    getToc(version = "ESV") {
        const toc = {}

        bible.old.forEach((book) => {
            if (chapter_verses[book]) {
                toc[book] = chapter_verses[book]
            }
        })

        bible.new.forEach((book) => {
            if (chapter_verses[book]) {
                toc[book] = chapter_verses[book]
            }
        })

        PassageUtils.SINGLE_CHAPTER_BOOKS.forEach((item) => {
            Object.keys(item).forEach((book) => {
                if (!toc[book]) {
                    toc[book] = item[book]
                }
            })
        })

        const orderedToc = {}
        const canonicalOrder = [...bible.old, ...bible.new]
        canonicalOrder.forEach((book) => {
            if (toc[book]) {
                orderedToc[book] = toc[book]
            }
        })

        return orderedToc
    }

    /**
     * Replaces scripture references in text with formatted references
     * @param {string} text - The original text
     * @param {boolean} useAbbreviations - Whether to use abbreviated book names
     * @returns {string} Text with replaced references
     */
    replace(text, useAbbreviations = true) {
        if (!this.#passages.length) {
            return text
        }

        let result = text
        for (let i = this.#passages.length - 1; i >= 0; i--) {
            const passage = this.#passages[i]
            const { originalText, abbr, original } = passage
            const newReference = useAbbreviations ? abbr : original

            const regex = new RegExp(`${originalText.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")}`, "g")

            const matches = [...result.matchAll(regex)]
            if (matches.length > 0) {
                for (let j = matches.length - 1; j >= 0; j--) {
                    const match = matches[j]
                    const startIndex = match.index
                    const endIndex = startIndex + match[0].length
                    const leadingSpace = match[1] || ""
                    const hasOpeningParen = match[2] === "("
                    const hasClosingParen = match[3] === ")"
                    const trailingSpace = match[4] || " "
                    const replacement =
                        hasOpeningParen && hasClosingParen
                            ? `${leadingSpace}(${newReference})${trailingSpace}`
                            : `${leadingSpace}${newReference}${trailingSpace}`
                    result = result.slice(0, startIndex) + replacement + result.slice(endIndex)
                }
            }
        }

        return result
    }

    /**
     * Checks if all references in the passages array are from the same book
     * @returns {boolean} True if all passages are from the same book
     */
    same() {
        if (this.#passages.length <= 1) {
            return true
        }

        const firstBook = this.#passages[0].book.toLowerCase()
        return this.#passages.every((passage) => passage.book.toLowerCase() === firstBook)
    }

    // Legacy methods for backward compatibility

    /**
     * Expands verse references into individual verse objects (legacy)
     */
    expandVerses(book, chapter, verses) {
        return PassageUtils.expandVerses(book, chapter, verses)
    }

    /**
     * Applies versification differences to parsed passages (legacy)
     */
    versification() {
        this.#passages = this.#versificationHandler.applyVersification(this.#passages)
    }
}

module.exports = CodexParser
