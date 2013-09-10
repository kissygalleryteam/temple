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
  }
  var isarray = function(a){
    return Array.isArray(a);
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
      as.forEach(function(c){
        rules.push(Char(new RegExp(c)));
      });
      return All.apply(null,rules);
    }

    var onespace = Char(/[ \t]/);
    var optspace = Optional(onespace);
    var spaces = Plus(onespace);
    var optspaces = Optional(spaces);

    var newline = Char(/\n/);
    var optline = Optional(newline);
    var newlines = Plus(newline);
    var optlines = Optional(newlines);

    var az = Char(/[a-z]/);
    var AZ = Char(/[A-Z]/);
    var Az = Char(/[a-zA-Z]/);
    var arabic = Char(/[\d]/);

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

    // + - * / > < = %
    var mathops = Any(
      Str("&&"),
      Str("\|\|"),
      Char(/[\+\-\*\/><=%]/)
    )

    var blank = Char(/\s/);
    var optblank = Optional(blank);
    var blanks = Plus(blank);
    var optblanks = Optional(blanks);

    // 变量名规则:字母或数字 TODO 可以是下划线开头，可以有中划线
    var var_pre = Plus(Any(Char(/[a-zA-Z_$]/)));
    var var_body = Optional(Plus(Any(Char(/[a-zA-Z_$0-9]/))));
    var varname = All(var_pre,var_body);

    var Number = Plus(arabic);

    // { }
    var _delimeter_start = Char(/{/)
      , _delimeter_end = Char(/}/)

    // {#each items as item index}
    var _items = varname
      , _as  = Str("as")
      , _item  = varname
      , _index = varname

    var Rule = Y(
      function(Rule){
        Rule = Plus(Rule)
        //------------------------------ each ------------------------------
        var _eachStart = All(
          _delimeter_start,
          Str("#each"),
          blanks,
          Capture(_items,"each-items"),
          blanks,
          _as,
          blanks,
          Capture(_item,"each-item"),
          blanks,
          Capture(_index,"each-index"),
          _delimeter_end
        );
        _eachStart = Capture(_eachStart,"@each-head-end","@each-head-start");
        var _eachEnd = All(
          _delimeter_start,
          optspaces,
          Str("/each"),
          optspaces,
          _delimeter_end
        );
        var Each = All(
          _eachStart,
          Capture(Rule,"@each-body-end","@each-body-start"),
          _eachEnd
        );
        Each = Capture(Each,"@eachend","@eachstart");
        //------------------------------ each ------------------------------

        //------------------------------  if  ------------------------------
        //{#if exp}
        //{#if a > b}
        var _ifStart = Str("#if")
        var _elseif = Str("#elseif")
        var _else = Str("#else")
        var _ifEnd = Str("/if")

        var _atom = Any(
          _String,
          varname,
          Number
        );
        // 基本表达式 TODO
        // exp ::= number
        //     ::= varname
        //     ::= (exp)
        //     ::= !exp
        //     ::= !(exp)
        //     ::= exp op exp
        //     ::= (exp op exp)
        // op  ::= + | - | * | / | %
        // a + b | a > b
        // (a + b) * 2


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
        // var _BasicExp = Plus(Char(/[^\}]/));
        var _BasicExp = Any(
            _NameSpace,
            _String,
            Char(/\(/),
            Char(/\)/),
            Char(/[+\-*/%]/),
            Char(/[\!\<\>\=\&]/),
            Str(["\\\|","\\\|"]),
            Char(/\d/),
            blank
        );
        _BasicExp = Plus(_BasicExp);

        var _ifExp = Capture(_BasicExp,"expression");
        _ifExp = Capture(_ifExp,"@ifexpend","@ifexpstart");
        var _ElseIfOne = All(
          All(
            _delimeter_start,
            optblanks,
            _elseif,
            blanks,
            _ifExp,
            _delimeter_end
          ),
          Capture(Rule,"@ifbodyend","@ifbodystart")
        );
        _ElseIfOne = Capture(_ElseIfOne,"@elseifend","@elseifstart");
        var _ElseIf = Optional(
          Plus(_ElseIfOne)
        );
        var _Else = Optional(
          All(
            All(
              _delimeter_start,
              optblanks,
              _else,
              optblanks,
              _delimeter_end
            ),
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
          All(
            _delimeter_start,
            optblanks,
            _ifEnd,
            optblanks,
            _delimeter_end
          )
        );
        If = Capture(If,"@ifend","@ifstart");
        //------------------------------  if  ------------------------------


        //------------------------------  var ------------------------------
        var VarName = All(
          _delimeter_start,
          optblanks,
          Capture(varname,"var"),
          optblanks,
          _delimeter_end
        );
        //------------------------------  var ------------------------------

        //------------------------------  set ------------------------------
        var Set = All(
          _delimeter_start,
          Char(/#/),
          Str("set"),
          optblanks,
          _NameSpace,
          optblanks,
          Char(/=/),
          optblanks,
          Capture(_BasicExp,"expression"),
          optblanks,
          _delimeter_end
        );
        Set = Capture(Set,"@setend","@setstart");
        //------------------------------  set ------------------------------


        //------------------------------anything------------------------------
        var AnyThingElse = Capture(Plus(Char(/[^\{\}]/)),"string");
        //------------------------------anything------------------------------

        return Any(
          Each,
          If,
          Set,
          VarName,
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
    glob.MEngine || (glob.MEngine = {});
    glob.MEngine.Grammar = Grammar;
  }
})(this);
