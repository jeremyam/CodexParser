const axios = require("axios")

// Get all books
axios
    .get("https://api.esv.org/v3/passage/text/", {
        params: {
            q: "John+3:16",
        },
        headers: {
            Authorization: "Token c117111babd413bd8a22b09ebfe84342dc792781",
        },
    })
    .then((response) => {
        const books = response
        console.log(books.data.passage_meta)
    })
    .catch((error) => {
        console.error(error)
    })
