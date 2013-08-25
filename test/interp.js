var interp = require("../lib/interp").interp
var interps = require("../lib/interp").interps

// console.log(
//   interp(
//     ["string","abc"]
//   )
// )

// console.log(
//   interp(["number","num"],{num:2})
// )

// console.log(
//   interp(["if",
//          [">",3,1],
//          ["string","yes"],
//          ["string","no"]])
// )

// console.log(
//   interp(["+",1,
//               ["-",2,
//                    ["*",1,
//                         ["/",1,.5]]]])
// )

// console.log(
//   interp(["/",1,1])
// )

// console.log(
//   interp(["+",1,1])
// )

// console.log(
//   interp(["if",
//          [">",0,1],
//          ["string","yes"],
//          ["string","no"]])
// )

// console.log(
//   interp(["if",
//          [">",0,
//               ["+",1,1]],
//          ["string","yes"],
//          ["string","no"]])
// )

// console.log(
//   interp(["string","name:{name}"],{name:"tom"})
// )

// console.log(
//   interp(["each",
//           ["items","item","key"],
//           ["string","{key}:{item}\n"]],
//          {
//            items:["a","b"]
//          })
// )


// console.log(
//   (interp(["number","n"],{n:1})>0)
// )

// console.log(
//   interp(["if",
//            [">",["number","key"],0],
//            ["string","{key}:{item}\n"],
//            ["string",""]
//           ],{item:"b",key:1})
// )

// console.log(
//   interps([
//     ["each",
//      ["items","item","key"],
//      ["if",
//       [">",["number","key"],0],
//       ["string","hi,{key}:{item}\n"],
//       ["string",""]
//      ]]],
//          {
//            items:["a","b","c"]
//          })
// )

// console.log(
//   interps([["string","ab"],["string","cd"]])
// )

// 变量赋值
// console.log(
//   interps([["var",
//             "name","tom"],
//            ["string","hi:{name}"]])
// )

// console.log(
//   interps([["var",
//             "items",["a","b","c"]],
//            ["each",
//              ["items","item","key"],
//                ["if",[">",["number","key"],1],
//                      ["string","{key}:{item}\n"],
//                      ["string","no:{key}\n"]]]])
// )

// console.log(
//   interp(["if",0,"true","false"])
// )

// console.log(
//   interp(["if",2,"true","false"])
// )

// console.log(
//   interp(["var","__env__"])
// )

