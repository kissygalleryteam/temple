// -*- coding: utf-8; -*-
(function(glob){
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
        Capture(_SingleStringContent,"string")
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
        Capture(_DoubleStringContent,"string")
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

    var Number = Plus(Char(/[\d]/));

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
      Number
    );

    // aka variable and a.b.c
    var _NameSpace = All(
      varname,
      Optional(
        Plus(
          All(
            Char(/\./),
            varname
          )
        )
      )
    )
    _NameSpace = Capture(_NameSpace,"namespace");

    // 基本表达式 TODO
    // exp ::= number
    //     ::= namespace
    //     ::= (exp)
    //     ::= !exp
    //     ::= !(exp)
    //     ::= (exp op exp)
    //     ::= exp op exp
    // op  ::= + | - | * | / | %
    //     ::= ||
    //     ::= &&
    //     ::= >
    //     ::= >=
    //     ::= ==
    //     ::= <
    //     ::= <=
    //

    var _BasicExp = Any(
      _NameSpace,
      _String,
      Char(/\(/),
      Char(/\)/),
      //Char(/[+\-*/%]/),
      Char(/[+\-*%]/),
      Char(/[\!\<\>\=\&]/),
      Str(["\\\|","\\\|"]),
      Char(/\d/),
      blank
    );

    _BasicExp = Plus(_BasicExp);
    var _ifExp = Capture(_BasicExp,"expression");
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
      Capture(_BasicExp,"expressionbody"),
      optblanks,
      _delimeter_end
    );
    _Expression = Capture(_Expression,"@expressionend","@expressionstart");

    var _Set = All(
      _delimeter_start,
      Char(/#/),
      Str("set"),
      optblanks,
      _NameSpace,
      optblanks,
      Char(/=/),
      optblanks,
      Capture(_BasicExp,"expressionbody"),
      optblanks,
      _delimeter_end
    );
    _Set = Capture(_Set,"@setend","@setstart");

    var _Include = All(
      Str("{#include"),
      optblanks,
        _String,
        optblanks,
        Char(/\}/)
    );
    _Include = Capture(_Include,"@includeend","@includestart");

    var _BlockStart = Str("{#block");
    var _BlockEnd = Str("{/block}");

    var _Extend = All(
      Str("{#extend"),
      optblanks,
      _String,
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
          Capture(Rule,"@each-body-end","@each-body-start"),
          _eachEnd
        );
        Each = Capture(Each,"@eachend","@eachstart");
        //------------------------------ each ------------------------------

        //------------------------------  if  ------------------------------
        var _ElseIfOne = All(
          _ElseExpression,
          Capture(Rule,"@ifbodyend","@ifbodystart")
        );
        _ElseIfOne = Capture(_ElseIfOne,"@elseifend","@elseifstart");
        var _ElseIf = Optional(
          Plus(_ElseIfOne)
        );
        var _Else = Optional(
          All(
            _ElseStatement,
            Rule
          ));
        _Else = Capture(_Else,"@elseend","@elsestart");

        var _firstIf = All(
          _delimeter_start,
          _ifStart,
          optblanks,
          _ifExp,
          _delimeter_end,
          Capture(Rule,"@ifbodyend","@ifbodystart")
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
          _String,
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
    // var test = Str(["\\\|","\\\|"]);
    // test = Capture(test,"ab")
    // Rule = test;
    // --------------------
    Rule = Plus(Rule);
    return Rule;
  }
  if(typeof module != "undefined"){
    module.exports = Grammar;
  }else{
    glob.Temple || (glob.Temple = {});
    glob.Temple.Grammar = Grammar;
  }
})(this);
