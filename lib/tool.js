var isnumber = function(n){
  return !isNaN(n);
};
exports.isnumber = isnumber;

var isstring = function(s){
  return toString.call(s) === "[object String]";
};
exports.isstring = isstring;

var isbool = function(b){
  return toString.call(b) === "[object Bool]";
}

exports.isbool = isbool;

exports.isarray = function(a){
  return Array.isArray(a);
}
function isregexp(r){
  return toString.call(r) === "[object RegExp]";
}
exports.isregexp = isregexp;

exports.isAtom = function(o){
  return isnumber(o) || isbool(o) || isregexp(o);
}

exports.isNumber = function(list){
  return list[0] === 'number';
}

exports.isString = function(list){
  return list[0] === 'string';
}

exports.isIfBlock = function(list){
  return list[0] === "if";
}

exports.isEachBlock = function(list){
  return list[0] === "each";
}

exports.isVar = function(list){
  return list[0] === "var";
}

var BASIC_MATH_OPERATION = ["+","-","*","/","%"];
exports.isBasicMathOperation = function(list){
  return BASIC_MATH_OPERATION.indexOf(list[0]) > -1;
}

exports.substitue = function(s,env){
  return s.replace(/\\?\{([^{}]+)\}/g, function (match, name) {
           if (match.charAt(0) === '\\') {
             return match.slice(1);
           }
           return (env[name] === undefined) ? '' : env[name];
         });
}











