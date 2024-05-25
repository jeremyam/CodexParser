const bookRegex =
    /(?:(?:[gG]en(?:esis)?|[eE]xod(?:us)?|[lL]ev(?:iticus)?|[nN]um(?:bers)?|[dD]eu(?:teronomy)?|[jJ]os(?:hua)?|[jJ]dg(?:es)?|[rR]ut(?:h)?|1 [sS]a(?:muel)?|2 [sS]a(?:muel)?|1 [kK]gs(?:on)?|2 [kK]gs(?:on)?|1 [cC]hr(?:onicles)?|2 [cC]hr(?:onicles)?|[eE]zr(?:a)?|[nN]eh(?:emiah)?|[eE]st(?:her)?|[jJ]ob|[pP]sa(?:lms)?|[pP]ro(?:verbs)?|[eE]cc(?:lesiastes)?|[sS]on(?:g)?|[iI]sa(?:iah)?|[jJ]er(?:emiah)?|[lL]am(?:entations)?|[eE]ze(?:riah)?|[dD]an(?:iel)?|[hH]o(?:sea)?|[jJ]oe(?:l)?|[aA]mo(?:s)?|[oO]ba(?:h)?|[jJ]on(?:ah)?|[mM]i(?:cah)?|[nN]ah(?:um)?|[hH]ab(?:akkuk)?|[zZ]ep(?:haniah)?|[hH]ag(?:gai)?|[zZ]ec(?:hariah)?|[mM]al(?:achi)?|[mM]at(?:thew)?|[mM]ar(?:k)?|[lL]uk(?:e)?|[jJ]oh(?:n)?|[aA]ct(?:s)?|[rR]o(?:m)?(?:ans)?|1 [cC]or(?:inthians)?|2 [cC]or(?:inthians)?|[gG]al(?:atians)?|[eE]ph(?:esians)?|[pP]hi(?:lippians)?|[cC]ol(?:ossians)?|1 [tT]hess(?:alonians)?|2 [tT]hess(?:alonians)?|1 [tT]i(?:mothy)?|2 [tT]i(?:mothy)?|[tT]it(?:us)?|[pP]h(?:ilemon)?|[hH]eb(?:rews)?|[jJ]am(?:es)?|1 [pP]e(?:ter)?|2 [pP]e(?:ter)?|1 [jJ]o(?:n)?|2 [jJ]o(?:n)?|3 [jJ]o(?:n)?|[jJ]ude?|Rev(?:elation)?))/gim
const bookAbbrRegex =
    /(?:(?:[gG]en|[eE]xo|[lL]ev|[nN]um|[dD]eu|[jJ]os|[jJ]dg|[rR]ut|1 [sS]a|2 [sS]a|1 [kK]gs|2 [kK]gs|1 [cC]hr|2 [cC]hr|[eE]zr|[nN]eh|[eE]st|[jJ]ob|[pP]sa|[pP]ro|[eE]cc|[sS]on|[iI]sa|[jJ]er|[lL]am|[eE]ze|[dD]an|[hH]os|[jJ]oe|[aA]mo|[oO]ba|[jJ]on|[mM]ic|[nN]ah|[hH]ab|[zZ]ep|[hH]ag|[zZ]ec|[mM]al|[mM]att|[mM]ar|[lL]uk|[jJ]oh|[aA]ct|[rR]om|1 [cC]or|2 [cC]or|[gG]al|[eE]ph|[pP]hi|[cC]ol|1 [tT]hess|2 [tT]hess|1 [tT]i|2 [tT]i|[tT]it|[pP]hm|[hH]eb|[jJ]am|1 [pP]e|2 [pP]e|1 [jJ]o|2 [jJ]o|3 [jJ]o|[jJ]ud|[rR]ev))/gim
const chapterRegex = /(?:\s?\d+:?)/g
const verseRegex = /\b:\s*?(\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?!p|j|k|s|c|t)\b/g
const scripturesRegex = new RegExp(`(${bookRegex.source})(${chapterRegex.source})?(${verseRegex.source})`, "gm")
const abbrScripturesRegex = new RegExp(`(${bookAbbrRegex.source})(${chapterRegex.source})?(${verseRegex.source})`, "gm")

module.exports.bookRegex = bookRegex
module.exports.bookAbbrRegex = bookAbbrRegex
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.abbrScripturesRegex = abbrScripturesRegex
module.exports.verseRegex = verseRegex