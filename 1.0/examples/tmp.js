//-------------------- if --------------------

  '{#if name}'
    + '{name}'
+ '{/if}'


  '{#if name}'
    + '{name}'
+ '{#else}'
    + 'noname'
+ '{/if}'



  '{#if name}'
    + '{name}'
+ '{#elseif sex}'
    + '{sex}'
+ '{#else}'
  + 'oops'
+ '{/if}'

//-------------------- each --------------------
  '{#each items as item index}'
    + '{index} : {item.name}'
+ '{/each}';

//-------------------- include --------------------

Temple.add("head","<h1>共用头</h1");
Temple.add("foot","<h1>共用脚</h1");

var template = '{#include head}'
             + '<p>身体是你自己的</p>'
             + '{#include foot}';
var temple = Temple.compile(template);


//-------------------- extend --------------------

Temple.add("base","<h1>共用头</h1"
                  + "{#block body}"
                    + "<p>大家都公用的身体</p>"
                  + "{/block}"
                + "<h1>共用脚</h1>");

var app = '{#extend base}'
        + '{#block body}'
        + '<p>你自己的身体</p>'
        + '{/block}';

var temple = Temple.compile(app);


//-------------------- 自定义函数 --------------------

Temple.reg("myescape",function(s){
  return escape(s);
});

var temple  = Temple.compile('{myescape(htmlstr)}');


//-------------------- 注释 --------------------

'{#!this is a line of comment}';

'{#! 可以包含"{"、"#"、"\\}" }';

'{#! 中文注释} 中文字符串abc';

