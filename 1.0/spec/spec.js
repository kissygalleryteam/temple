describe('if/elseif/else', function () {
  it('#if', function () {
    var temple = Temple.compile('{#if name}{name}{/if}');
    var html = temple.render({name:"tom"});
    expect(html).to.be("tom");
  });
  it('#if/else', function () {
    var temple = Temple.compile('{#if name}{name}{#else}no name{/if}');
    var html = temple.render({name:"tom"});
    expect(html).to.be("tom");
  });
  it('#if/elseif/else', function () {
    var temple = Temple.compile('{#if name}{name}{#elseif "b"}b{#else}c{/if}');
    var html = temple.render({name:"tom"});
    expect(html).to.be("tom");
  });
});

describe('each', function () {
  it('#each', function () {
    var temple = Temple.compile('{#each items as item index}'
                                  + '{index}:{item}'
                              + '{/each}');
    var html = temple.render({items:["a","b"]});
    expect(html).to.be("0:a1:b");
  });
});

describe('extend', function () {
  it('#extend', function () {
    Temple.add("base","<h1>共用头</h1>"
                      + "{#block body}"
                        + "<p>大家都公用的身体</p>"
                      + "{/block}"
                    + "<h1>共用脚</h1>");
    var app = '{#extend base}'
            + '{#block body}'
            + '<p>你自己的身体</p>'
            + '{/block}';

    var temple = Temple.compile(app);
    var html = temple.render();
    expect(html).to.be("<h1>共用头</h1><p>你自己的身体</p><h1>共用脚</h1>");
  });
});

describe('fn', function () {
  it('#reg', function () {
    Temple.reg("myescape",function(s){
      return escape(s);
    });
    var temple  = Temple.compile('{myescape(htmlstr)}');
    var html = temple.render({htmlstr:"<p>foo</p>"});
    expect(html).to.be(escape("<p>foo</p>"));
  });
});

describe('comment', function () {
  it('#comment1', function () {
    var temple,html;
    temple  = Temple.compile('{#!this is a line of comment}');
    html = temple.render();
    expect(html).to.be(escape(""));
  });
  it('#comment2', function () {
    var temple,html;
    temple  = Temple.compile('{#! 可以包含"{"、"#"、"\\}" }');
    html = temple.render();
    expect(html).to.be('');
  });
  it('#comment3', function () {
    var temple,html;
    temple  = Temple.compile('{#! 中文注释}中文字符串abc');
    html = temple.render();
    expect(html).to.be('中文字符串abc');
  });
});
