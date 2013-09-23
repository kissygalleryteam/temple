var fs = require("fs");
var parser = require("../lib/parser");
var compiler = require("../lib/compile2vm");

var ast = parser.toAST(fs.readFileSync("./templates/simple.txt").toString());
console.log(compiler.to_vm(ast));

