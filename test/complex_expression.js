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

  // ==================== _ComplexExp ====================

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

  var atom = Any(
    All(unary,optblanks,proton),
    All(unary,optblanks,Char(/\(/),optblanks,proton,optblanks,Char(/\)/)),
    _Bool,
    proton
  );
  atom = Capture(atom,"expatom");

  var commar = Capture(Char(/,/),"expatom");
  var preBrack = Capture(Char(/\(/),"expatom");
  var exBrack = Capture(Char(/\)/),"expatom");
  var _Dot = Capture(Char(/\./),"expatom");

  var _ComplexExp = Y(function(exp){
                      var arg = Y(function(rule){
                                  return Any(
                                    All(exp,optblanks,commar,optblanks,rule),
                                    exp
                                  );
                                });
                      var fn = All(Optional(unary),optblanks,_NameSpace,optblanks,preBrack,optblanks,Optional(arg),optblanks,exBrack);
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
  // ==================== _ComplexExp ====================
  _ComplexExp = Capture(_ComplexExp,"exp");
  return _ComplexExp;
}

var start = +new Date;
var parser = new Parser(Grammar);
var ret;

ret = parser.parse("(2).toFixed(2)");
// ret = parser.parse("'abc'.toString()");
// ret = parser.parse("(2 + 3).toFixed(2)");
// ret = parser.parse("+parseInt()");
// ret = parser.parse("parseInt()");
// ret = parser.parse("parseInt(1,2)");
// ret = parser.parse("(a+(b))");
// ret = parser.parse("(a+b+(c+d+(e+f+(g+h))))");
// ret = parser.parse("(a+b+(c+d+(e+f+(g+h)))).length");
ret = parser.parse("(a+b+(c+d+(e+f+(g+h)))).toFixed()");
ret = parser.parse("(a+b+(c+d+(e+f+(g+h)))).toFixed() + 'abc'.length() + (2).toString(1,2,3)");
// ret = parser.parse("(a+b+(a+b))");
// ret = parser.parse("(a+b+c+(e))/2");
// ret = parser.parse("!a");
// ret = parser.parse("!(a)");
// ret = parser.parse("1+b(a,b)+1");
// ret = parser.parse("b(1)+1");
// ret = parser.parse("!a-b");
// ret = parser.parse("!(a+b+1)+d");
// ret = parser.parse("!(a+b)+c+2");
// ret = parser.parse("a&&b");
// ret = parser.parse("a||b");
// ret = parser.parse("a|2");
// ret = parser.parse("1|2");
// ret = parser.parse("1^2");
// ret = parser.parse("a + 'abc'");
// ret = parser.parse("a += 'abc'");
// ret = parser.parse("escape(a+b)");
// ret = parser.parse("!escape( a + b)");
// ret = parser.parse("a+2/(a+b)");
// ret = parser.parse("!(a+b)");
// ret = parser.parse("a+!escape(a+b)+d+bla");
// ret = parser.parse("a+escape(a+b)+d+bla");
// ret = parser.parse("ab+escape(a+b)+d+bla");
// ret = parser.parse("ab+escape(a+b) + unescape(2,3)");
// ret = parser.parse("Math.round(1)+Math.ceil(2)");
// ret = parser.parse("Math.round(1+b+(c/2))");
ret = parser.parse("Math.round(1.0)");

console.log(
  ret[1].value
)

var end = +new Date;
console.log(
  end - start
)