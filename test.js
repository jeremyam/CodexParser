import CodexParser from './src/CodexParser.js'

const parser = new CodexParser();
const text = 'The passages that we are looking at tonight are found in 1 John 3:16, and Romans 10:13, 15'
const single = 'John 3:16'
parser.parse(single)
console.log(parser)