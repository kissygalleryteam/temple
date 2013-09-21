var Parser = require('rd-parse')

var Y = function (gen) {
  return (function(f) {
            return f(f);
          })(function(f) {
               return gen(function() {
                        return f(f).apply(null, arguments);
                      });
             });
};

var Grammar = function(All, Any, Plus, Optional, Char, Capture){

  var isarray = Array.isArray ? Array.isArray:function(s){
                                                return toString.call(s) === "[object Array]";
                                              };
  var each = Array.forEach ? Array.forEach:function(arr,fn){
                                             for(var i=0,l=arr.length;i<l;i++){
                                               fn(arr[i]);
                                             }
                                           };
  var blank = Char(/\s/);
  var optblank = Optional(blank);
  var blanks = Plus(blank);
  var optblanks = Optional(blanks);

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

  var var_pre = Plus(Any(Char(/[a-zA-Z_$]/)));
  var var_body = Optional(Plus(Any(Char(/[a-zA-Z_$0-9]/))));
  var varname = All(var_pre,var_body);

  // Number ::= 0
  //        ::= 123
  //        ::= 123
  //
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
  var _NameSpace = Y(function(ns){
                     return Any(
                       All(varname,Char(/\./),ns),
                       varname
                     );
                   });

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

  //==================== tools ====================

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

  var atom = Any(
    _Bool,
    All(unary,proton),
    proton
  );

  var _ComplexExp = Y(function(exp){
                      var complex = Any(
                        // 函数调用
                        // escape(a+b) + c
                        All(Optional(unary),optblanks,_NameSpace,optblanks,Char(/\(/),optblanks,Any(All(atom,exp),atom),optblanks,Char(/\)/),optblanks,op,optblanks,exp),
                        // 函数调用
                        // escape(a+b)
                        All(Optional(unary),optblanks,_NameSpace,optblanks,Char(/\(/),optblanks,Any(All(atom,exp),atom),optblanks,Char(/\)/)),
                        // (a+b)/c
                        // !(a+b)/c
                        All(Optional(unary),optblanks,Char(/\(/),optblanks,atom,optblanks,op,optblanks,exp,optblanks,Char(/\)/),optblanks,op,optblanks,exp),
                        // (a+b/c)
                        // !(a+b/c)
                        All(Optional(unary),optblanks,Optional(_NameSpace),optblanks,Char(/\(/),optblanks,atom,optblanks,op,optblanks,exp,optblanks,Char(/\)/)),
                        // a+b+c
                        All(atom,optblanks,op,optblanks,exp));
                      return Any(
                        complex,
                        atom);
                    });
  _ComplexExp=Capture(_ComplexExp,"exp");
  return _ComplexExp;
}

var parser = new Parser(Grammar);
var ret;
ret = parser.parse("(a +b  +c+(d/e))/2");
ret = parser.parse("!a");
ret = parser.parse("!a-b");
ret = parser.parse("!(a+b)+c+2");
ret = parser.parse("a&&b");
ret = parser.parse("a||b");
ret = parser.parse("a|2");
ret = parser.parse("1|2");
ret = parser.parse("1^2");
ret = parser.parse("a + 'abc'");
ret = parser.parse("a += 'abc'");
ret = parser.parse("!escape( a + b)");
ret = parser.parse("!escape(a+b) + d + bla");
console.log(
  ret[1].value
)