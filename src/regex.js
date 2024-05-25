const bookRegex =
    /(?:(?:[gG]e(?:[a-zA-Z])?|[eE]x(?:[a-zA-Z])?|[lL]e(?:[a-zA-Z])?|[nN]u(?:[a-zA-Z])?|[dD]e(?:[a-zA-Z])?|[jJ]o(?:[a-zA-Z])?|[jJ]u(?:[a-zA-Z])?|[rR]u(?:[a-zA-Z])?|1\s?[sS](?:[a-zA-Z])?|2\s?[sS](?:[a-zA-Z])?|1\s?[kK](?:[a-zA-Z])?|2\s?[kK](?:[a-zA-Z])?|1\s?[cC]hr(?:[a-zA-Z])?|2\s?[cC]hr(?:[a-zA-Z])?|[eE]z(?:[a-zA-Z])?|[nN]e(?:[a-zA-Z])?|[eE]s(?:[a-zA-Z])?|[jJ](?:[a-zA-Z])?|[pP]s(?:[a-zA-Z])?|[pP]r(?:[a-zA-Z])?|[eE|Qoh](?:[a-zA-Z])?|[sS]o(?:[a-zA-Z])?|[iI]s(?:[a-zA-Z])?|[jJ]e(?:[a-zA-Z])?|[lL]a(?:[a-zA-Z])?|[eE]z(?:[a-zA-Z])?|[dD](?:[a-zA-Z])?|[hH]o(?:[a-zA-Z])?|[jJ](?:[a-zA-Z])?|[aA](?:[a-zA-Z])?|[oO](?:[a-zA-Z])?|[jJ](?:[a-zA-Z])?|[mM](?:[a-zA-Z])?|[nN](?:[a-zA-Z])?|[hH]a(?:[a-zA-Z])?|[zZ](?:[a-zA-Z])?|[hH]a(?:[a-zA-Z])?|[zZ]e(?:[a-zA-Z])?|[mM]a(?:[a-zA-Z])?|[mM](?:[a-zA-Z])?|[mM](?:[a-zA-Z])?|[lL](?:[a-zA-Z])?|[jJ](?:[a-zA-Z])?|[aA](?:[a-zA-Z])?|[rR](?:[a-zA-Z])?|1\s?[cC]o(?:[a-zA-Z])?|2\s?[cC]o(?:[a-zA-Z])?|[gG](?:[a-zA-Z])?|[eE](?:[a-zA-Z])?|[pP]h(?:[a-zA-Z])?|[cC](?:[a-zA-Z])?|1\s?[tT]h(?:[a-zA-Z])?|2\s?[tT]h(?:[a-zA-Z])?|1\s?[tT](?:[a-zA-Z])?|2\s?[tT](?:[a-zA-Z])?|[tT](?:[a-zA-Z])?|[pP]h(?:[a-zA-Z])?|[hH](?:[a-zA-Z])?|[jJ](?:[a-zA-Z])?|1\s?[pP](?:[a-zA-Z])?|2\s?[pP](?:[a-zA-Z])?|1\s?[jJ](?:[a-zA-Z])?|2\s?[jJ](?:[a-zA-Z])?|3\s?[jJ](?:[a-zA-Z])?|[jJ](:[a-zA-Z])?|[Rr|Aa](?:[a-zA-Z])?))/gim
const bookAbbrRegex =
    /(?:(?:[gG]en|[eE]xo|[lL]ev|[nN]um|[dD]eu|[jJ]os|[jJ]dg|[rR]ut|1 [sS]a|2 [sS]a|1 [kK]gs|2 [kK]gs|1 [cC]hr|2 [cC]hr|[eE]zr|[nN]eh|[eE]st|[jJ]ob|[pP]sa|[pP]ro|[eE]cc|[sS]on|[iI]sa|[jJ]er|[lL]am|[eE]ze|[dD]an|[hH]os|[jJ]oe|[aA]mo|[oO]ba|[jJ]on|[mM]ic|[nN]ah|[hH]ab|[zZ]ep|[hH]ag|[zZ]ec|[mM]al|[mM]att|[mM]ar|[lL]uk|[jJ]oh|[aA]ct|[rR]om|1 [cC]or|2 [cC]or|[gG]al|[eE]ph|[pP]hi|[cC]ol|1 [tT]hess|2 [tT]hess|1 [tT]i|2 [tT]i|[tT]it|[pP]hm|[hH]eb|[jJ]am|1 [pP]e|2 [pP]e|1 [jJ]o|2 [jJ]o|3 [jJ]o|[jJ]ud|[rR]ev))/gim
const chapterRegex = /(?:\s?\d+:?)/g
const verseRegex = /\b[:|.]\s*?(\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?!p|j|k|s|c|t)\b/g
const scripturesRegex = new RegExp(`(${bookRegex.source})(${chapterRegex.source})?(${verseRegex.source})`, "gm")
const abbrScripturesRegex = new RegExp(`(${bookAbbrRegex.source})(${chapterRegex.source})?(${verseRegex.source})`, "gm")

module.exports.bookRegex = bookRegex
module.exports.bookAbbrRegex = bookAbbrRegex
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.abbrScripturesRegex = abbrScripturesRegex
module.exports.verseRegex = verseRegex