/*
combined files : 

gallery/temple/1.0/rdparser
gallery/temple/1.0/grammar
gallery/temple/1.0/toast
gallery/temple/1.0/compile2js
gallery/temple/1.0/index

*/
/**
 * a recursive decendent parser
 * */
KISSY.add("gallery/temple/1.0/rdparser",function(){
  function Parser(grammar) {
    function Context(text) {
      this.text = text;
      this.lastPos = 0;
      this.lineNo = this.colNo = 1;
      // Track last accepted char position (for error reporting)
      this.track = function(pos) {
        if (pos >= this.lastPos) {
          this.lastPos++;
          if (this.text[pos] === '\n') { this.lineNo++;  this.colNo = 1; }
          else this.colNo++;
        }
      }
    }
    Parser.Context = Context;   // Expose Context to module consumers
    // Match a sequence of rules left to right
    function All() {
      var rules = Array.prototype.slice.apply(arguments);
      return function($) {
        for (var i=0, $cur = $; i < rules.length; i++) {
          var $next = rules[i]($cur);
          if ($next === $cur) return $;   // if one rule fails: fail all
          $cur = $next;
        }
        return $cur;
      }
    }

    // Match any of the rules with left-to-right preference
    function Any() {
      var rules = Array.prototype.slice.apply(arguments);
      return function($) {
        for (var i=0; i < rules.length; i++) {
          var $next = rules[i]($);
          if ($next !== $) return $next;    // when one rule matches: return the match
        }
        return $;
      }
    }

    // Match a rule 1 or more times
    function Plus(rule) {
      return function($) {
        var $cur, $next;
        for ($cur = $; ($next = rule($cur)) !== $cur; $cur = $next);
        return $cur;
      }
    }

    // Match a rule optionally
    function Optional(rule) {
      return function($) {
        var $next = rule($);
        if ($next !== $) return $next;
        return {
          capture: $.capture,
          context: $.context,
          pos: $.pos
        }
      }
    }

    // Scan 1 symbol from input validating against alphabet (RegEx)
    function Char(alphabet) {
      return function($) {
        if ($.pos >= $.context.text.length) return $;
        if (!alphabet.test($.context.text[$.pos])) return $;
        $.context.track($.pos);
        return {
          capture: $.capture,
          context: $.context,
          pos: $.pos + 1
        }
      }
    }

    // Capture all raw input relevant to a matched rule
    function Capture(rule, nameAfter, nameBefore) {
      return function($) {
        var $next = rule($);
        if ($next !== $) {
          var afterNode = { prev: $next.capture };
          afterNode.name = nameAfter;
          if (nameAfter[0] !== '@') afterNode.value = $.context.text.substr($.pos, $next.pos - $.pos);
          $next.capture.next = afterNode;
          $next.capture = afterNode;

          if (nameBefore) {
            var beforeNode = { prev: $.capture, next: $.capture.next };
            beforeNode.name = nameBefore;
            $.capture.next.prev = beforeNode;
            $.capture.next = beforeNode;
          }
        }
        return $next;
      }
    }

    this.parsingFunction = grammar(All, Any, Plus, Optional, Char, Capture);

    this.parse = function(text) {
      var $ = {
        capture: {}                       // capture stream
      , context: new Context(text)        // parsing context
      , pos: 0                            // current position in the text
      }
      var $next = this.parsingFunction($);

      var c = $.context;
      if ($next.pos != c.text.length) {
        var msg;
        if (c.lastPos >= c.text.length) msg = 'Unexpected end if input';
        else msg = 'Unexpected token at (' + c.lineNo + ':' + c.colNo + ')';
        var err = new Error(msg);
        err.$ = $next;
        throw err;
      }
      $next.capture.next = null;
      return [$.capture, $next.capture];
    }
  };
  return Parser;
})
/**
 * Grammar
 * */
