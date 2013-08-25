var Y = function (gen) {
  return (function(f) {return f(f)})( function(f) {
           return gen(function() {return f(f).apply(null, arguments)});
         });
}

var Grammar = function(All, Any, Plus, Optional, Char, Capture){
  // String Rule
  var Str = function(str){
    var as = str.split('');
    var rules = [];
    as.forEach(function(c){
      rules.push(Char(new RegExp(c.replace(/\\/,"\\\\"))));
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
    Str("\\'"),
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
    Str('\\"'),
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
  var mathops = Char(/[\+\-\*\/><=%]/)

  var blank = Char(/\s/);
  var optblank = Optional(blank);
  var blanks = Plus(blank);
  var optblanks = Optional(blanks);

  // 变量名规则:字母或数字 TODO 可以是下划线开头，可以有中划线
  var varname = Plus(Az);

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
      Rule = Plus(Rule);
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

      //{#if exp}
      //{#if a > b}
      var _ifStart = Str("#if")
      var _elseif = Str("#elseif")
      var _else = Str("#else")
      var _ifEnd = Str("/if")

      var _atom = Any(
        Capture(varname,"var"),
        Capture(Number,"number"),
        _String
      );
      // 基本表达式
      // a + b | a > b
      // (a + b) * 2
      var _BasicExp = Y(
        function(mathexp){
          var op = Capture(mathops,"operation");
          // ( a + b )
          var e1 = All(
            Char(/\(/),
            optblanks,
            _atom,
            optblanks,
            op,
            optblanks,
            mathexp,
            optblanks,
            Char(/\)/)
          );

          // a + b
          var e2 = All(
            _atom,
            optblanks,
            op,
            optblanks,
            mathexp
          );
          // ( a )
          var e3 = All(
            Char(/\(/),
            optblanks,
            _atom,
            optblanks,
            Char(/\)/)
          );

          // a || number
          var e4 = _atom;

          var e12 = Any(
            e1,
            e2
          );
          var e34 = Any(
            e3,
            e4
          );
          return Any(
            e12,
            e34
          );
        });

      var _ifExp = _BasicExp;
      _ifExp = Capture(_ifExp,"@ifexpend","@ifexpstart");
      var _ElseIf = Optional(
        Plus(All(
          All(
            _delimeter_start,
            optblanks,
            _elseif,
            blanks,
            _ifExp,
            optblanks,
            _delimeter_end
          ),
          Capture(Rule,"@ifbodyend","@ifbodystart")
        ))
        );
      _ElseIf = Capture(_ElseIf,"@elseifend","@elseifstart");

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
      var If  = All(
        _delimeter_start,
        _ifStart,
        blanks,
        _ifExp,
        optblanks,
        _delimeter_end,
        Capture(Rule,"@ifbodyend","@ifbodystart"),           //if yes
        _ElseIf,
        _Else,
        All(            //end if
          _delimeter_start,
          optblanks,
          _ifEnd,
          optblanks,
          _delimeter_end
        )
      );
      If = Capture(If,"@ifend","@ifstart");
      // 变量 {varname}
      var VarName = All(
        _delimeter_start,
        optblanks,
        Capture(varname,"var"),
        optblanks,
        _delimeter_end
      );

      // anything except { }
      var AnyThingElse = Capture(Plus(Char(/[^\{\}]/)),"string");

      return Any(
        Each,
        If,
        VarName,
        AnyThingElse
      );
    });
  // --------------------
  // var test = Plus(Char(/a/));
  // test = Capture(test,"ab")
  // Rule = _String;
  // --------------------
  Rule = Plus(Rule);
  return Rule;
}

module.exports = Grammar;

