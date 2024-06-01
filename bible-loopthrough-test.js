const fs = require("fs")
const CodexParser = require("./src/CodexParser.js")
const parser = new CodexParser()
const bible = JSON.parse(fs.readFileSync("./bibles/updated_kjv.json", "utf8"))

bible.books.forEach(book => {
    console.log(book)
})
