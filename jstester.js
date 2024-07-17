const books = [
    "Gen",
    "Ge",
    "Gn",
    "Exo",
    "Ex",
    "Exod",
    "Lev",
    "Le",
    "Lv",
    "Num",
    "Nu",
    "Nm",
    "Nb",
    "Deut",
    "Dt",
    "Josh",
    "Jos",
    "Jsh",
    "Judg",
    "Jdg",
    "Jg",
    "Jdgs",
    "Rth",
    "Ru",
    "Sam",
    "Samuel",
    "Kings",
    "Kgs",
    "Kin",
    "Chron",
    "Chronicles",
    "Ezra",
    "Ezr",
    "Ez",
    "Neh",
    "Ne",
    "Esth",
    "Es",
    "Job",
    "Job",
    "Jb",
    "Pslm",
    "Ps",
    "Psalms",
    "Psa",
    "Psm",
    "Pss",
    "Prov",
    "Pr",
    "Prv",
    "Eccles",
    "Ec",
    "Song",
    "So",
    "Canticles",
    "Song of Songs",
    "SOS",
    "Isa",
    "Is",
    "Jer",
    "Je",
    "Jr",
    "Lam",
    "La",
    "Ezek",
    "Eze",
    "Ezk",
    "Dan",
    "Da",
    "Dn",
    "Hos",
    "Ho",
    "Joel",
    "Joe",
    "Jl",
    "Amos",
    "Am",
    "Obad",
    "Ob",
    "Jnh",
    "Jon",
    "Micah",
    "Mic",
    "Nah",
    "Na",
    "Hab",
    "Zeph",
    "Zep",
    "Zp",
    "Haggai",
    "Hag",
    "Hg",
    "Zech",
    "Zec",
    "Zc",
    "Mal",
    "Mal",
    "Ml",
    "Matt",
    "Mt",
    "Mrk",
    "Mk",
    "Mr",
    "Luk",
    "Lk",
    "John",
    "Jn",
    "Jhn",
    "Acts",
    "Ac",
    "Rom",
    "Ro",
    "Rm",
    "Co",
    "Cor",
    "Corinthians",
    "Gal",
    "Ga",
    "Ephes",
    "Eph",
    "Phil",
    "Php",
    "Col",
    "Col",
    "Th",
    "Thes",
    "Thess",
    "Thessalonians",
    "Ti",
    "Tim",
    "Timothy",
    "Titus",
    "Tit",
    "Philem",
    "Phm",
    "Hebrews",
    "Heb",
    "He",
    "James",
    "Jas",
    "Jm",
    "Pe",
    "Pet",
    "Pt",
    "Peter",
    "Jn",
    "Jo",
    "Joh",
    "Jhn",
    "John",
    "Jude",
    "Jd",
    "Jud",
    "Jud",
    "Rev",
    "The Revelation",
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "Samuel",
    "Kings",
    "Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Psalm",
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
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "Thessalonians",
    "Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "Peter",
    "John",
    "Revelation",
    "Re",
    "Ap",
    "Jd.",
    "Heb.",
]

const preStrings = ["III", "II", "I", "1st", "2nd", "3rd", "First", "Second", "Third", "1", "2", "3"]
const preStringed = [
    "Sam",
    "Samuel",
    "Kings",
    "Kgs",
    "Kin",
    "Chron",
    "Chronicles",
    "Corinthians",
    "Co",
    "Cor",
    "Thessalonians",
    "Th",
    "Thes",
    "Thess",
    "Timothy",
    "Ti",
    "Tim",
    "Peter",
    "Pe",
    "Pet",
    "Pt",
    "John",
    "Jn",
    "Jhn",
]
let text = `Joel 10:13 The passages Luke 2:32 and Lk 1:23 that we are looking at tonight 1 Cor 12:34 2 Cor 3:4 are found Jude 6, in Jude 5, Genesis 2:1 - 3:19, 1 John 3:16-17, 1 Peter 1:1, and Romans 10:13, 15, 17. Please turn in your Bibles. Ps 109:4,5,6,8.  Isaiah 61.2-3 Mt 5.4

Ge 27.27-29,89-40 Heb 11.20 Heb. 12.17 Jonah 3

Jd. 5
Jd 6

1 Cor 12:34 2 Cor 3:4. He 4.12 Re 1.16

Leviticus 16:6 He 5.3 He 7.27

Hos 10:1-3, 8 and 1 John 2:23

exod15.18. 2 Cor 12:23 Malachi 3:32`
//add the prestringed versions e.g. 1 Peter
for (let b = 0; b < preStringed.length; b++) {
    for (let pre = 0; pre < preStrings.length; pre++) {
        books.push(preStrings[pre] + " " + preStringed[b])
    }
}
// add the book name with . at the end as this seems to be added sometimes, at least to the shortened forms
const length = books.length
for (let b = 0; b < length; b++) {
    books.push(books[b] + ".")
}

// sort descending - longer items first
books.sort((a, b) => b.length - a.length)
let booksAt = []
// go thro' each book finding where it matches in text
for (let b = 0; b < books.length; b++) {
    const book = books[b]
    let chNoInText = 0
    while (chNoInText < text.length) {
        let j = text.indexOf(book, chNoInText)
        if (j < 0) break
        if (j + book.length < text.length && !text.charAt(j + book.length).match(/^[a-z]+$/)) {
            booksAt.push([book, j])
            let replacement = book
            for (let k = 0; k < book.length; k++) {
                replacement = replacement.replace(book.charAt(k), "X")
            }
            text = text.replace(book, replacement) // to prevent a shorter version matching
        }
        chNoInText = j + book.length + 1
    }
}
// into ascending order of start position
booksAt.sort(function (a, b) {
    return a[1] - b[1]
})
newText = ""
let chNoInText = 0
for (let b = 0; b < booksAt.length; b++) {
    while (chNoInText < booksAt[b][1]) {
        //copy across characters to start of book
        newText += text.charAt(chNoInText)
        chNoInText++
    }
    newText += booksAt[b][0]
    chNoInText += booksAt[b][0].length //skip the 'fill-in characters
    for (let i = 0; i < 100; i++) {
        chNoInText++
        const nextCh = text.charAt(chNoInText)
        //test whether are at the end of the chapter(s) and verse(s)
        if (nextCh.match(/^[a-z]+$/)) break
        if (nextCh.match(/^[A-Z]+$/)) break
        newText += text.charAt(chNoInText - 1)
    }
    newText += " "
}

console.log(newText)
