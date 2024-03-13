import { bible } from "./bible.js"
export default class CodexParser {
    
    /**
     * Constructor for creating an instance of the class.
     */
    constructor() {
        this.passages = []
        this.bible = bible
    }

    parse(passage) {
        console.log(passage)
    }
}
