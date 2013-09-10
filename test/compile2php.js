var fs = require("fs");
var parser = require("../lib/parser");
var compiler = require("../lib/compile2php");

var ast = parser.toAST(fs.readFileSync("./templates/simple.txt").toString());
// console.log(JSON.stringify(ast))
console.log(compiler.to_php(ast));
// var tpl = jit.compile(ast);
// var ret = tpl.render({items:[[],[]]});
// console.log(ret);

