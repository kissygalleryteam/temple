/**
 * a template jit engine
 * @author cookieu@gmail.com
 *
 * if
 * each
 * var
 * string
 * */

var INDENT = '  ';
var ENV = 'env';

Object.prototype.derive = function () {
    var F = function () {};
    F.prototype = this;
    return new F();
};

var unique = 0;
var default_var_name_pre = "variable_";
//生成一个符号
function gensymbol(opt){
  opt || (opt = {});
  var ret;
  if(opt.pre){
    ret = String(opt.pre) + unique++;
  }else{
    ret = default_var_name_pre + unique++;
  }
  return ret;
}

function _compile(list,code,indent,ctx){
  var ret;
  if(list[0] === "if"){
    var ifexps = list[1];
    var ifexp;
    for(var i1=0,l1=ifexps.length;i1<l1;i1++){
      ifexp = ifexps[i1];
      if(i1){
        code = code + "else if(";
      }else{
        code = code + indent + "if(";
      }
      // TODO: more complex predict
      var predict = ifexp[0];
      code = code + predict.join(" ");
      code = code + ")";
      code = code + "{\n";
      var ifbody = ifexp[1];
      for(var i2=0,l2=ifbody.length;i2<l2;i2++){
        code = code + _compile(ifbody[i2],"",indent+INDENT,ctx) + "\n";
      }
      code = code+indent+"}";
    }
    //else clause
    if(list[2]){
      code = code +  "else"
      code = code + "{\n";
      var elseexps = list[2];
      for(var i3=0;i3<elseexps.length;i3++){
        code = code + _compile(elseexps[i3],"",indent+INDENT,ctx) + "\n";
      }
      code = code+indent+"}";
      ret = code;
    }
    ret = code;
  }else if(list[0] === "each"){
    var eachDeclare = list[1];
    var _index = gensymbol({
      pre:"i_",
      local:true
    });
    var _item = gensymbol({
      pre:"item_",
      local:true
    });
    var _len = gensymbol(
      {
        pre:"len_",
        local:true
      });
    code = code + indent + "for(var "+_index+" = 0 , "+_len+" = "+ eachDeclare[0] + ".length ; "+_index+" < "+ _len +"; "+_index+"++){\n";
    var index_name = eachDeclare[2];
    var value_name = eachDeclare[1];
    //从旧的环境上派生
    var newctx = ctx.derive();

    newctx[index_name] = true;
    newctx[value_name] = true;

    //key
    code  = code + indent + INDENT + "var "+ index_name + " = " + _index +"\n";
    //value
    code  = code + indent + INDENT +  "var "+ value_name + " = " + eachDeclare[1] + "["+_index+"]"+"\n";
    var eachBody = list[2];
    for(var i=0,l=eachBody.length;i<l;i++){
      code = code + _compile(eachBody[i],"",indent+INDENT,newctx) + "\n";
    }
    code = code + indent + "}";
    ret = code;
  }else if(list[0] === "var"){
    if(ctx[list[1]]){//判断是否为局部变量
      ret = indent + '__s__ += ' +list[1];
    }else{
      ret = indent + '__s__ += ' + ENV+'.' +list[1];
    }
  }else if(list[0] === "string"){
    ret = indent + '__s__ += '+ '"' +list[1] + '"';
  }
  return ret;
}

//将一段模板语法，编译为js大妈
function compile(lists){
  var ret = '';
  for(var i=0,l=lists.length;i<l;i++){
    ret = ret + _compile(lists[i],'',INDENT+INDENT,{})+"\n";
  }
  ret  = '(function({\n\n'
         + '  var api = {}\n'
         + '  api.render = function('+ENV+'){\n'
         +    ret
         + '  }\n'
         + '  return api;'
       + '\n})()'
  return ret;
}

console.log(
  compile(
    [
      ["each",
       ["items","item","index"],
       [//each body expressions
         ["string","index="],["var","index"],
         ["string","&"],
         ["string","value="],["var","item"],
         ["var","name"],
         ["if",
          [                            //ifexps
            [
              ["index",">",1],         //ifexp
              [["string","simple if"]] //ifbody
            ],[
              ["index",">",1],         //ifexp
              [["string","simple if"]] //ifbody
            ]
          ],
          //else clause
          [
            ["string","else clause"]]]]
      ]
    ]
  )
)


// TODO:if的最终版本
console.log(
  compile(
    [
      ["if",
       [                            //ifexps
         [
           ["index",">",1],         //ifexp
           [["string","simple if"]] //ifbody
         ],[
           ["index",">",1],         //ifexp
           [["string","simple if"]] //ifbody
         ]
       ],
                                    //else clause
       [
         ["string","hi"],
         ["var","name"]
       ]]]
  )
)

