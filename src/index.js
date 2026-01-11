// Public barrel for consumers
const CodexParser = require("./core/CodexParser")
const { formatOsis, formatOsisNumeric, toVerseId } = require("./format/osis")
const PassageUtils = require("./utils/PassageUtils")

module.exports = {
    CodexParser,
    formatOsis,
    formatOsisNumeric,
    toVerseId,
    PassageUtils,
}
