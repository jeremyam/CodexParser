const bookRegex = /(?:Genesis|Gen|Ge|Gn|Exodus|Exo|Exod|Leviticus|Lev|Numbers|Num|Deuteronomy|Dt|Joshua|Josh|Judges|Jdg|Ruth|1 Samuel|1 Sam|1st Samuel|2 Samuel|2nd Samuel|1 Kings|1 Kgs|1 Ki|2 Kings|2 Kgs|2nd Kings|Ezra|Ezr|Esther|Esth|Es|Job|Psalms|Ps|Proverbs|Prov|Prv|Ecclesiastes|Eccles|Eccle|Ecc|Lamentations|Lam|Ezekiel|Ezek|Eze|Ezk|Daniel|Dan|Hosea|Hos|Joel|Jl|Amos|Am|Obadiah|Obad|Jonah|Jnh|Micah|Mic|Nahum|Na|Habakkuk|Hab|Hb|Zephaniah|Zeph|Zep|Zp|Haggai|Hag|Hg|Zechariah|Zechar|Zech|Zec|Zc|Malachi|Mal|Matthew|Mt|Mark|Mrk|Mar|Mk|Mr|Luke|Luk|Lk|John|Joh|Jn|Acts|Ac|Romans|Rm|1 Corinthians|1 Cor|1 Co|ICor|ICo|I Corinthians|1st Corinthians|First Corinthians|2 Corinthians|2 Co|II Cor|II Co|II Corinthians|2nd Corinthians|Second Corinthians|Galatians|Gal|Ga|Ephesians|Eph|Ephes|PHILIPPIANS|Php|Pp|Colossians|Col|Co|1 Thessalonians|1 Thess|1 Thes|1 Th|I Thessalonians|I Thess|I Thes|I Th|1st Thessalonians|First Thessalonians|2 Thessalonians|2 Thess|2 Thes|2 Th|II Thessalonians|II Thess|II Thes|II Th|2nd Thessalonians|Second Thessalonians|1 Timothy|1 Tim|1 Ti|I Timothy|I Tim|I Ti|1st Timothy|First Timothy|2 Timothy|2 Tim|2 Ti|II Timothy|II Tim|II Ti|2nd Timothy|Second Timothy|Titus|titus|tit|Theophilus|Tit|Tt|Philemon|Philem|Phm|Pm|Hebrews|Heb|James|James|Jas|Jm|1 Peter|1 Pet|1 Pe|1 Pt|1 P|I Peter|I Pt|I Pe|1st Peter|First Peter|2 Peter|2 Pet|2 Pe|2 Pt|2 P|II Peter|II Pet|II Pt|II Pe|2nd Peter|Second Peter|1 John|1 Jhn|1 Jn|1 J|I John|I Jhn|I Joh|I Jn|I Jo|1st John|First John|2 John|2 Jhn|2 Jn|2 J|II John|II Jhn|II Joh|II Jn|II Jo|2nd John|Second John|3 John|3 Jhn|3 Jn|3 J|3rd John|Third John|Jude|Jud|Jd|Revelation|Rev|Re)/gmi
const chapterRegex = /\b(?:\.?\s?\d+[:|\.]?)\b/gm
const verseRegex = /\b[:.](\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?:[abcde])?(?:,\d+)*(?:,\s?\d+)?\b/gm
const chapterRange = /.?\s?(?:[-—–])\s?/gm
const chapterRangeVerseRegex = /(?:.\d+)?/gm
const chapterVerseRange =
    /.?(?:\d+)((?:[:.])(?:(\d+)?)(?:(,\s?\d+)*)?(?:\s?[-–—]\s?\d+)?(?:,\s?\d+(?:\s?[-–—]\s?\d+)?)?(?:[:.]\d+)?)?/gim
const scripturesRegex = new RegExp(`(${bookRegex.source})(${chapterVerseRange.source})`, "gmi")
module.exports.bookRegex = bookRegex
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.verseRegex = verseRegex
