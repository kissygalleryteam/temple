/**
 * compile to php
 * @author cookieu@gmail.com
 * if
 * each
 * var
 * string
 * */
(function(glob){
  var INDENT = '  ';
  var ENV = '$env';

  var unique = 0;
  var default_var_name_pre = "$variable_";
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

  Object.prototype.derive = function () {
    var F = function () {};
    F.prototype = this;
    return new F();
  };
  // see http://stackoverflow.com/questions/1661197/valid-characters-for-javascript-variable-names
  var regvar = /[a-zA-Z_$][a-zA-Z_$0-9]*/g;
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
        var predict_len = predict.length;
        var predict_head = predict.slice(0,predict_len - 1);
        var predict_body = predict[predict_len - 1];

        //将if表达式中的变量修正到正确的env下
        for(var pi=0,pl=predict_head.length;pi<pl;pi++){
          predict_body = predict_body.replace(predict_head[pi],function(m){
            var varns = m.split('.');
            if(ctx[varns]){
              return m;
            }else{
              return ENV+'["'+m+'"]';
            }
          });
        }
        code = code + predict_body;
        code = code + ")";
        code = code + "{\n";
        var ifbody = ifexp[1];
        for(var i2=0,l2=ifbody.length;i2<l2;i2++){
          code = code + _compile(ifbody[i2],"",indent+INDENT,ctx) + "\n";
        }
        code = code+indent+"}";
      }
      //else clause
      if(list[2] && list[2].length){
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
        pre:"$i_"
      });
      var _item = gensymbol({
        pre:"$item_"
      });
      var _len = gensymbol(
        {
          pre:"$len_"
        });
      var _items = eachDeclare[0];
      //编译的时候是全局下
      if(!ctx[_items]){
        _items = ENV + "." + _items;
      }
      code = code + indent + "for("+_index+" = 0 , "+_len+" = "+ _items + ".length ; "+_index+" < "+ _len +"; "+_index+"++){\n";
      var index_name = eachDeclare[2];
      var value_name = eachDeclare[1];
      //从旧的环境上派生
      var newctx = ctx.derive();

      newctx[index_name] = true;
      newctx[value_name] = true;

      //key
      code  = code + indent + INDENT + index_name + " = " + _index +"\n";
      //value
      code  = code + indent + INDENT + value_name + " = " + _items + "["+_index+"]"+"\n";
      var eachBody = list[2];
      for(var i=0,l=eachBody.length;i<l;i++){
        code = code + _compile(eachBody[i],"",indent+INDENT,newctx) + "\n";
      }
      code = code + indent + "}";
      ret = code;
    }else if(list[0] === "set"){
      var setname = list[1];
      var setval = list[2];
      ret = code + indent + '$' + setname + ' = ' + setval + ";";
    }else if(list[0] === "var"){
      if(ctx[list[1]]){//判断是否为局部变量
        ret = indent + '$this->__s__ .= ' + list[1] + ';';
      }else{
        ret = indent + '$this->__s__ .= ' + ENV + '["' +list[1] + '"];';
      }
    }else if(list[0] === "string"){
      ret = indent + '$this->__s__ .= '+ '"' +list[1] + '";';
    }else{
      console.log("no case",list);
      ret = '';
    }
    return ret;
  }

  function to_php(lists,ctx){
    var indent = INDENT+INDENT;
    var ret = '';
        for(var i=0,l=lists.length;i<l;i++){
          ret = ret + _compile(lists[i],'',indent,{})+"\n";
        }
    ret = 'class Engine{\n'
        + '  public $__s__ = "";\n'
        + '  public function render($env){\n'
        +      ret
        + '    return $this->__s__;\n'
        + '  }\n'
        + '}\n'
        + '$engine = new Engine;\n'
        + 'return $engine;\n';
    return ret;
  }
  var that;
  if(typeof module != "undefined" ){
    that = module.exports;
  }else{
    glob.MEngine || (glob.MEngine = {});
    that = glob.MEngine;
  }
  that.to_php = to_php;
  that.compile = to_php;
})(this);
