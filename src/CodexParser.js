import { bible } from "./bible.js"
import * as regex from "./regex.js"
export default class CodexParser {
    /**
     * Constructor for creating an instance of the class.
     */
    constructor() {
        this.found = []
        this.passages = []
        this.bible = bible
        this.bookRegex = regex.books
        this.bookAbbrRegex = regex.abbrBooks
        this.chapterRegex = regex.chapter
        this.verseRegex = regex.verse
        this.scripturesRegex = regex.scripturesRegex
        this.abbrScripturesRegex = regex.abbrScripturesRegex
    }
    /**
     * Parses the passage using the bookRegex.
     *
     * @param {string} reference - the passage to be parsed
     * @return {Array|null} an array of matches or null if there are no matches
     */
    parse(reference) {
        this.passages = []
        this.scan(reference)
        for (let i = 0; i < this.found.length; i++) {
            const book = this.found[i].match(this.bookRegex)
            const chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)
            const passage = {
                original: this.found[i],
                book: book[0],
                chapter: chapter[0].replace(":", "").trim(),
                verse: this.found[i].match(this.verseRegex)[0].replace(":", "").trim(),
            }
            passage.verse = passage.verse.split(/,/).filter(Boolean)
            passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
            this.passages.push(passage)
        }
        this.found = []
    }

    /**
     * Scans the input text and stores the matching passages in the 'passages' property.
     *
     * @param {string} text - The input text to scan.
     * @return {Array}
     */
    scan(text) {
        this.found = text.match(this.scripturesRegex)
        return this.found
    }

    /**
     * Get the passages.
     *
     * @return {Array} The passages.
     */
    getPassages() {
        return this.passages
    }
}
