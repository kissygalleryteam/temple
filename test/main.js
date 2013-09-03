var regvar = /[a-zA-Z_$][a-zA-Z_$0-9]*/g;
//
var s = "_aa bb ab abc (bar > foo)";
var r;
var vars = [];
while((r = regvar.exec(s))){
  //console.log(r[0]);
}
s = s.replace(regvar,function(m,a){
  //console.log(m);
  return "env."+m;
})
console.log(s);