var fs = require("fs");
var parser = require("../lib/parser");
var jit = require("../lib/compile2js");

// result = parser.parse("{ varname }");
// console.log(result[0])

// result = parser.parse("{#if a > 1 }yes{#else}no{/if}");
// console.log(result[0])

// result = parser.parse("hi{ name }{ sex }");
// console.log(result[0])


// result = parser.parse(fs.readFileSync("./templates/if0.txt").toString());
// console.log(result[0])

// result = parser.parse(fs.readFileSync("./templates/if1.txt").toString());
// console.log(result[0])


// result = parser.parse(fs.readFileSync("./templates/if2.txt").toString());
// console.log(result[0])

// result = parser.parse(fs.readFileSync("./templates/if0.txt").toString());
// console.log(result[0])

// result = parser.parse("(a + (b - c ))");
// result = parser.parse("(a + (2 + c))");
// result = parser.parse("a * (b + (c/d))");
// result = parser.parse("(a * 2)");
// result = parser.parse("(a)");
// result = parser.parse("(a+1)");
// console.log(result[0])


// 字符串
// result = parser.parse("'a'");
// result = parser.parse("'\\'\"a'");
// result = parser.parse('"a bcd\'\\""');
// result = parser.parse('"a\\""');
// result = parser.parse("\\'");
// console.log(result[0])

var ast = parser.toAST(fs.readFileSync("./templates/complex0.txt").toString());
console.log(JSON.stringify(ast))
console.log(jit.to_js(ast));
// var tpl = jit.compile(ast);
// var ret = tpl.render({items:[[],[]]});
// console.log(ret);

