/**
 * Constructor for creating an instance of the class.
 *
 * @constructor
 * @param {object} bible - The bible object.
 * @param {object} regex - The regex object containing book, abbrBooks, chapter, verse, scripturesRegex, and abbrScripturesRegex.
 * @property {array} found - The array to store found passages.
 * @property {array} passages - The array to store passages.
 * @property {object} bible - The bible object.
 * @property {object} bookRegex - The regex for book names.
 * @property {object} bookAbbrRegex - The regex for abbreviated book names.
 * @property {object} chapterRegex - The regex for chapters.
 * @property {object} verseRegex - The regex for verses.
 * @property {object} scripturesRegex - The regex for scriptures.
 * @property {object} abbrScripturesRegex - The regex for abbreviated scriptures.
 */
function CodexParser() {
    this.found = []
    this.passages = []
    this.bible = {
        old: [
            "Genesis",
            "Exodus",
            "Leviticus",
            "Numbers",
            "Deuteronomy",
            "Joshua",
            "Judges",
            "Ruth",
            "1 Samuel",
            "2 Samuel",
            "1 Kings",
            "2 Kings",
            "1 Chronicles",
            "2 Chronicles",
            "Ezra",
            "Nehemiah",
            "Esther",
            "Job",
            "Psalms",
            "Proverbs",
            "Ecclesiastes",
            "Song of Solomon",
            "Isaiah",
            "Jeremiah",
            "Lamentations",
            "Ezekiel",
            "Daniel",
            "Hosea",
            "Joel",
            "Amos",
            "Obadiah",
            "Jonah",
            "Micah",
            "Nahum",
            "Habakkuk",
            "Zephaniah",
            "Haggai",
            "Zechariah",
            "Malachi",
        ],
        new: [
            "Matthew",
            "Mark",
            "Luke",
            "John",
            "Acts",
            "Romans",
            "1 Corinthians",
            "2 Corinthians",
            "Galatians",
            "Ephesians",
            "Philippians",
            "Colossians",
            "1 Thessalonians",
            "2 Thessalonians",
            "1 Timothy",
            "2 Timothy",
            "Titus",
            "Philemon",
            "Hebrews",
            "James",
            "1 Peter",
            "2 Peter",
            "1 John",
            "2 John",
            "3 John",
            "Jude",
            "Revelation",
        ],
    }

    this.bookRegex =
        /(?:(?:[gG]en(?:esis)?|[eE]xod(?:us)?|[lL]ev(?:iticus)?|[nN]um(?:bers)?|[dD]eu(?:teronomy)?|[jJ]os(?:hua)?|[jJ]dg(?:es)?|[rR]ut(?:h)?|1 [sS]a(?:muel)?|2 [sS]a(?:muel)?|1 [kK]gs(?:on)?|2 [kK]gs(?:on)?|1 [cC]hr(?:onicles)?|2 [cC]hr(?:onicles)?|[eE]zr(?:a)?|[nN]eh(?:emiah)?|[eE]st(?:her)?|[jJ]ob|[pP]sa(?:lms)?|[pP]ro(?:verbs)?|[eE]cc(?:lesiastes)?|[sS]on(?:g)?|[iI]sa(?:iah)?|[jJ]er(?:emiah)?|[lL]am(?:entations)?|[eE]ze(?:riah)?|[dD]an(?:iel)?|[hH]o(?:sea)?|[jJ]oe(?:l)?|[aA]mo(?:s)?|[oO]ba(?:h)?|[jJ]on(?:ah)?|[mM]i(?:cah)?|[nN]ah(?:um)?|[hH]ab(?:akkuk)?|[zZ]ep(?:haniah)?|[hH]ag(?:gai)?|[zZ]ec(?:hariah)?|[mM]al(?:achi)?|[mM]at(?:thew)?|[mM]ar(?:k)?|[lL]uk(?:e)?|[jJ]oh(?:n)?|[aA]ct(?:s)?|[rR]om(?:s)?|1 [cC]or(?:inthians)?|2 [cC]or(?:inthians)?|[gG]al(?:atians)?|[eE]ph(?:esians)?|[pP]hi(?:lippians)?|[cC]ol(?:ossians)?|1 [tT]hess(?:alonians)?|2 [tT]hess(?:alonians)?|1 [tT]i(?:mothy)?|2 [tT]i(?:mothy)?|[tT]it(?:us)?|[pP]h(?:ilemon)?|[hH]eb(?:rews)?|[jJ]am(?:es)?|1 [pP]e(?:ter)?|2 [pP]e(?:ter)?|1 [jJ]o(?:n)?|2 [jJ]o(?:n)?|3 [jJ]o(?:n)?|[jJ]ude?|Rev(?:elation)?))/gmi
    this.bookAbbrRegex =
        /(?:(?:[gG]en|[eE]xo|[lL]ev|[nN]um|[dD]eu|[jJ]os|[jJ]dg|[rR]ut|1 [sS]a|2 [sS]a|1 [kK]gs|2 [kK]gs|1 [cC]hr|2 [cC]hr|[eE]zr|[nN]eh|[eE]st|[jJ]ob|[pP]sa|[pP]ro|[eE]cc|[sS]on|[iI]sa|[jJ]er|[lL]am|[eE]ze|[dD]an|[hH]os|[jJ]oe|[aA]mo|[oO]ba|[jJ]on|[mM]ic|[nN]ah|[hH]ab|[zZ]ep|[hH]ag|[zZ]ec|[mM]al|[mM]att|[mM]ar|[lL]uk|[jJ]oh|[aA]ct|[rR]om|1 [cC]or|2 [cC]or|[gG]al|[eE]ph|[pP]hi|[cC]ol|1 [tT]hess|2 [tT]hess|1 [tT]i|2 [tT]i|[tT]it|[pP]hm|[hH]eb|[jJ]am|1 [pP]e|2 [pP]e|1 [jJ]o|2 [jJ]o|3 [jJ]o|[jJ]ud|[rR]ev))/gmi
    this.chapterRegex = /(?:\s?\d+:?)/g
    this.verseRegex = /\b:\s*?(\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?!p|j|k|s|c|t)\b/g
    this.scripturesRegex = new RegExp(
        `(${this.bookRegex.source})(${this.chapterRegex.source})?(${this.verseRegex.source})`,
        "gm"
    )
    this.abbrScripturesRegex = new RegExp(
        `(${this.bookAbbrRegex.source})(${this.chapterRegex.source})?(${this.verseRegex.source})`,
        "gm"
    )
}
/**
 * Scans the input text and stores the matching passages in the 'passages' property.
 *
 * @param {string} text - The input text to scan.
 * @return {Array}
 */
