function scopeeval(scr,scope){
  (new Function("with(this){"+ scr +"}")).call(scope);
}
scopeeval('if(num == 3){console.log(arguments)}',{num:3,arguments:1});

