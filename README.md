## Temple 模板引擎 (线上环境慎用)

### Features
- if/elseif/else
- each
- include 子模板
- extend 模板继承
- if 表达式支持嵌套
- 自定义函数
- 编译后的代码非常直观,不信你看 
- 语法类似KISSY 1.2 Template ,不过少了个花括号

### 用法

```javascript
KISSY.use('gallery/temple/1.0/index', function (S, Temple) {
     Temple.add("base","this is head , my name is {#block name} jerry {/block}!");
     var temple = Temple.compile('{#extend base} {#block name} john {/block}'));
	 var html = temple.render({name:"Tom"});
	 console.log(html);
})
```
### 支持语法示例

```javascript
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

```

## Licence