CodexParser.prototype.scan = function (text) {
    this.found = text.match(this.scripturesRegex)
    return this.found
}

/**
 * Parses the passage using the bookRegex.
 *
 * @param {string} reference - the passage to be parsed
 * @return {Array|null} an array of matches or null if there are no matches
 */
CodexParser.prototype.parse = function (reference) {
    if (!reference) {
        return null // return null if no reference is provided
    }
    this.passages = []
    this.scan(reference)
    for (let i = 0; i < this.found.length; i++) {
        const book = this.found[i].match(this.bookRegex)
        const chapter = this.found[i].replace(book[0], "").match(this.chapterRegex)
        const passage = {
            original: this.found[i],
            book: book[0].charAt(0).toUpperCase() + book[0].slice(1),
            chapter: chapter[0].replace(":", "").trim(),
            verse: this.found[i].match(this.verseRegex)[0].replace(":", "").trim(),
        }
        passage.verse = passage.verse.split(/,/).filter(Boolean)
        passage.testament = this.bible.old.includes(passage.book) ? "old" : "new"
        this.passages.push(passage)
    }
    this.found = []
    return this.passages
}

/**
 * Get the passages.
 *
 * @return {Array} The passages.
 */
CodexParser.prototype.getPassages = function () {
    return this.passages
}

let parser
if (typeof window !== "undefined") {
    window.parser = new CodexParser()
} else {
    parser = new CodexParser()
}
//console.log(parser.parse("John 3:16"))
