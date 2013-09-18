;
(function(glob){
  var Temple = glob.Temple || (Temple = glob.Temple = {});
  var parser = new Temple.Parser(Temple.Grammar);
  function gen(next,currentContext,ctxq,info){
    // next.name && console.log(next.name);
    // console.log("ctxq.length=",ctxq.length);
    var name = next.name;
    if(name == "@ifend" || name == "@ifbodyend" || name == "@elseifend" || name == "@elseend" || name == "@setend" || name == "@includeend" || name == "@extendend"){
      if(ctxq.length){
        currentContext = ctxq.pop();
      }
    }else if(next.name == "@eachstart"){
      var eachclause = ["each"];
      currentContext.push(eachclause);
      ctxq.push(currentContext);
      currentContext = eachclause;
    }else if(next.name == "@eachend"){
      ctxq.pop();
      currentContext = ctxq.pop();
    }else if(next.name == "@each-head-start"){
      var eachComprehension = [];
      currentContext.push(eachComprehension);
      ctxq.push(currentContext);
      currentContext = eachComprehension;
    }else if(next.name == "@each-body-start"){
      currentContext = ctxq.pop();

      var eachBody = [];
      currentContext.push(eachBody);
      ctxq.push(currentContext);
      currentContext = eachBody;
    }else if(next.name == "each-items"){
      currentContext.push(next.value);
    }else if(next.name == "each-item"){
      currentContext.push(next.value);
    }else if(next.name == "each-index"){
      currentContext.push(next.value);
    }else if(next.name == "@setstart"){
      var setexp = ["set"];
      currentContext.push(setexp);

      ctxq.push(currentContext);
      currentContext = setexp;
    }else if(next.name == "@blockstart"){
      var blockexpsub = [];
      var blockexp = ["block",blockexpsub];
      currentContext.push(blockexp);

      ctxq.push(currentContext);
      ctxq.push(blockexp);
      currentContext = blockexpsub;
    }else if(next.name == "@blockend"){
      ctxq.pop();
      currentContext = ctxq.pop();
    }else if(next.name == "@ifstart"){
      var ifexpressions = [];
      var ifclause = ["if",ifexpressions];
      currentContext.push(ifclause);
      //存储两级context
      ctxq.push(currentContext);
      ctxq.push(ifclause);
      currentContext = ifexpressions;
    }else if(next.name == "@elseifstart"){
      var ifexpression = [];
      currentContext.push(ifexpression);
      ctxq.push(currentContext);
      currentContext = ifexpression;
    }else if(next.name == "@ifexpstart"){
      var predict = [];
      currentContext.push(predict);
      ctxq.push(currentContext);
      currentContext = predict;
    }else if(name == "@elsestart"){
      currentContext = ctxq.pop();
      var elseexp = [];
      currentContext.push(elseexp);
      ctxq.push(currentContext);
      currentContext = elseexp;
    }else if(name == "@ifexpend"){
      if(ctxq.length){
        currentContext = ctxq.pop();
      }
    }else if(next.name == "@ifbodystart"){
      var yesexp = [];
      currentContext.push(yesexp);
      ctxq.push(currentContext);
      currentContext = yesexp;
    }else if(next.name == "namespace"){
      currentContext.push(next.value);
    }else if(next.name == "expression"){
      currentContext.push(next.value);
    }else if(next.name == "@includestart"){
      var includeexp = ["include"];
      currentContext.push(includeexp);

      ctxq.push(currentContext);
      currentContext = includeexp;
    }else if(next.name == "@extendstart"){
      var extendexp = ["extend"];
      info.extend++;
      info.context = extendexp;
      currentContext.push(extendexp);
      ctxq.push(currentContext);
      currentContext = extendexp;
    }else if(next.name == "var"){
      currentContext.push(["var",next.value]);
    }else if(next.name == "number"){
      currentContext.push(["number",next.value]);
    }else if(next.name == "string"){
      currentContext.push(["string",next.value.replace(/\n/gm,"\\n")]);
    }
    next = next.next;
    next && gen(next,currentContext,ctxq,info);
  }

  Temple.toAST = function(s){
    var ast = [];
    var result = parser.parse(s);
    var next = result[0].next;
    var info = {
        extend:0//几次使用了extend语法
    };
    gen(next,ast,[],info);
    ast.info = info;
    return ast;
  }
})(this);
