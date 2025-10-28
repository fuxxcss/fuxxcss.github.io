---
title: "编程语言：Google风格指南（Part 1/2）"
excerpt: 'Python，C++，Go'

collection: theory
category: basic
permalink: /theory/basic/code-style
tags: 
  - 8gu
  - python

layout: single
read_time: true
author_profile: false
comments: true
share: true
related: true
---

![](../../images/theory/basic/styleguide.png)

## Python风格指南

### 一、包管理

**1.模块导入规范**

只对包和模块使用import，不要对单个类型、类或函数使用，例如，可以像下面这样导入模块 `sound/effects/echo.py`。

``` python
from sound.effects import echo
...
echo. EchoFilter(input, output, delay=0.7, atten=4)
```

或者使用模块的完整路径名位置导入模块。

``` python
import sound.effects.echo 
...
sound.effects.echo. EchoFilter(input, output, delay=0.7, atten=4)
```

### 二、异常

**1.自定义异常**

库或包可以定义自己的异常。这样做时，它们必须继承现有的异常类。异常名称应该以Error结尾，并且不应该引入重复（foo.FooError）。

**2.抛出异常**

异常情况必须符合以下条件：
- 有意义时使用内置异常类。例如，抛出ValueError来指出编程错误，比如违反了前置条件，比如在验证函数参数时可能发生的错误。
- 不要用assert语句代替条件语句或验证前置条件。

一个正确的抛出异常如下。
``` python
def connect_to_next_port(self, minimum: int) -> int:
    """Connects to the next available port.

    Args:
      minimum: A port value greater or equal to 1024.

    Returns:
      The new minimum port.

    Raises:
      ConnectionError: If no available port is found.
    """
    if minimum < 1024:
      # Note that this raising of ValueError is not mentioned in the doc
      # string's "Raises:" section because it is not appropriate to
      # guarantee this specific behavioral reaction to API misuse.
      raise ValueError(f'Min. port must be at least 1024, not {minimum}.')
    port = self._find_next_open_port(minimum)
    if port is None:
      raise ConnectionError(
          f'Could not connect to service on port {minimum} or higher.')
    # The code does not depend on the result of this assert.
    assert port >= minimum, (
        f'Unexpected port {port} when minimum was {minimum}.')
    return port
```

**3.捕获异常**

永远不要使用catch-all except:语句，或者捕获Exception和StandardError，除非特殊情况：
- 重新抛出异常。
- 在程序中创建一个隔离点，异常不会传播，而是被记录和抑制，例如通过保护最外层的块来保护线程不崩溃。

减少try/except代码块中的代码量。try语句的主体越大，意外引发异常的代码行引发异常的可能性就越大。在这种情况下，try/except代码块会隐藏真正的错误。

不管try块中是否抛出异常，都使用finally子句执行代码。这通常用于清理，例如关闭文件。

### 三、表达式

**1.三元运算**

用于三元运算，减少冗余。

``` python
   one_line = 'yes' if predicate(value) else 'no'
    slightly_split = ('yes' if predicate(value)
                      else 'no, nein, nyet')
    the_longest_ternary_style_that_can_be_done = (
        'yes, true, affirmative, confirmed, correct'
        if predicate(value)
        else 'no, false, negative, nay')
```

**2.隐式false**

所有空值都被认为是false，因此0、None、[]、{}和''在布尔值上下文中都被视为false。

如果可能的话，尽可能使用隐式false，例如，if foo：而不是if foo ！=[]:，但是有以下的特例：
- 总是使用if foo is None（或 is not None）来检查是否为None。
- 永远不要使用 == 将布尔变量与False进行比较。
- 对于序列（字符串、列表、元组），使用空序列为false的事实。
- 在处理整数时，隐式false可能涉及的风险大于收益（即意外地将None处理为0）。

``` python
if not users:
  print('no users')

if i % 10 == 0:
  self.handle_multiple_of_ten()

def f(x=None):
  if x is None:
    x = []
```

### 四、函数

**1.默认参数**

不要在函数或方法定义中使用可变对象作为默认值。

```python
Yes: def foo(a, b=None):
         if b is None:
             b = []
Yes: def foo(a, b: Sequence | None = None):
         if b is None:
             b = []
Yes: def foo(a, b: Sequence = ()):  # Empty tuple OK since tuples are immutable.
No:  def foo(a, b=[]):
         ...
No:  def foo(a, b=time.time()):  # Is `b` supposed to represent when this module was loaded?
         ...
No:  def foo(a, b=_FOO.value):  # sys.argv has not yet been parsed...
         ...
No:  def foo(a, b: Mapping = {}):  # Could still get passed to unchecked code.
         ...
```

**2.属性**

属性应该使用@property装饰器创建。