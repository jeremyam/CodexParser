/**
 * Type definitions for codexparser.
 * Mirrors the runtime shapes produced by src/core/ReferenceParser.js and
 * src/core/PassageCollection.js.
 */

declare namespace CodexParser {
    type VersionAbbreviation = "eng" | "lxx" | "mt" | "bhs"

    type Edition = "auto" | "rahlfs"

    interface Version {
        name: string
        value: string
        abbreviation: string
    }

    type ReferenceType =
        | "single_chapter"
        | "chapter_verse"
        | "chapter_verse_range"
        | "comma_separated_verses"
        | "chapter_range"
        | "multi_chapter_verse_range"
        | "book_only"

    /**
     * Cross-version verse mapping. Values are "chapter:verse" strings
     * (optionally a range "ch:v1-v2" or letter-suffixed "ch:19b"), or
     * null/"" when the verse does not exist in that version.
     */
    interface Versification {
        eng?: string | null
        lxx?: string | null
        lxxRahlfs?: string | null
        mt?: string | null
    }

    interface VersePassage {
        book: string
        chapter: number
        verse: number
        /** Letter suffix for verses like Esther 1:1a or Isaiah 63:19b. */
        verseSuffix?: string
        versification?: Versification
        /** Set on entries in missingPassages: the version the verse is absent from. */
        missingIn?: string
    }

    interface PassagePoint {
        book: string
        chapter: number
        verse: number
    }

    interface Scripture {
        /** Human-readable passage, e.g. "Genesis 1:1-5". */
        passage: string
        /** Chapter:verse portion, e.g. "1:1-5". */
        cv: string
        /** OSIS-style hash, e.g. "Gen.1.1-Gen.1.5". */
        hash: string
        /** Numeric verse-id form, e.g. "1001001-1001005". */
        osisNumeric?: string
    }

    interface ValidationError {
        error: true
        /** 101 invalid chapter, 102 chapter does not exist, 104 verse does not exist. */
        code: number
        message: {
            verse_exists: boolean
            chapter_exists: boolean
            content: string
        }
    }

    type ValidationResult = true | ValidationError

    interface RangeEnd {
        book: string
        chapter: number
        verses: Array<string | number>
    }

    interface Passage {
        /** The reference as understood, e.g. "1 Corinthians 13:4-7". */
        original: string
        book: string
        chapter: number | null
        verses: Array<string | number>
        type: ReferenceType
        testament: "old" | "new"
        /** Start offset of the reference in the scanned text. */
        startIndex: number
        /** End offset (exclusive) of the reference in the scanned text. */
        endIndex: number
        /** The exact source text of the reference: text.slice(startIndex, endIndex). */
        originalText: string
        version: Version
        edition: Edition
        passages: VersePassage[]
        /** Verses that do not exist in the target version after conversion. */
        missingPassages?: VersePassage[]
        scripture: Scripture
        valid: ValidationResult
        start: PassagePoint | null
        end: PassagePoint | null
        /** SBL-style abbreviation, e.g. "1 Cor. 13:4-7". */
        abbr: string
        /** End of a chapter range / multi-chapter range. */
        to?: RangeEnd

        getVersion(targetVersion: string, options?: { edition?: Edition }): Passage
        getLXX(options?: { edition?: Edition }): Passage
        getLXXRahlfs(): Passage
        getMT(): Passage
        getBHS(): Passage
        getEnglish(): Passage
        convertVersion(targetVersion: string, options?: { edition?: Edition }): Passage
    }

    interface Config {
        /** Capture bare book names (no chapter/verse) as book_only passages. */
        booksOnly?: boolean
        invalid_sequence_strategy?: "include" | "exclude"
        invalid_passage_strategy?: "include" | "exclude"
        edition?: Edition
    }

    interface FoundReference {
        book: string
        reference: string
        startIndex: number
        endIndex: number
        version: string | null
        type: ReferenceType
        originalText: string
    }

    class PassageCollection extends Array<Passage> {
        first(): Passage | null
        oldTestament(): PassageCollection
        newTestament(): PassageCollection
        combine(options?: { book?: boolean; chapter?: boolean }): PassageCollection
        getVersion(targetVersion: string): PassageCollection
        getLXX(): PassageCollection
        getMT(): PassageCollection
        getBHS(): PassageCollection
        getEnglish(): PassageCollection
        static combinePassages(passages: Passage[]): Passage
    }
}

declare class CodexParser {
    constructor(config?: CodexParser.Config)

    /** Parsed passages from the last parse() call. */
    passages: CodexParser.Passage[]
    /** Raw scan results from the last scan() call. */
    found: CodexParser.FoundReference[]
    version: string | null
    config: CodexParser.Config
    error: boolean

    /** Sets configuration options. */
    options(config: CodexParser.Config): this
    /** Sets the LXX edition preference ("auto" or "rahlfs"). */
    edition(edition: CodexParser.Edition): this
    /** Sets the Bible version used for parsing ("eng", "lxx", "mt", "bhs"). */
    bibleVersion(version: string): this
    /** Scans text for scripture references without parsing them. */
    scan(text: string): this
    /** Parses a reference or free text into structured passage objects. */
    parse(reference: string): this
    /** Returns the parsed passages as a PassageCollection. */
    getPassages(): CodexParser.PassageCollection
    /** Returns the first parsed passage, or null. */
    first(): CodexParser.Passage | null
    /** Normalizes a book name or abbreviation to its full name. */
    bookify(book: string | string[]): string
    /** Combines multiple passages into a single passage. */
    combine(passages?: CodexParser.Passage[]): CodexParser.Passage
    /** Merges verse numbers into range strings, e.g. [1,2,3,5] -> ["1-3","5"]. */
    mergeRanges(verses: number[]): string[]
    /** Returns valid verse numbers for a book chapter. */
    getChapterVerses(book: string, chapter: number): number[]
    /** Returns a book -> chapter -> verses table of contents. */
    getToc(version?: string): Record<string, Record<number, number[]>>
    /** Replaces scripture references in text with formatted references. */
    replace(text: string, useAbbreviations?: boolean): string
    /** True when all parsed passages share the same book. */
    same(): boolean
    /** Expands verses/ranges into individual verse objects. */
    expandVerses(
        book: string,
        chapter: number,
        verses: Array<string | number>
    ): CodexParser.VersePassage[]
}

export = CodexParser
