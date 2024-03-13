import { bible } from "./bible.js"
export default class CodexParser {
    /**
     * Constructor for creating an instance of the class.
     */
    constructor() {
        this.passages = []
        this.bible = bible
        this.nt = false
        this.ot = false
        this.bookRegex = /(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Psalms|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\b/g
        this.bookAbbrRegex = /\b(Gen|Exo|Lev|Num|Deu|Jos|Jdg|Rut|1 Sa|2 Sa|1 Ki|2 Ki|1 Ch|2 Ch|Ezr|Neh|Est|Job|Psa|Pro|Ecc|Son|Isa|Jer|Lam|Eze|Dan|Hos|Joe|Amo|Oba|Jon|Mic|Nah|Hab|Zep|Hag|Zec|Mal|Mat|Mar|Luk|Joh|Act|Rom|1 Co|2 Co|Gal|Eph|Phi|Col|1 Th|2 Th|1 Ti|2 Ti|Tit|Phm|Heb|Jam|1 Pe|2 Pe|1 Jo|2 Jo|3 Jo|Jud|Rev)\b/g;
        this.regex = /\s*[0-9]+(?::[0-9]+)?(?:\s*-\s*[0-9]+(?::[0-9]+)?)?/
    }
    /**
     * Parses the passage using the bookRegex.
     *
     * @param {string} passage - the passage to be parsed
     * @return {Array|null} an array of matches or null if there are no matches
     */
    parse(passage) {
        return passage.match(this.bookRegex)
    }
}
