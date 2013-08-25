var tool = require("./tool")

var env0 = {
};

Object.prototype.derive = function () {
    var F = function () {};
    F.prototype = this;
    return new F();
};

var BoolExps = {
    ">":function(a,b){
      return a > b;
    },
    "<":function(a,b){
      return a < b;
    },
    "=":function(a,b){
      return a == b;
    },
    "!=":function(a,b){
      return a != b;
    },
    "+":function(a,b){
      return a + b;
    },
    "-":function(a,b){
      return a - b;
    },
    "*":function(a,b){
      return a * b;
    },
    "/":function(a,b){
      return a / b;
    },
    "%":function(a,b){
      return a % b;
    }
}

//////////////////// 赋值 ////////////////////
var setvalue = function(list,env){
  env || (env = env0);
  var name = list[1];
  var value = list[2];
  env[name] = value;
  return value;
}
//////////////////// 赋值 ////////////////////

//////////////////// if each ////////////////////
// 求值函数
var ifblock = function(o,env){
  var ops = o[1]
    , yes = o[2]
    , no = o[3]
  var ret;

  // 二元逻辑操作
  if(tool.isarray(ops) && BoolExps[ops[0]]){
  var op = ops[0]
    , a = ops[1]
    , b = ops[2]
    if(BoolExps[op]){
      if(BoolExps[op](
        interpone(a,env),
        interpone(b,env))
        ){
        ret = interpone(yes,env);
      }else{
        ret = interpone(no,env);
      }
    }
  }else{
    var result = interpone(ops,env);
    if(result){
      ret = interpone(yes,env);
    }else{
      ret = interpone(no,env);
    }
  }
  return ret;
}
var eachblock = function(o,env){
  var comprehension = o[1]
    , index = comprehension[0]
    , name = comprehension[1]
    , key = comprehension[2]
    , items = env[index]

  //each body
  var body = o[2];

  var ret = '';
  if(items){
    for(var i=0,l=items.length;i<l;i++){
      //new env derive from env
      var env2 = env.derive();
      env2[name] = items[i];
      env2[key] = i;
      ret += interpone(body,env2);
    }
  }
  return ret;
}
//////////////////// if each ////////////////////

function interpone(o,env){
  env || (env = env0);

  // 字符串可能替换
  if(tool.isstring(o)){
    return interpone(o,env);
  }

  // Bool Number RegExp 
  if(tool.isAtom(o)){
    return o;
  }

  //基本二元运算
  if(tool.isBasicMathOperation(o)){ // 算术运算
    return BoolExps[o[0]](
      interpone(o[1],env),
      interpone(o[2],env)
    );
  }else if(tool.isString(o)){       // 字符串
    return tool.substitue(o[1],env);
  }else if(tool.isNumber(o)){       // number
    return tool.substitue('{'+o[1]+'}',env);
  }else if(tool.isIfBlock(o)){      // if
    return ifblock(o,env);
  }else if(tool.isEachBlock(o)){    // each
    return eachblock(o,env);
  }else if(tool.isVar(o)){
    if(o.length>2){                 // 变量声明
      setvalue(o,env);
    }else{                          // 环境中去寻找这个值
      return env[o[1]] || '';
    }
  }
  return '';
};

function interp(lists,env){
  env || (env = env0);
  var s = '';
  for(var i=0,l=lists.length;i<l;i++){
    s += interpone(lists[i],env);
  }
  return s;
}

//////////////////// setup env ////////////////////
(function(){
  env0.__env__ = "NodeJs";
})();
//////////////////// setup env ////////////////////

module.exports.interp = interpone;
module.exports.interps = interp;