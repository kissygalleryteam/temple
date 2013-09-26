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
      All(Char(/\\\\/),Char(/'/)),//Str(["\\\\","'"]),
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
      All(Char(/\\\\/),Char(/'/)),//Str(['\\\\','"']),
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

    // {#each items as item index}
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

    // {/each}
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
    var unary = Char(/[\+\-!]/);

    var _op = Capture(op,"expatom");
    var _unary = Capture(unary,"expatom");
    var _proton = Capture(proton,"expatom");

    var commar = Char(/,/);
    var _commar = Capture(commar,"expatom");

    var preBrack = Char(/\(/);
    var _preBrack = Capture(preBrack,"expatom");

    var exBrack = Char(/\)/);
    var _exBrack = Capture(exBrack,"expatom");
    var dot = Char(/\./);
    var _dot = Capture(dot,"expatom");

    var atom = Any(
      All(_unary,optblanks,_proton),
      All(_unary,optblanks,_preBrack,optblanks,_proton,optblanks,_exBrack),
      _Bool,
      _proton
    );
    var _ComplexExp = Y(function(exp){
                        var arg = Y(function(rule){
                                    return Any(
                                      All(exp,optblanks,_commar,optblanks,rule),
                                      exp
                                    );
                                  });
                        var fn = All(
                          Optional(_unary),
                          optblanks,
                          Capture(_NameSpace,"expatom"),
                          optblanks,
                          _preBrack,
                          optblanks,
                          Optional(arg),
                          optblanks,
                          _exBrack);
                        var a = Any(fn,atom);

                        // foo op bar ...
                        var b = Any(
                          All(a,optblanks,_op,optblanks,exp),
                          a
                        );
                        // (foo op bar)
                        var c = Any(
                          All(_preBrack,optblanks,b,optblanks,_exBrack),
                          b
                        );

                        // !(foo op bar)
                        var d = All(Optional(_unary),optblanks,c);

                        // exp.toString()
                        // var e = Any(
                        //   All(d,optblanks,Char(/\./),optblanks,_NameSpace,preBrack,Optional(arg),exBrack),
                        //   d
                        // );
                        // 优化后的e，效果十分明显!!!
                        var e = All(d,
                                    Optional(
                                      All(optblanks,_dot,optblanks,_NameSpace,
                                          Optional(
                                            All(_preBrack,Optional(arg),_exBrack)))
                                    ));

                        // d的循环
                        var f = Y(function(rule){
                                  return Any(
                                    All(e,optblanks,_op,rule),
                                    e
                                  )
                                });
                        return f;
                      });
    /////////////// Expression ///////////////

    var _ifExp = Capture(_ComplexExp,"expression");
    _ifExp = Capture(_ifExp,"@ifexpend","@ifexpstart");

    // {#elseif exp}
    var _ElseExpression = All(
      _delimeter_start,
      optblanks,
      _elseif,
      optblanks,
      _ifExp,
      _delimeter_end
    );

    // {#else}
    var _ElseStatement = All(
      _delimeter_start,
      optblanks,
      _else,
      optblanks,
      _delimeter_end
    );

    // {/if}
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

    // {#set name = value_exp}
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

    // {#include sub_name}
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

    // {#extend base_name}
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
        // {#elseif exp} + Rule
        var _ElseIfOne = All(
          _ElseExpression,
          Optional(Capture(Rule,"@ifbodyend","@ifbodystart"))
        );
        _ElseIfOne = Capture(_ElseIfOne,"@elseifend","@elseifstart");
        var _ElseIf = Optional(
          Plus(_ElseIfOne)
        );
        // {#else} + Rule
        var _Else = Optional(
          All(
            _ElseStatement,
            optblanks,
            Optional(Rule)
          ));
        _Else = Capture(_Else,"@elseend","@elsestart");
        // {#if exp} + Rule
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

        //------------------------------  exp ------------------------------
        var Expression = _Expression;
        //------------------------------  exp ------------------------------

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