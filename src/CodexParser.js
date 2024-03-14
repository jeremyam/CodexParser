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
        this.nt = false
        this.ot = false
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
     * @param {string} passage - the passage to be parsed
     * @return {Array|null} an array of matches or null if there are no matches
     */
    parse(passage) {
        this.scan(passage)
        for (let i = 0; i < this.found.length; i++) {
            const passage = {
                original: this.found[i],
                book: this.found[i].match(this.bookRegex)[0],
                chapter: this.found[i].replace(this.bookRegex).match(this.chapterRegex)[0].replace(":", "").trim(),
                verse: this.found[i].match(this.verseRegex)[0].replace(":", "").trim(),
            }
            if(/,/.test(passage.verse)){
                passage.verse = passage.verse.split(/,/)
            }
            this.passages.push(passage)
        }
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
