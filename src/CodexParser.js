import { bible } from "./bible.js"
import { bookRegex, bookAbbrRegex, chapterRegex, verseRegex, scripturesRegex, abbrScripturesRegex } from "./regex.js"

class CodexParser {
    constructor() {
        this.found = []
        this.passages = []
        this.bible = bible
        this.bookRegex = bookRegex
        this.bookAbbrRegex = bookAbbrRegex
        this.chapterRegex = chapterRegex
        this.verseRegex = verseRegex
        this.scripturesRegex = scripturesRegex
        this.abbrScripturesRegex = abbrScripturesRegex
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        this.found = text.match(this.scripturesRegex)
        return this.found
    }

    /**
     * Parses the given reference to extract passages.
     *
     * @param {string} reference - The reference to parse.
     * @return {array} An array of parsed passages.
     */
    parse(reference) {
        if (!reference) {
            return null // return null if no reference is provided
        }
        this.passages = []
        this.scan(reference)
        for (let i = 0; i < this.found.length; i++) {
            const book = this.found[i].match(this.bookRegex)
            const chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)
            const passage = {
                original: this.found[i],
                book: book[0].charAt(0).toUpperCase() + book[0].slice(1),
                chapter: chapter[0].replace(":", "").trim(),
                verse: this.found[i].match(this.verseRegex)[0].replace(":", "").trim(),
            }
            passage.verse = passage.verse.split(/,/).filter(Boolean)
            passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
            this.passages.push(passage)
        }
        this.found = []
        return this.passages
    }
    //TODO: Need to create a bookfiy function that will convert abbreviated books into full books
    /**
     * Returns the passages stored in the object.
     *
     * @return {array} The passages stored in the object.
     */
    getPassages() {
        return this.passages
    }
}

export default CodexParser
