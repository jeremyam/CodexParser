const BibleParser = require("./src/CodexParser.js")

let text = `Joel 10:13 The passages Luke 2:32 and Lk 1:23 that we are looking at tonight 1 Cor 12:34 2 Cor 3:4 are found Jude 6, in Jude 5, Genesis 2:1 - 3:19, 1 John 3:16-17, 1 Peter 1:1, and Romans 10:13, 15, 17. Please turn in your Bibles. Ps 109:4,5,6,8.  Isaiah 61.2-3 Mt 5.4

Ge 27.27-29,89-40 Heb 11.20 Heb. 12.17 Jonah 3

Jd. 5
Jd 6

1 Cor 12:34 2 Cor 3:4. He 4.12 Re 1.16

Leviticus 16:6 He 5.3 He 7.27

Hos 10:1-3, 8 and 1 John 2:23f

exod15.18. 2 Cor 12:23 Malachi 3:32`

const parser = new BibleParser()
const result = parser.find(text).enhance()
console.log(result)
