---
title: JavaScript 中几个常被忽略的细节
date: 2026-07-20 10:00:00
tags:
  - JavaScript
  - 笔记
categories:
  - 技术
---

工作几年后回头看 JS，发现有些知识点平时用得不多，但出问题时容易踩坑。整理几个值得记一下的。

<!-- more -->

## 1. `typeof null === 'object'`

这是一个历史遗留的 bug，1997 年就存在了，至今未修复：

```js
typeof null          // 'object'
typeof undefined     // 'undefined'
typeof []            // 'object'
typeof function(){}  // 'function'
```

判断空值用 `value === null` 最稳。

## 2. 数组的 `sort` 默认按字符串排序

```js
[10, 2, 30].sort()        // [10, 2, 30]（按字符串比较 '10' < '2' < '30'）
[10, 2, 30].sort((a, b) => a - b)  // [2, 10, 30]（按数字）
```

数字排序一定要传比较函数。

## 3. `==` 与 `===`

`==` 会做隐式类型转换，规则繁琐容易出错。**新代码一律用 `===`**。

```js
'' == false              // true
null == undefined        // true（这个可以记一下）
'0' == false             // true
[] == false              // true（！）
```

## 4. `let` 的暂时性死区（TDZ）

```js
console.log(a)  // ReferenceError
let a = 1
```

`let` / `const` 在声明前访问会报错，而不是像 `var` 那样拿到 `undefined`。

## 5. `Promise.all` 失败立即返回

```js
Promise.all([fetchA(), fetchB(), fetchC()])
  .then(...)
  .catch(err => console.log(err))  // 任一失败就进 catch
```

如果想要"全部跑完再看结果"，用 `Promise.allSettled`（ES2020）。

## 6. JSON 的小坑

```js
JSON.stringify(undefined)   // undefined（被忽略）
JSON.stringify({a: undefined})  // '{}'
JSON.parse('{"a":1}').a     // 1
JSON.parse('{"a":1}').b     // undefined
```

对象属性值为 `undefined` 会被自动忽略，序列化时不会出现在结果里。

## 结语

JS 这门语言细节多，但只要养成"先查文档再写代码"的习惯，大部分坑都能避开。共勉。