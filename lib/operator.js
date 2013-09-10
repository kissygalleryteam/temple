// 表达式求值
// http://www.cnblogs.com/zabery/archive/2010/08/11/1797602.html

function precede(a,b){
  var ops = "+-*/()#";
  var table = [
//       "+" "-" "*" "/" "(" ")" "#"
/* + */ [">",">","<","<","<",">",">"],
/* - */ [">",">","<","<","<",">",">"],
/* * */ [">",">",">",">","<",">",">"],
/* / */ [">",">",">",">","<",">",">"],
/* ( */ ["<","<","<","<","<","="," "],
/* ) */ [">",">",">",">"," ",">",">"],
/* # */ ["<","<","<","<","<"," ","="]
  ];
  var row = ops.indexOf(a)
    , col = ops.indexOf(b);
  return table[row][col];
}

//op 是否为运算符
function isoperater(op){
  var ops = "+-*/()#";
  return ops.indexOf(op) == -1;
}

//基本运算
function operate(a,b,operater){
  var ret = NaN;
  switch(operater){
    case "+":
    ret = a+b;
    break;
    case "-":
    ret = a-b;
    break;
    case "*":
    ret = a*b;
    break;
    case "/":
    ret = a/b;
    break;
  }
  return ret;
}

function peek(arr){
  var l = arr.length;
  if(l > 0){
    l = l-1;
  }
  return arr[l];
}

function computeExpression(infixExpression){
  var stackOperand = [];//操作数栈
  var stackOperator = [] //操作符栈
  stackOperator.push('#');  //作为栈空的结束符
  // infixExpression = infixExpression + "#"; //中缀表达式的结束符
  infixExpression.push("#");
  var temp = 0,
      result = 0,
      count = 0;
  var cur = infixExpression[count];
  while (cur != "#" || peek(stackOperator) != '#'){ //扫描完算术表达式，并且操作符栈为空
    if (cur == ' ') continue;
    if (isoperater(cur)){ //操作数直接入栈
      stackOperand.push(parseInt(cur));
      cur = infixExpression[++count]; //扫描算术表达式下一位
    }else{
      var op = peek(stackOperator);
      var opresult = precede(op, cur);
      switch (opresult){ //比较操作符栈顶元素和扫描的当前算符的优先级
        //当前运算符优先级较大，则直接入栈，置于栈顶(优先级高需先计算)
        case '<':
        stackOperator.push(cur);
        cur = infixExpression[++count];
        break;
        //等于则表示栈顶元素为左括号，当前字符为右括号
        case '=':
        stackOperator.pop();//弹出左括号
        cur = infixExpression[++count];
        break;
        //当前运算符优先级小，则弹出栈顶运算符并从操作数栈弹出两个操作数
        case '>':
        temp = stackOperand.pop();
        result = stackOperand.pop();
        //注意计算的顺序，计算结果入操作数栈，并且继续比较新的栈顶操作符和当前操作符的优先级
        stackOperand.push(operate(result, temp, op));
        //operate消耗掉一个算符
        stackOperator.pop();
        break;
      }
    }
  }
  return peek(stackOperand);
}

// console.log(
//   computeExpression("1+2".split(""))
// )
// console.log(
//   computeExpression([1,"+",-2])
// )

// console.log(
//   computeExpression([-2,"+",1])
// )

// console.log(
//   computeExpression("(1+2)*5/5".split(""))
// )

// console.log(
//   computeExpression("1+2*5/5".split(""))
// )


// exp ::= number
//     ::= var
//     ::= unary + exp
//     ::= exp + binary + exp
//
// unary ::= + - !
//
// binary::= + - * / %
//

// -1+2  ==> [-1,"+",2]