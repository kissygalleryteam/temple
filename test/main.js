//过滤AST，只剩下block
function filterAST(list){
  var ret = {};
  function rec(list){
    for(var i=0,l=list.length;i<l;i++){
      var li = list[i]
      var car = list[0];
      var cdr = list[1];
      if(car === 'block'){
        ret[cdr[0]] = cdr;
      }else{
        Array.isArray(li) && rec(li);
      }
    }
  }
  rec(list);
  return ret;
}
console.log(
  filterAST([
    ["block",["blocka","this is blocka"]],
    ["block",["blockb","this is blocka"]]
  ])
)

console.log(
  filterAST([
    ["if",[
      ["block",["blocka","this is blocka parent"]]
    ]],["block",["blockb","this is blocka parent"]]
  ])
);

function flatBlocks(list){
  var blocks = {};
  for(var i=0,l=list.length;i<l;i++){
    if(list[i][0] == "block"){
      var blockname = list[i][1][0];
      blocks[blockname] = list[i][1];
    }
  }
  return blocks;
}

// console.log(
//   flatBlocks([
//     ["block",["blocka","this is blocka"]],
//     ["block",["blockb","this is blocka"]]
//   ])
// )

function extendListWithBlocks(list,blocks){
  function rec(list){
    for(var i=0,l=list.length;i<l;i++){
      var li = list[i]
      var car = list[0];
      var cdr = list[1];
      if(car === 'block'){
        if(blocks[cdr[0]]){
          li[1] = blocks[cdr[0]][1];
        }
      }else{
        Array.isArray(li) && rec(li);
      }
    }
  }
  rec(list);
  return list;
}

/*
console.log(
  JSON.stringify(
    extendListWithBlocks([
      ["if",[
        ["block",["blocka","this is blocka parent"]]
      ]],["block",["blockb","this is blocka parent"]]
    ],flatBlocks([
      ["block",["blocka","this is blocka"]],
      ["block",["blockb","this is blocka"]]
    ]))
  )
)
*/
