var Parser = require('rd-parse');

var Grammar = function(All, Any, Plus, Optional, Char, Capture){

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
  //////////////////// tools ////////////////////


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

  _Number = Capture(_Number,"number");
  return _Number;
};

var start = +new Date;
var parser = new Parser(Grammar);
var ret;

ret = parser.parse("122");
ret = parser.parse("+122");
ret = parser.parse("+ 122");
ret = parser.parse("+ 122.");
ret = parser.parse("+ 122.1");
ret = parser.parse("+ 122.0");
ret = parser.parse("1e10");
ret = parser.parse("1.0E10");
ret = parser.parse("1.E10");

console.log(
  ret[1].value
)

var end = +new Date;
console.log(
  end - start
)