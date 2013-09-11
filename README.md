## 编译成多种目标语言的模板引擎（开发中，请勿直接使用）

### 编译为js代码

```javascript
var o = MEngine.compile('hi {name}')
```

`o`是一个具有`compile`方法的对象

```javascript
{
  render:function(env){
    var __s__= "";
    __s__ += "hi "
    __s__ += env.name
    return __s__;
  }
}
```
调用`render`方法

```javascript
o.render({name:"Tom"})
```

==>

```
hi Tom
```


### 生成php代码

to be test

### 生成vm

to be test

### 生成Java代码

to be test

## MIT Licence