KISSY.add("gallery/temple/1.0/grammar",function(){
  var Y = function (gen) {
    return (function(f) {
              return f(f);
            })(function(f) {
                 return gen(function() {
                          return f(f).apply(null, arguments);
                        });
               });
  };
  var isarray = Array.isArray ? Array.isArray:function(s){
                                                return toString.call(s) === "[object Array]";
                                              };
  var each = Array.forEach ? Array.forEach:function(arr,fn){
                                             for(var i=0,l=arr.length;i<l;i++){
                                               fn(arr[i]);
                                             }
                                           };
  var Grammar = function(All, Any, Plus, Optional, Char, Capture){
    // String Rule
    var Str = function(str){
      var as;
      if(!isarray(str)){
        as = str.split('');
      }else{
        as = str;
      }
      var rules = [];
      each(as,function(c){
        rules.push(Char(new RegExp(c)));
      });
      return All.apply(null,rules);
    }
    //-------------------- 字符串 --------------------
    // 'bla bla'
    // "foo bar"
    var _SingleAtom = Any(
      Str(["\\\\","'"]),
      Char(/[^']/)
    );
    var _SingleStringContent = Plus(_SingleAtom);

    var _StringSingle = All(
      Char(/'/),
      Optional(
        _SingleStringContent
      ),
      Char(/'/)
    );

    var _DoubleAtom = Any(
      Str(['\\\\','"']),
      Char(/[^"]/)
    );
    var _DoubleStringContent = Plus(_DoubleAtom);
    var _StringDouble = All(
      Char(/"/),
      Optional(
        _DoubleStringContent
      ),
      Char(/"/)
    );
    var _String = Any(_StringSingle,_StringDouble);
    //-------------------- 字符串 --------------------

    var blank = Char(/\s/);
    var optblank = Optional(blank);
    var blanks = Plus(blank);
    var optblanks = Optional(blanks);

    // 变量名规则:字母或数字
    var var_pre = Plus(Any(Char(/[a-zA-Z_$]/)));
    var var_body = Optional(Plus(Any(Char(/[a-zA-Z_$0-9]/))));
    var varname = All(var_pre,var_body);

    var zero = Char(/0/);
    var digit = Char(/\d/);
    var digit19 = Char(/[123456789]/);
    var digits =  Y(function(digits){
                    return Any(All(digit,digits),digit)
                  });
    var sign = Char(/[\+\-]/);
    var eE = Char(/[eE]/);

    var integer = Any(All(digit19,Optional(digits)),zero);

    var exponent = All(eE,Optional(sign),integer);

    var floating = All(
      integer,
      All(Char(/\./),Optional(digits))
    );

    var number_pre = Any(
      floating,
      integer
    );
    var unsigned = Any(All(number_pre,Optional(exponent)),
                       floating,
                       integer);
    var _Number = All(Optional(sign),optblanks,unsigned);

    var _Bool = Any(Str("true"),Str("false"));

    // { }
    var _delimeter_start = Char(/{/)
      , _delimeter_end = Char(/}/)

    // {#each items as item index}
    var _items = varname
      , _each = Str("#each")
      , _as  = Str("as")
      , _item  = varname
      , _index = varname

    _item = Capture(_item,"each-item");
    _items = Capture(_items,"each-items");
    _index = Capture(_index,"each-index");

    var _eachStart = All(
      _delimeter_start,
      _each,
      optblanks,
      _items,
      optblanks,
      _as,
      optblanks,
      _item,
      optblanks,
      _index,
      _delimeter_end
    );
    _eachStart = Capture(_eachStart,"@each-head-end","@each-head-start");

    var _eachEnd = All(
      _delimeter_start,
      optblanks,
      Str("/each"),
      optblanks,
      _delimeter_end
    );

    var _ifStart = Str("#if")
    var _elseif = Str("#elseif")
    var _else = Str("#else")

    var _atom = Any(
      _String,
      varname,
      _Number
    );

    // aka variable and a.b.c
    var _NameSpace = Y(function(ns){
                       return Any(
                         All(varname,Char(/\./),ns),
                         varname
                       );
                     });
    //_NameSpace = Capture(_NameSpace,"namespace");
    /////////////// Expression ///////////////

    var proton = Any(
      _Number,
      _NameSpace,
      _String
    )

    // atom ::= Number
    //      ::= String
    //      ::= Bool
    //      ::= NameSpace
    //

    // exp ::= atom
    //     ::= !atom
    //     ::= (atom)
    //     ::= !(atom)
    //     ::= atom op atom
    //     ::= (atom op atom)
    //     ::= (atom) op (atom)
    //     ::= atom op exp
    //     ::= (atom op exp)
    //     ::= name(atom)
    //     ::= !name(atom)

    // op ::= ==
    //    ::= ===
    //    ::= >=
    //    ::= <=
    //    ::= +=
    //    ::= -=
    //    ::= &&
    //    ::= ||
    //    ::= +
    //    ::= -
    //    ::= *
    //    ::= /
    //    ::= %
    //    ::= |
    //    ::= >
    //    ::= <
    //    ::= ^
    //
      , op = Any(
        All(Char(/=/),Char(/=/)),
        All(Char(/=/),Char(/=/),Char(/=/)),
        All(Char(/>/),Char(/=/)),
        All(Char(/</),Char(/=/)),
        All(Char(/\+/),optblanks,Char(/=/)),
        All(Char(/\-/),optblanks,Char(/=/)),
        All(Char(/\|/),Char(/\|/)),
        All(Char(/&/),Char(/&/)),
        Char(/[\+\-\*\/%><\|\^]/)
      );
    op = Capture(op,"expatom");
    var unary = Char(/[\+\-!]/);
    unary = Capture(unary,"expatom");

    proton = Capture(proton,"expatom");

    var commar = Capture(Char(/,/),"expatom");
    var preBrack = Capture(Char(/\(/),"expatom");
    var exBrack = Capture(Char(/\)/),"expatom");
    var _Dot = Capture(Char(/\./),"expatom");

    var atom = Any(
      All(unary,optblanks,proton),
      All(unary,optblanks,preBrack,optblanks,proton,optblanks,exBrack),
      _Bool,
      proton
    );
    var _ComplexExp = Y(function(exp){
                        var arg = Y(function(rule){
                                    return Any(
                                      All(exp,optblanks,commar,optblanks,rule),
                                      exp
                                    );
                                  });
                        var fn = All(
                          Optional(unary),
                          optblanks,
                          Capture(_NameSpace,"expatom"),
                          optblanks,
                          preBrack,
                          optblanks,
                          Optional(arg),
                          optblanks,
                          exBrack);
                        var a = Any(fn,atom);

                        // foo op bar ...
                        var b = Any(
                          All(a,optblanks,op,optblanks,exp),
                          a
                        );
                        // (foo op bar)
                        var c = Any(
                          All(preBrack,optblanks,b,optblanks,exBrack),
                          b
                        );

                        // !(foo op bar)
                        var d = All(Optional(unary),optblanks,c);

                        // exp.toString()
                        // var e = Any(
                        //   All(d,optblanks,Char(/\./),optblanks,_NameSpace,preBrack,Optional(arg),exBrack),
                        //   d
                        // );
                        // 优化后的e，效果十分明显!!!
                        var e = All(d,
                                    Optional(
                                      All(optblanks,_Dot,optblanks,_NameSpace,
                                          Optional(
                                            All(preBrack,Optional(arg),exBrack)))
                                    ));

                        // d的循环
                        var f = Y(function(rule){
                                  return Any(
                                    All(e,optblanks,op,rule),
                                    e
                                  )
                                });
                        return f;
                      });
    /////////////// Expression ///////////////

    var _ifExp = Capture(_ComplexExp,"expression");
    _ifExp = Capture(_ifExp,"@ifexpend","@ifexpstart");

    var _ElseExpression = All(
      _delimeter_start,
      optblanks,
      _elseif,
      blanks,
      _ifExp,
      _delimeter_end
    );

    var _ElseStatement = All(
      _delimeter_start,
      optblanks,
      _else,
      optblanks,
      _delimeter_end
    );

    var _ElseEnd = All(
      _delimeter_start,
      optblanks,
      Str("/if"),
      optblanks,
      _delimeter_end
    );

    var _Expression = All(
      _delimeter_start,
      optblanks,
      Capture(_ComplexExp,"expressionbody"),
      optblanks,
      _delimeter_end
    );
    _Expression = Capture(_Expression,"@expressionend","@expressionstart");

    var _Set = All(
      _delimeter_start,
      Char(/#/),
      Str("set"),
      optblanks,
      Capture(_NameSpace,"namespace"),
      optblanks,
      Char(/=/),
      optblanks,
      Capture(_ComplexExp,"expressionbody"),
      optblanks,
      _delimeter_end
    );
    _Set = Capture(_Set,"@setend","@setstart");

    var _Include = All(
      Str("{#include"),
      optblanks,
        Capture(varname,"string"),
        optblanks,
        Char(/\}/)
    );
    _Include = Capture(_Include,"@includeend","@includestart");

    var _BlockStart = Str("{#block");
    var _BlockEnd = Str("{/block}");

    var _Extend = All(
      Str("{#extend"),
      optblanks,
      Capture(varname,"string"),
      optblanks,
      Char(/\}/)
    );
    _Extend = Capture(_Extend,"@extendend","@extendstart");

    var _CommentContent = Any(
      Str(["\\\\","\\}"]),
      Char(/[^\}]/)
    );
    _CommentContent = Plus(_CommentContent);

    var _Comment = All(
      Str("{#!"),
      _CommentContent,
      Char(/\}/)
    );

    var _AnyThing = Any(
      Str(["\\\\","\\}"]),
      Str(["\\\\","\\{"]),
      Char(/[^\{\}]/)
    );
    _AnyThing = Plus(_AnyThing);
    _AnyThing = Capture(_AnyThing,"string");

    var Rule = Y(
      function(Rule){
        Rule = Plus(Rule)
        //------------------------------ each ------------------------------
        var Each = All(
          _eachStart,
          Optional(Capture(Rule,"@each-body-end","@each-body-start")),
          _eachEnd
        );
        Each = Capture(Each,"@eachend","@eachstart");
        //------------------------------ each ------------------------------

        //------------------------------  if  ------------------------------
        var _ElseIfOne = All(
          _ElseExpression,
          Optional(Capture(Rule,"@ifbodyend","@ifbodystart"))
        );
        _ElseIfOne = Capture(_ElseIfOne,"@elseifend","@elseifstart");
        var _ElseIf = Optional(
          Plus(_ElseIfOne)
        );
        var _Else = Optional(
          All(
            _ElseStatement,
            Optional(Rule)
          ));
        _Else = Capture(_Else,"@elseend","@elsestart");

        var _firstIf = All(
          _delimeter_start,
          _ifStart,
          optblanks,
          _ifExp,
          _delimeter_end,
          Optional(Capture(Rule,"@ifbodyend","@ifbodystart"))
        );

        var If  = All(
          Capture(_firstIf,"@elseifend","@elseifstart"),
          _ElseIf,
          _Else,
          _ElseEnd
        );
        If = Capture(If,"@ifend","@ifstart");
        //------------------------------  if  ------------------------------

        //------------------------------  var ------------------------------
        var Expression = _Expression;
        //------------------------------  var ------------------------------

        //------------------------------  set ------------------------------
        var Set = _Set;
        //------------------------------  set ------------------------------

        //------------------------------include------------------------------
        var Include = _Include;
        //------------------------------include------------------------------

        //------------------------------ block ------------------------------
        var Block = All(
          _BlockStart,
          optblanks,
          Capture(varname,"string"),
          optblanks,
          _delimeter_end,
          Capture(Rule,'@blockbodyend',"@blockbodystart"),
          _BlockEnd
        );
        Block = Capture(Block,"@blockend","@blockstart");
        //------------------------------ block ------------------------------

        //------------------------------ extend ------------------------------
        var Extend = _Extend;
        //------------------------------ extend ------------------------------

        //------------------------------comment------------------------------

        var Comment = _Comment;

        //------------------------------comment------------------------------

        //------------------------------anything------------------------------
        var AnyThingElse = _AnyThing;
        //------------------------------anything------------------------------

        return Any(
          Each,
          If,
          Block,
          Comment,
          Set,
          Expression,
          Extend,
          Include,
          AnyThingElse
        );
      });
    // --------------------
    Rule = Plus(Rule);
    return Rule;
  }
  return  Grammar;
});
/**
 * parser : generates AST
 * */
KISSY.add("gallery/temple/1.0/toast",function(S,Parser,Grammar){
  var parser = new Parser(Grammar);
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
      var subsetexp = [];
      var setexp = ["set",subsetexp];
      ctxq.push(currentContext);
      currentContext.push(setexp);
      currentContext = subsetexp;
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
    }else if(next.name == "expatom"){
      currentContext.push(next.value);
    }else if(next.name == "namespace"){
      currentContext.push(next.value);
    }else if(next.name == "expressionbody"){
      currentContext.push(next.value);
    }else if(next.name == "@expressionend"){
      currentContext = ctxq.pop();
    }else if(next.name == "@expressionstart"){
      var exp = [];
      var exps = ["expression",exp];
      ctxq.push(currentContext);
      currentContext.push(exps);
      currentContext = exp;
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
    // }else if(next.name == "var"){
    //   currentContext.push(["var",next.value]);
    }else if(next.name == "number"){
      currentContext.push(["number",next.value]);
    }else if(next.name == "string"){
      currentContext.push(["string",next.value.replace(/\n/gm,"\\n")]);
    }
    next = next.next;
    next && gen(next,currentContext,ctxq,info);
  }
  var toAST = function(s){
    var ast = [];
    var result = parser.parse(s);
    var next = result[0].next;
    var info = {
        extend:0//几次使用了extend语法
    };
    next && gen(next,ast,[],info);
    ast.info = info;
    return ast;
  }
  return toAST;
},{
  requires:['./rdparser','./grammar']
});
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
  var ENV;
  var Temple
  window.Temple || (Temple = window.Temple = {});
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
  ENV = gensymbol({pre:"env_"});
  var derive = function (o) {
    var F = function () {};
    F.prototype = o;
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
      if(ctx[varn]){
        return ctx[varn]+'.'+varns.slice(1);
      }
      if(this[varn] || isLocalFn(varn)){
        return m;
      }else{
        return ENV+'.'+m;
      }
    }else{
      if(ctx[varn]){
        return ctx[varn];
      }
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
  //var a = [["string","this is head , my name is "],["block",[["string","name"],["string"," jerry "]]],["string","!"]];
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
        var _value = gensymbol({
          pre:"item_"
        });
        var _len = gensymbol(
          {
            pre:"len_"
          });
        var _items = eachDeclare[0];
        if(!ctx[_items]){
          _items = ENV + "." + _items;
        }else{
          _items = ctx[_items];
        }
        code = code + indent + "for(var "+_index+" = 0 , "+_len+" = "+ _items + ".length ; "+_index+" < "+ _len +"; "+_index+"++){\n";
        var index_name = eachDeclare[2];
        var value_name = eachDeclare[1];
        //从旧的环境上派生
        var newctx = derive(ctx);

        code = code + INDENT + indent + 'var '+_value+' = '+_items + "["+_index+"];\n";
        newctx[index_name] = _index;
        newctx[value_name] = _value;
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
        var nsi = ns[i];
        if(isExpAtom(nsi)){
          s += nsi;
        }else{
          s += nshandle(nsi,ctx);
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
          + '    var ' + stringname + ' = "";\n'
          +      ret
          + '    return ' + stringname + ';\n'
          + '  }\n'
          + '}\n'
    return ret;
  }
  Temple.to_js = to_js;
  Temple.compile = compile;
  return Temple;
},{
  requires:["./toast"]
})

/**
 * @fileoverview
 * @author tom<cookieu@gmail.com>
 * @module temple
 **/
KISSY.add('gallery/temple/1.0/index',function(S,Compiler){
  return Compiler;
},{
  requires:["./compile2js"]
})

