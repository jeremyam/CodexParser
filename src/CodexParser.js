import { bible } from "./bible.js"
import * as regex from "./regex.js"
export default class CodexParser {
    /**
     * Constructor for creating an instance of the class.
     */
    constructor() {
        this.passages = []
        this.bible = bible
        this.nt = false
        this.ot = false
        this.bookRegex = regex.books
        this.bookAbbrRegex = regex.abbrBooks
        this.scripturesRegex = regex.scripturesRegex
    }
    /**
     * Parses the passage using the bookRegex.
     *
     * @param {string} passage - the passage to be parsed
     * @return {Array|null} an array of matches or null if there are no matches
     */
    parse(passage) {    
        this.scan(passage)
    }
    
    scan(text) {
        this.passages = text.match(this.scripturesRegex)
    }
}
