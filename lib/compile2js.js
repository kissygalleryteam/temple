/**
 * a compile to js template engine
 * @author cookieu@gmail.com
 *
 * if
 * each
 * var
 * string
 * */
(function(glob){
  var Temple = glob.Temple || (glob.Temple = {});

  var INDENT = '  ';
  var ENV = 'env';

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

  Object.prototype.derive = function () {
    var F = function () {};
    F.prototype = this;
    return new F();
  };

  var indexOf = Array.indexOf ? Array.indexOf :
    function(arr,i){
      for(var j=0,l=arr.length;j<l;j++){
        if(arr[j] === i){
          return j;
          break;
        }
      }
      return -1;
    }

  var isarray = Array.isArray ? Array.isArray:function(s){
                                                return toString.call(s) === "[object Array]";
                                              }
  //子模板
  var subs = {};
  Temple.add = function(name,body){
    subs[name] = body;
  }
  Temple.remove = function(name){
    if(subs[name])
      delete subs[name];
  }

  //过滤AST，只剩下block
  function filterAST(list){
    var ret = {};
    function rec(list){
      for(var i=0,l=list.length;i<l;i++){
        var li = list[i]
        var car = list[0];
        var cdr = list[1];
        if(car === 'block'){
          ret[cdr[0][1]] = cdr;
        }else{
          isarray(li) && rec(li);
        }
      }
    }
    rec(list);
    return ret;
  }

  function extendListWithBlocks(list,blocks){
    function rec(list){
      for(var i=0,l=list.length;i<l;i++){
        var li = list[i]
        var car = list[0];
        var cdr = list[1];
        if(car === 'block' && isarray(car)){
          if(blocks[cdr[0][1]]){
            li[1] = blocks[cdr[0][1]];
          }
        }else{
          isarray(li) && rec(li);
        }
      }
    }
    rec(list);
    return list;
  }

  // see http://stackoverflow.com/questions/1661197/valid-characters-for-javascript-variable-names
  var regvar = /[a-zA-Z_$][a-zA-Z_$0-9]*/g;
  var globalfns = ["parseInt","parseFloat"];
  function isGlobalFn(fn){
    return indexOf(globalfns,fn) > -1;
  }
  function _compile(list,code,indent,ctx){
    var ret = '';
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
                           var varn = varns[0];
                           if(ctx[varn]){
                             return m;
                           }else{
                             if(!isGlobalFn(varn)){
                               return ENV+'.'+m;
                             }else{
                               return m;
                             }
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
        pre:"i_"
      });
      var _item = gensymbol({
        pre:"item_"
      });
      var _len = gensymbol(
        {
          pre:"len_"
        });
      var _items = eachDeclare[0];
      //编译的时候是全局下
      if(!ctx[_items]){
        _items = ENV + "." + _items;
      }
      code = code + indent + "for(var "+_index+" = 0 , "+_len+" = "+ _items + ".length ; "+_index+" < "+ _len +"; "+_index+"++){\n";
      var index_name = eachDeclare[2];
      var value_name = eachDeclare[1];
      //从旧的环境上派生
      var newctx = ctx.derive();

      newctx[index_name] = true;
      newctx[value_name] = true;

      //key
      code  = code + indent + INDENT + "var "+ index_name + " = " + _index +"\n";
      //value
      code  = code + indent + INDENT +  "var "+ value_name + " = " + _items + "["+_index+"]"+"\n";
      var eachBody = list[2];
      for(var i=0,l=eachBody.length;i<l;i++){
        code = code + _compile(eachBody[i],"",indent+INDENT,newctx) + "\n";
      }
      code = code + indent + "}";
      ret = code;
    }else if(list[0] === "set"){
      var setname = list[1];
      var setval = list[2];
      ret = code + indent + 'var ' + setname + ' = ' + setval + ";";
    }else if(list[0] === "block"){
      var rest = list[1].slice(1);
      for(var i=0,l=rest.length;i<l;i++){
        ret = code + indent + _compile(rest[i],'','',{});
      }
    }else if(list[0] === "include"){
      var sub = list[1][1];
      var sub_code = '';
      if(subs[sub]){
        var ast = Temple.toAST(subs[sub]);
        for(var i=0,l=ast.length;i<l;i++){
          sub_code += _compile(ast[i],'',indent,{})+'\n';
        }
      }
      ret += code + sub_code;
    }else if(list[0] === "var"){
      if(ctx[list[1]]){//判断是否为局部变量
        ret = indent + '__s__ += ' + list[1];
      }else{
        ret = indent + '__s__ += ' + ENV + '.' +list[1];
      }
    }else if(list[0] === "string"){
      ret = indent + '__s__ += '+ '"' +list[1] + '"';
    }else{
      glob.console && console.log("no case",list);
      ret = '';
    }
    return ret;
  }

  //将一段模板语法，编译为js代码
  function compile(s){
    var js = to_js(s);
    var ret = eval('('+js+')');
    return ret;
  }

  //递归的获取ast
  function getast(s){
    var ast = Temple.toAST(s);
    var info = ast.info;
    if(info.extend>0){
      var extendname = info.context[1][1];
      if(subs[extendname]){
        var blocks = filterAST(ast);
        ast = getast(subs[extendname]);
        ast = extendListWithBlocks(ast,blocks);
      }
    }
    return ast;
  }

  function to_js(s){
    var ast = getast(s);
    // console.log(JSON.stringify(ast));
    return _to_js(ast);
  }

  function _to_js(lists,ctx){
    var indent = INDENT+INDENT;
    var ret = '';
        for(var i=0,l=lists.length;i<l;i++){
          ret = ret + _compile(lists[i],'',indent,{})+"\n";
        }
    ret  =  '{\n'
          + '  render:function('+ENV+'){\n'
          + '    var __s__= "";\n'
          +      ret
          + '    return __s__;\n'
          + '  }\n'
          + '}\n'
    return ret;
  }
  var that;
  if(typeof module != "undefined" ){
    that = module.exports;
  }else{
    that = glob.Temple;
  }
  that.to_js = to_js;
  that.compile = compile;
})(this);
