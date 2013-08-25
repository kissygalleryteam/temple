var Parser = require('rd-parse')
  , Grammar = require('./grammar')

var parser = new Parser(Grammar);

module.exports = parser;
