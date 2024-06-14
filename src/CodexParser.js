const bible = require("./bible")
const { bookRegex, chapterRegex, verseRegex, scripturesRegex } = require("./regex")
const abbrevations = require("./abbr")
const toc = require("./toc")
const crawler = require("bible-passage-reference-parser/js/en_bcv_parser").bcv_parser

class CodexParser {
    constructor() {
        this.found = []
        this.passages = []
        this.bible = bible
        this.bookRegex = bookRegex
        this.chapterRegex = chapterRegex
        this.verseRegex = verseRegex
        this.scripturesRegex = scripturesRegex
        this.abbrevations = abbrevations
        this.toc = toc
        this.crawler = new crawler({
            sequence_combination_strategy: "separate",
        })
    }

    /**
     * Scans the input text using the specified scriptures regex.
     *
     * @param {string} text - The text to scan.
     * @return {array} The found passages from the text.
     */
    scan(text) {
        const passages = this.crawler.parse(text).parsed_entities()
        this.found.push(...passages.flatMap((passage) => passage.entities))
    }

    /**
     * Parses the given reference to extract passages.
     *
     * @param {string} reference - The reference to parse.
     * @return {array} An array of parsed passages.
     */
    parse(reference) {
        if (!reference) {
            throw new Error("Reference is undefined");
        }
        this.found = [];
        this.passages = [];
        this.scan(reference);
        const uniqueBooks = [...new Set(this.found.map((passage) => passage.start.b))];

        for (const book of uniqueBooks) {
            const foundPassages = this.found.filter((passage) => passage.start.b === book);
            this.parsePassages(foundPassages);
        }

        return this.passages;
    }

    parsePassages(passages) {
        const initialPassage = passages.shift();
        const parsedPassage = this.parsePassage(initialPassage);
        this.passages.push(parsedPassage);

        for (const passage of passages) {
            const parsedSubPassage = this.parsePassage(passage);
            if (parsedPassage.chapter === parsedSubPassage.chapter) {
                parsedPassage.verses.push(...parsedSubPassage.verses);
            } else {
                this.passages.push(parsedSubPassage);
            }
        }
    }

    parsePassage(passage) {
        const { start, end, type, entities } = passage;
        const parsedPassage = {
            original: passage.osis,
            book: this.bookify(start.b),
            chapter: start.c,
            type,
            entities,
        };

        if (type === "range") {
            parsedPassage.verses = this.parseRange(start, end);
        } else {
            parsedPassage.verses = this.parseInteger(start, end);
        }

        return parsedPassage;
    }

    parseRange(start, end) {
        if (start.c !== end.c) {
            return [start.v, { book: this.bookify(end.b), chapter: end.c, verses: [end.v] }];
        }
        return [start.v + "-" + end.v];
    }

    parseInteger(start, end) {
        if (start.v !== end.v) {
            return [start.v, end.v];
        }
        return [start.v];
        return [start.v];
    chapterify(chapter) {
        if (chapter.type === "range") {
            return `${chapter.start.c} - ${chapter.end}`
        }
    }

    versify(passage, type) {
        if (type !== "range")
            return passage.start.v !== passage.end.v ? [passage.start.v, passage.end.v] : [passage.start.v]
        else return [passage.start.v + "-" + passage.end.v]
    }

    /**
     * Converts a book name to its corresponding full name from the bible.
     *
     * @param {string} book - The abbreviated or partial name of the book.
     * @return {string|undefined} The full name of the book if found, otherwise undefined.
     */
    bookify(book) {
        let bookified
        bookified = this.abbrevations[book]
        if (!bookified) {
            bookified = this.bible.new.find(
                (b) =>
                    b.charAt(0).toLowerCase() === book.charAt(0).toLowerCase() &&
                    b.toLowerCase().includes(book.toLowerCase())
            )
            if (!bookified) {
                bookified = this.bible.old.find(
                    (b) =>
                        b.charAt(0).toLowerCase() === book.charAt(0).toLowerCase() &&
                        b.toLowerCase().includes(book.toLowerCase())
                )
            }
        }
        return bookified
    }

    /**
     * Returns the passages stored in the object.
     *
     * @return {array} The passages stored in the object.
     */
    getPassages() {
        return this.passages
    }

    /**
     * @param {object} passage - A passage object
     */
    scripturize(passage) {
        const { book, chapter, verses, to } = passage
        const colon = verses.length !== 0 ? ":" : ""
        const parts = [book, chapter, colon, verses]
        if (to) {
            parts.push("-", to.chapter, ":", to.verses)
        }
        return parts
            .join(" ")
            .replace(/\s+:\s+/g, ":")
            .trim()
    }
}

module.exports = CodexParser
