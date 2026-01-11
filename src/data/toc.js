const fs = require("fs")
const path = require("path")

const biblePath = path.join(__dirname, "../../bibles/updated_kjv.json")
const bible = JSON.parse(fs.readFileSync(biblePath, "utf8"))

module.exports.bible = bible
