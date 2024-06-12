const bookRegex = /(?:(I+|1st|2nd|3rd|First|Second|Third|[123])\s)?(Gen|Ge|Gn|Exo|Ex|Exod|Lev|Le|Lv|Num|Nu|Nm|Nb|Deut|Dt|Josh|Jos|Jsh|Judg|Jdg|Jg|Jdgs|Rth|Ru|Sam|Samuel|Kings|Kgs|Kin|Chron|Chronicles|Ezra|Ezr|Ez|Neh|Ne|Esth|Es|Job|Job|Jb|Pslm|Ps|Psalms|Psa|Psm|Pss|Prov|Pr|Prv|Eccles|Ec|Song|So|Canticles|Song of Songs|SOS|Song of Solomon|Isa|Is|Jer|Je|Jr|Lam|La|Ezek|Eze|Ezk|Dan|Da|Dn|Hos|Ho|Joel|Joe|Jl|Amos|Am|Obad|Ob|Jnh|Jon|Micah|Mic|Nah|Na|Hab|Zeph|Zep|Zp|Haggai|Hag|Hg|Zech|Zec|Zc|Mal|Mal|Ml|Matt|Mt|Mrk|Mk|Mr|Luk|Lk|John|Jn|Jhn|Acts|Ac|Rom|Ro|Rm|Co|Cor|Corinthians|Gal|Ga|Ephes|Eph|Phil|Php|Col|Col|Th|Thes|Thess|Thessalonians|Ti|Tim|Timothy|Titus|Tit|Philem|Phm|Hebrews|Heb|He|James|Jas|Jm|Pe|Pet|Pt|Peter|Jn|Jo|Joh|Jhn|John|Jude|Jd|Jud|Jud|Rev|The Revelation|Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|John|Revelation|Re|Ap)/gmi
const chapterRegex = /\b(?:\.?\s?\d+[:|\.]?)\b/gm
const verseRegex = /\b[:.](\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?:[abcde])?(?:,\d+)*\b/gm
const chapterRange = /.?\s?(?:[-—–])\s?/gm
const chapterRangeVerseRegex = /(?:.\d+)?/gm
const chapterVerseRange =
    /(.?\s?\d+((?:[:.]\d+)?(\s?[-–—]\s?)?(?:\d+)(?:(,\s?\d+)*)?\S([:.]?\d+)?(,\s?\d+[–—-]\s?\d+,?\d+)?)?(?:[:.]\d+)?(?:[abcde])?(?:,\d+)*(?:[-–—]\d?\s?)?)(?:\d+[–-—]\s?\d+,?\s?\d+)?/gim
const scripturesRegex = new RegExp(`(${bookRegex.source})(${chapterVerseRange.source})`, "gmi")
module.exports.bookRegex = bookRegex
module.exports.chapterRegex = chapterRegex
module.exports.scripturesRegex = scripturesRegex
module.exports.verseRegex = verseRegex
