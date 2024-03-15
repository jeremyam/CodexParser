export const books =
    /(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Psalms|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)/g
export const abbrBooks =
    /(?:(Gen|Exo|Lev|Num|Deu|Jos|Jdg|Rut|1 Sa|2 Sa|1 Kgs|2 Kgs|1 Chr|2 Chr|Ezr|Neh|Est|Job|Psa|Pro|Ecc|Son|Isa|Jer|Lam|Eze|Dan|Hos|Joe|Amo|Oba|Jon|Mic|Nah|Hab|Zep|Hag|Zec|Mal|Matt|Mar|Luk|Joh|Act|Rom|1 Cor|2 Cor|Gal|Eph|Phi|Col|1 Thess|2 Thess|1 Ti|2 Ti|Tit|Phm|Heb|Jam|1 Pe|2 Pe|1 Jo|2 Jo|3 Jo|Jud|Rev))/g
export const chapter = /(?:\s?\d+:?)/g
export const verse = /\b:\s*?(\d+(?:,?\s*?\d+?|-|–|—\d+)*)?\d+(?!p|j|k|s|c|t)\b/g
export const scripturesRegex = new RegExp(`(${books.source})(${chapter.source})?(${verse.source})`, "gm")
export const abbrScripturesRegex = new RegExp(`(${abbrBooks.source})(${chapter.source})?(${verse.source})`, "gm")
