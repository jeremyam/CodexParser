require("dotenv").config()
const axios = require("axios")

// Get all books
axios
    .get("https://api.esv.org/v3/passage/text/", {
        params: {
            q: "John+3:16",
        },
        headers: {
            Authorization: `Token ${process.env.ESV_TOKEN}`,
        },
    })
    .then((response) => {
        const books = response
        console.log(books.data.passage_meta)
    })
    .catch((error) => {
        console.error(error)
    })
