function generateScriptureCombinations(book, chapters, versesPerChapter) {
    let scriptureCombinations = []

    for (let chapter = 1; chapter <= chapters; chapter++) {
        for (let verse = 1; verse <= versesPerChapter[chapter - 1]; verse++) {
            // Single verse
            scriptureCombinations.push(`${book} ${chapter}:${verse}`)
            // Verse ranges within a chapter
            for (let endVerse = verse + 1; endVerse <= versesPerChapter[chapter - 1]; endVerse++) {
                scriptureCombinations.push(`${book} ${chapter}:${verse}-${endVerse}`)
            }
        }
        // Chapter ranges
        for (let endChapter = chapter + 1; endChapter <= chapters; endChapter++) {
            scriptureCombinations.push(`${book} ${chapter}:${versesPerChapter[chapter - 1]}-${endChapter}:1`)
        }
    }

    return scriptureCombinations
}

// Example usage for the book of Genesis (assuming 50 chapters and a fixed number of verses per chapter for simplicity)
const genesisVersesPerChapter = new Array(50).fill(30) // Replace with actual verse count per chapter
const genesisCombinations = generateScriptureCombinations("Genesis", 50, genesisVersesPerChapter)
console.log(genesisCombinations.join(", "))
