const util = require("util")
const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}

module.exports.dump = dump
