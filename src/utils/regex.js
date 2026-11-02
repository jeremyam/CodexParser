/**
 * regex.js
 * Book-matching regexes generated from the canonical data in
 * src/data/bible.js and src/format/abbr.js, so there is a single source of
 * truth for recognized book names. Note the scanner (ScriptureScanner)
 * matches against the same lists directly; these regexes are exported for
 * consumers of the legacy CodexParser properties.
 */

const bible = require("../data/bible")
const abbreviations = require("../format/abbr")

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// All recognized book tokens, longest first so alternation prefers the most
// specific match ("1 Corinthians" before "1 Cor" before "Cor").
const bookTokens = [
    ...new Set([
        ...bible.old,
        ...bible.new,
        ...(bible.deuterocanonical || []),
        ...Object.keys(abbreviations),
    ]),
].sort((a, b) => b.length - a.length || a.localeCompare(b))

const bookAlternation = bookTokens.map(escapeRegex).join("|")

// A book starts a word; a digit may precede it ("2Sam"). Matches ScriptureScanner.
const wordStart = "(?<![\\p{L}\\p{M}])"

const bookRegex = new RegExp(`${wordStart}(${bookAlternation})`, "gimu")

// "Ez" (Ezekiel in NA and Muraoka, and in src/format/abbr.js) matches only when
// not followed by another letter.
const EzraAbbrv = /(Ez)(?![a-zA-Z])/gim

const chapterRegex = /(\d+)(?=[:.])/gim
const verseRegex = /(?<=[:.])[\d: .\-]+(?:, ?[\d\-]+)*(?<![ .])/gim
const chapterVerseRange =
    /(.?\s?\d+((?:[:.]\d+)?(\s?[-–—]\s?)?(?:\d+)(?:(,\s?\d+)*)?\S([:.]?\d+)?(,?\s?\d+[–—-]\s?\d+,?\d+)?)?(?:[:.]\d+)?(?:[abcde])?(?:,\s?\d+)*(?:[-–—]\d?\s?)?)(?:[:.]\d+[–-—]\s?\d+,?\s?\d+)?/gim

const scripturesRegex = new RegExp(`${wordStart}(${bookAlternation}|${EzraAbbrv.source})(${chapterVerseRange.source})`, "gmiu")

module.exports.bookRegex = new RegExp(`${wordStart}(${bookAlternation}|${EzraAbbrv.source})`, "gmiu")
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.verseRegex = verseRegex
module.exports.EzraAbbrv = EzraAbbrv
