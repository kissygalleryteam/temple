## Temple 模板引擎 (线上环境慎用)

### Features
- if/elseif/else
- each
- include 子模板
- extend 模板继承
- if 表达式支持嵌套
- 自定义函数
- 编译后的代码非常直观 [Temple编译后的代码](http://tomycat.github.io/blog/temple/index.html) 
- 语法类似KISSY 1.2 Template ,不过少了个花括号

### 用法

```javascript
KISSY.use('gallery/temple/1.0/index', function (S, Temple) {
     Temple.add("base","this is head , my name is {#block name} jerry {/block}!");
     var temple = Temple.compile('{#extend base} {#block name} john {/block}');
	 var html = temple.render({name:"Tom"});
	 console.log(html);
})
```
### Method

- `Temple.compile` 将模板编译为可以直接执行的js函数
- `Temple.to_js` 将模板编译为js代码字符串,用于调试或者预编译

### 支持语法示例

```javascript
//-------------------- if --------------------

var template = '{#if name}'
				 + 'hi {name}'
			 + '{/if}'

var temple = Temple.compile(template);
temple.render({name:"tom"});
// -> tom

var template = '{#if name}'
				 + '{name}'
			 + '{#else}'
				 + 'noname'
			 + '{/if}'
		 
var temple = Temple.compile(template);
template.render({name:"tom"});


var template = '{#if name}'
				 + '{name}'
			 + '{#elseif sex}'
				 + '{sex}'
			 + '{#else}'
			   + 'oops'
			 + '{/if}'
var temple = Temple.compile(template);
temp.render({name:"tom"});
// -> tom

//-------------------- each --------------------

 var template =  '{#each items as item index}'
				   + '{index} : {item.name}'
			   + '{/each}';
 
var temple = Temple.compile(template);

 temple.render([
 {name:"john"}
 ]);


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

