/**
 * JIT ? I'm not sure
 * a template engine that compiles to js
 * @author cookieu@gmail.com
 *
 * if/elseif/else
 * each
 * set
 * include
 * extend
 * */
KISSY.add("gallery/temple/1.0/compile2js",function(S,toAST){
  var INDENT = '  ';
  var ENV = 'env';
  var Temple = window.Temple = {};

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
  var stringname = gensymbol({pre:"string_"});

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
  var isstr = function(s){return s[0] == '"' || s[0] == "'"};

  var isnum = function(n){
    return /\d/.test(n);
  }
  var isstrnum = function(a){
    return isnum(a) || isstr(a);
  }
  var nshandle = function(m,ctx){
    var varns = m.split('.');
    var varn = varns[0];
    if(varn == "this")
      return m;
    //字符串
    if(isstrnum(m)){
      return m;
    }

    if(varns.length>1){
      if(ctx[varn] || this[varn] || isLocalFn(varn)){
        return m;
      }else{
        return ENV+'.'+m;
      }
    }else{
      if(isLocalFn(varn)){
        return 'Temple.__fns.'+[varn];
      }else if(isGlobalFn(varn)){
        return m;
      }else{
        return ENV+'.'+m;
      }
    }
    return '';
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
  //Global Properties
  var globalfns = ["Infinity","NaN","undefined"];
  //Global Method
  globalfns = globalfns.concat(["decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "eval", "isFinite", "isNaN", "Number", "parseFloat", "parseInt", "String", "unescape"]);

  var localfns = Temple.__fns = {};
  Temple.reg = function(fname,fbody){
    localfns[fname] = fbody;
  }

  function isLocalFn(fn){
    return !!localfns[fn];
  }

  function isGlobalFn(fn){
    //return indexOf(globalfns,fn) > -1;
    return !!this[fn];
  }

  var expatom = ["=","==","===",">=","<=","+=","-=","&&","||","+","-","*","/","%","|",">","<","^",
                ",",
                ".",
                "(",
                ")"];

  function isExpAtom(s){
    return indexOf(expatom,s) > -1;
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
        var predict = ifexp[0];
        var predict_len = predict.length;
        var predict_head = predict.slice(0,predict_len - 1);
        var s = '';
        //将if表达式中的变量修正到正确的env下
        for(var pi=0,pl=predict_head.length;pi<pl;pi++){
          if(isExpAtom(predict_head[pi])){
            s+= predict_head[pi];
          }else{
            s+= nshandle(predict_head[pi],ctx);
          }
        }
        code = code + s;
        code = code + ")";
        code = code + "{\n";
        var ifbody = ifexp[1];
        if(ifbody){
          for(var i2=0,l2=ifbody.length;i2<l2;i2++){
            code = code + _compile(ifbody[i2],"",indent+INDENT,ctx) + "\n";
          }
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
      var eachBody = list[2];
      if(eachBody){
        var _index = gensymbol({
          pre:"i_"
        });
        var _len = gensymbol(
          {
            pre:"len_"
          });
        var _items = eachDeclare[0];
        if(!ctx[_items]){
          _items = ENV + "." + _items;
        }
        code = code + indent + "for(var "+_index+" = 0 , "+_len+" = "+ _items + ".length ; "+_index+" < "+ _len +"; "+_index+"++){\n";
        var index_name = eachDeclare[2];
        var value_name = eachDeclare[1];
        //从旧的环境上派生
        var newctx = ctx.derive();

        newctx[index_name] = _index;
        newctx[value_name] = _items + "["+_index+"]"

        for(var i=0,l=eachBody.length;i<l;i++){
          code = code + _compile(eachBody[i],"",indent+INDENT,newctx) + "\n";
        }
        code = code + indent + "}";
      }
      ret = code;
    }else if(list[0] === "set"){
      var allset = list[1];
      var setname = allset[0];
      var ns = allset.slice(1,allset.length-1);

      var s = '';
      for(var i=0,l=ns.length;i<l;i++){
        if(isExpAtom(ns[i])){
          s+= ns[i];
        }else{
          s+= nshandle(ns[i],ctx);
        }
      }

      //var exp = allset[allset.length-1];
      // for(var i=0,l=ns.length;i<l;i++){
      //   exp = exp.replace(ns[i],function(m){
      //           return nshandle(m,ctx);
      //         });
      // }

      //非纯变量
      if(setname.indexOf(".") > -1){
        ret = code + indent + setname + ' = ' + s + ";";
      }else{
        ret = code + indent + 'var ' + setname + ' = ' + s + ";";
      }
    }else if(list[0] === "block"){
      var rest = list[1].slice(1);
      for(var i=0,l=rest.length;i<l;i++){
        ret = code + indent + _compile(rest[i],'','',{});
      }
    }else if(list[0] === "include"){
      var sub = list[1][1];
      var sub_code = '';
      if(subs[sub]){
        var ast = toAST(subs[sub]);
        for(var i=0,l=ast.length;i<l;i++){
          sub_code += _compile(ast[i],'',indent,{})+'\n';
        }
      }
      ret += code + sub_code;
    }else if(list[0] === "expression"){
      var exps = list[1]
      var ns = exps.slice(0,exps.length-1);
      var s = '';
      for(var i=0,l=ns.length;i<l;i++){
        if(isExpAtom(ns[i])){
          s+= ns[i];
        }else{
          s+= nshandle(ns[i],ctx);
        }
      }
      ret = indent + stringname + ' += ' + s;
    }else if(list[0] === "string"){
      var s;
      if(list[1]){
        if(isstrnum(list[1])){
          ret = indent + stringname + ' += ' +list[1];
        }else{
          ret = indent + stringname + ' += "' +list[1]+'"';
        }
      }
    }else{
      this.console && console.log("no case",list);
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
    var ast = toAST(s);
    var info = ast.info;
    if(info.extend>0){
      var extendname = info.context[1][1];
      if(subs[extendname]){
        var blocks = filterAST(ast);
        ast = getast(subs[extendname]);
        ast = extendListWithBlocks(ast,blocks);
      }else{
        throw Error('extend "' + extendname + '", but can not find it');
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
          + '    ' + stringname + ' = "";\n'
          +      ret
          + '    return ' + stringname + ';\n'
          + '  }\n'
          + '}\n'
    return ret;
  }
  return {
    "to_js":to_js,
    "compile":compile
  };
},{
  requires:["gallery/temple/1.0/toast"]
})
