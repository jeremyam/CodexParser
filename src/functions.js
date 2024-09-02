const util = require("util")
const dump = (item) => {
    console.log(util.inspect(item, { depth: null, colors: true }))
}

function dd(message) {
    dump(message)
    // Optionally, you can also force the script to stop execution
    // by throwing an error
    process.exit(1)
}

module.exports = {
    dump,
    dd,
}
