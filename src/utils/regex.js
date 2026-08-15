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

const bookRegex = new RegExp(`(${bookAlternation})`, "gim")

// "Ez" is ambiguous (Ezra/Ezekiel); historically matched only when not
// followed by another letter.
const EzraAbbrv = /(Ez)(?![a-zA-Z])/gim

const chapterRegex = /(\d+)(?=[:.])/gim
const verseRegex = /(?<=[:.])[\d: .\-]+(?:, ?[\d\-]+)*(?<![ .])/gim
const chapterVerseRange =
    /(.?\s?\d+((?:[:.]\d+)?(\s?[-–—]\s?)?(?:\d+)(?:(,\s?\d+)*)?\S([:.]?\d+)?(,?\s?\d+[–—-]\s?\d+,?\d+)?)?(?:[:.]\d+)?(?:[abcde])?(?:,\s?\d+)*(?:[-–—]\d?\s?)?)(?:[:.]\d+[–-—]\s?\d+,?\s?\d+)?/gim

const scripturesRegex = new RegExp(`(${bookAlternation}|${EzraAbbrv.source})(${chapterVerseRange.source})`, "gmi")

module.exports.bookRegex = new RegExp(`(${bookAlternation}|${EzraAbbrv.source})`, "gmi")
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.verseRegex = verseRegex
module.exports.EzraAbbrv = EzraAbbrv
