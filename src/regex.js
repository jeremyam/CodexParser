const bookRegex =
    /[gG]e(?:\w+)?|[eE]x(?:\w+)?|[lL]e(?:[a-zA-Z]+)?|[nN]u(?:[a-zA-Z]+)?|[dD]e(?:[a-zA-Z]+)?|[jJ]o(?:[a-zA-Z]+)?|[jJ]u(?:[a-zA-Z]+)?|[rR]u(?:[a-zA-Z]+)?|1\s?[sS](?:[a-zA-Z]+)?|2\s?[sS](?:[a-zA-Z]+)?|1\s?[kK](?:[a-zA-Z]+)?|2\s?[kK](?:[a-zA-Z]+)?|1\s?[cC]hr(?:[a-zA-Z]+)?|2\s?[cC]hr(?:[a-zA-Z]+)?|[eE]z(?:[a-zA-Z]+)?|[nN]e(?:[a-zA-Z]+)?|[eE]s(?:[a-zA-Z]+)?|[jJ](?:[a-zA-Z]+)?|[pP]s(?:[a-zA-Z]+)?|[pP]r(?:[a-zA-Z]+)?|[eE|Qoh](?:[a-zA-Z]+)?|[sS]o(?:[a-zA-Z]+)?|[iI]s(?:[a-zA-Z]+)?|[jJ]e(?:[a-zA-Z]+)?|[lL]a(?:[a-zA-Z]+)?|[eE]z(?:[a-zA-Z]+)?|[dD](?:[a-zA-Z]+)?|[hH]o(?:[a-zA-Z]+)?|[jJ](?:[a-zA-Z]+)?|[aA]m(?:[a-zA-Z]+)?|[oO]b(?:[a-zA-Z]+)?|[jJ](?:[a-zA-Z]+)?|[mM](?:[a-zA-Z]+)?|[nN](?:[a-zA-Z]+)?|[hH]a(?:[a-zA-Z]+)?|[zZ](?:[a-zA-Z]+)?|[hH]a(?:[a-zA-Z]+)?|[zZ]e(?:[a-zA-Z]+)?|[mM]a(?:[a-zA-Z]+)?|[mM](?:[a-zA-Z]+)?|[mM](?:[a-zA-Z]+)?|[lL](?:[a-zA-Z]+)?|[jJ](?:[a-zA-Z]+)?|[aA](?:[a-zA-Z]+)?|[rR](?:[a-zA-Z]+)?|1\s?[cC]o(?:[a-zA-Z]+)?|2\s?[cC]o(?:[a-zA-Z]+)?|[gG](?:[a-zA-Z]+)?|[eE](?:[a-zA-Z]+)?|[pP]h(?:[a-zA-Z]+)?|[cC](?:[a-zA-Z]+)?|1\s?[tT]h(?:[a-zA-Z]+)?|2\s?[tT]h(?:[a-zA-Z]+)?|1\s?[tT](?:[a-zA-Z]+)?|2\s?[tT](?:[a-zA-Z]+)?|[tT]i(?:[a-zA-Z]+)?|[pP]h(?:[a-zA-Z]+)?|[hH](?:[a-zA-Z]+)?|[jJ]a(?:[a-zA-Z]+)?|1\s?[pP](?:[a-zA-Z]+)?|2\s?[pP](?:[a-zA-Z]+)?|1\s?[jJ](?:[a-zA-Z]+)?|2\s?[jJ](?:[a-zA-Z]+)?|3\s?[jJ](?:[a-zA-Z]+)?|[jJ](?:[d|ude]+)?|[Rr|Aa](?:[a-zA-Z]+)?/gim
const chapterRegex = /\b(?:\.?\s?\d+[:|\.]?)\b/gm
const verseRegex = /\b[:.](\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+\b/gm
const chapterRange = /.?\s?(?:[-—–])\s?/gm
const chapterRangeVerseRegex = /(?:.\d+)?/gm
const chapterVerseRange =
    /.?\s?\d+((?:[:.]\d+)?(\s?[-–—]\s?)?(?:\d+)(?:(,\s\d+)*)?([:.]?\d+)?(,\s?\d+[–—-]\s?\d+)?)?/gim
const scripturesRegex = new RegExp(`(${bookRegex.source})(${chapterVerseRange.source})`, "gmi")

module.exports.bookRegex = bookRegex
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.verseRegex = verseRegex
