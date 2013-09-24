  var isarray = Array.isArray ? Array.isArray:function(s){
                                                return toString.call(s) === "[object Array]";
                                              }


function extendListWithBlocks(list,blocks){
  function rec(list){
    for(var i=0,l=list.length;i<l;i++){
      var li = list[i];
      var car = li[0];
      var cdr = li[1];
      if(car === 'block' && isarray(li)){
        if(blocks[cdr[0][1]]){
          li[1] = blocks[cdr[0][1]];
        }
      }else{
        isarray(cdr) && rec(cdr);
      }
    }
  }
  rec(list);
  return list;
}

var blocks = {"name":[["string","name"],["string"," john "]]};
var list = [["string","this is head , my name is "],["block",[["string","name"],["string"," jerry "]]],["string","!"]]
console.log(
  JSON.stringify(extendListWithBlocks(list,blocks)));
