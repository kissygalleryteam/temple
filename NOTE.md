##  JIT
- `string` in template

	This is template 

- `string` in js
    
	s += "This is template"

- `var` in template

    hello {{name}}

- `var` in js
    s += name;

- `if` in template

	{{#if index > 0}}
	hi world
	{{/if}}
	
	{#if index > 0}
	  yeah
	{#else}
	  oops
	{/if}

	{#if index > 0}
	  yeah
	{#else if index > 1}
	  foo
	{#else}
	  bar
	{/if}


- `if` in js

	if(index > 0){
	  s += "hi world"
	}
	
	if(index > 0){
	  s += "yeah";
	}else{
	  s += "oops"; 
	}

	if(index > 0){
	  s += "yeah";
	}else if(index > 1){
	  s += "foo";
	}else{
	  s += "bar";
	}

- `each` in template

	{{#each items as item index}}
	  hi{{item.name}}@{{index}}{{foo}}
	{{/each}}

- `each` in js

    var _items = this['items'];
	var _foo = this['foo'];
    for(var i=0,l=_items.length;i<l;i++){
	  s += "\nhi";
	  //item --> _item
	  var _item = items[i];
	  s += _item.name;
	  //若定义了index --> _index;
	  var _index = i;
	  s += _index;
	  //若还有其它变量
	  s += _foo;
	  s += '\n';
	}

- `set` in template

    {{#set name = val}}

- `set` in js

    var name = val;
