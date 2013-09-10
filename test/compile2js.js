var fs = require("fs");
var parser = require("../lib/parser");
var jit = require("../lib/compile2js");

var ast = parser.toAST(fs.readFileSync("./templates/complex0.txt").toString());
console.log(JSON.stringify(ast))
console.log(jit.to_js(ast));
// var tpl = jit.compile(ast);
// var ret = tpl.render({items:[[],[]]});
// console.log(ret);

