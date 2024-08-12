const bible = JSON.parse(fs.readFileSync(__dirname + "/../bibles/updated_kjv.json", "utf8"))
module.exports.bible = bible
